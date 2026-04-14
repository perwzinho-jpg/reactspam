import db from '../config/database.js';
import zapi from '../utils/zapi.js';
import antiBan from '../utils/antiBan.js';
import { processTemplate } from '../controllers/templatesController.js';
import crypto from 'crypto';

class CampaignProcessor {
  constructor() {
    this.processing = new Set();
    this.instanceRotation = {};
    this.MAX_RETRIES = 3; // Maximum number of retry attempts per number
  }

  // Ensure retry_count column exists
  async ensureRetryCountColumn() {
    try {
      await db.query('SELECT retry_count FROM campaign_numbers LIMIT 1');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        try {
          await db.query(
            'ALTER TABLE campaign_numbers ADD COLUMN retry_count INT DEFAULT 0 AFTER error_message'
          );
        } catch (alterError) {
          if (!alterError.message.includes('Duplicate column name')) {
          }
        }
      }
    }
  }

  // Start processing a campaign
  async processCampaign(campaignId) {
    console.log(`[CampaignProcessor] Starting processing for campaign ${campaignId}`);
    if (this.processing.has(campaignId)) {
      console.log(`[CampaignProcessor] Campaign ${campaignId} already processing, skipping`);
      return;
    }

    this.processing.add(campaignId);

    // Ensure retry_count column exists
    await this.ensureRetryCountColumn();

    try {
      while (true) {
        // Get campaign status
        const [campaigns] = await db.query(
          'SELECT * FROM campaigns WHERE id = ?',
          [campaignId]
        );

        if (campaigns.length === 0 || campaigns[0].status !== 'processing') {
          break;
        }

        const campaign = campaigns[0];

        // Reset numbers stuck in 'processing' status (instance_id is NULL means they're stuck)
        await db.query(
          `UPDATE campaign_numbers 
           SET status = 'pending', error_message = NULL, instance_id = NULL
           WHERE campaign_id = ? AND status = 'processing' AND instance_id IS NULL`,
          [campaignId]
        );

        // Get next number to process (ordered by send_order and id for sequential sending)
        const [numbers] = await db.query(
          'SELECT * FROM campaign_numbers WHERE campaign_id = ? AND status = ? ORDER BY send_order ASC, id ASC LIMIT 1',
          [campaignId, 'pending']
        );

        if (numbers.length === 0) {
          // Campaign completed
          await db.query(
            'UPDATE campaigns SET status = ?, completed_at = NOW() WHERE id = ?',
            ['completed', campaignId]
          );
          // Clean up rotation tracking
          delete this.instanceRotation[campaignId];

          // Emit campaign status changed event FIRST (so UI updates status)
          if (global.io) {
            global.io.to(`campaign:${campaignId}`).emit('campaign-status-changed', {
              campaignId,
              status: 'completed'
            });
          }

          // Emit campaign completed event (so UI can remove from list)
          if (global.io) {
            global.io.to(`campaign:${campaignId}`).emit('campaign-completed', {
              campaignId,
              status: 'completed'
            });
          }

          break;
        }

        const number = numbers[0];
        console.log(`[CampaignProcessor] Processing number ${number.phone_number} for campaign ${campaignId}`);

        // Get next instance using rotation (every 3 messages)
        // Get next available instance (with fallback to other instances if one is disconnected)
        const instance = await this.getNextAvailableCampaignInstance(campaignId);
        console.log(`[CampaignProcessor] Got instance:`, instance ? instance.id : 'none');

        if (!instance) {
          // Auto-pause campaign if no instance available
          await db.query(
            'UPDATE campaigns SET status = ?, paused_at = NOW() WHERE id = ?',
            ['paused', campaignId]
          );
          // Clean up rotation tracking
          delete this.instanceRotation[campaignId];

          // Emit socket event
          if (global.io) {
            global.io.to(`campaign:${campaignId}`).emit('campaign-auto-paused', {
              campaignId,
              reason: 'no_instance',
              message: 'Campanha pausada automaticamente: Nenhuma instância conectada'
            });
          }

          break;
        }

        // Check anti-ban rules
        console.log(`[CampaignProcessor] Anti-ban check for instance ${instance.id}, use_anti_ban: ${campaign.use_anti_ban}`);
        if (campaign.use_anti_ban) {
          const canSend = antiBan.canSendMessage(instance);

          if (!canSend.canSend) {
            console.log(`[CampaignProcessor] Anti-ban: waiting 1 minute`);
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
            continue;
          }
        }

        // Get template (rotate if multiple)
        const templateId = this.selectTemplate(campaign, number);
        console.log(`[CampaignProcessor] Using template ID: ${templateId}`);
        const [templates] = await db.query('SELECT * FROM templates WHERE id = ?', [templateId]);
        console.log(`[CampaignProcessor] Found ${templates.length} templates`);

        if (templates.length === 0) {
          console.log(`[CampaignProcessor] Template not found, marking as failed`);
          await db.query(
            'UPDATE campaign_numbers SET status = ?, error_message = ? WHERE id = ?',
            ['failed', 'Template não encontrado', number.id]
          );
          continue;
        }

        const template = templates[0];
        console.log(`[CampaignProcessor] Template: ${template.name}, message: ${template.message?.substring(0, 50) || 'empty'}...`);

        // Process template variables
        console.log(`[CampaignProcessor] Processing template variables...`);
        const processed = processTemplate(template, {
          var1: number.var1,
          var2: number.var2,
          var3: number.var3,
          var4: number.var4,
          var5: number.var5
        });
        console.log(`[CampaignProcessor] Processed message: ${processed.message?.substring(0, 50) || 'empty'}...`);

        // Get proxy if enabled
        console.log(`[CampaignProcessor] use_proxy: ${campaign.use_proxy}`);
        let proxy = null;
        if (campaign.use_proxy) {
          proxy = await this.getProxy(campaign.user_id);
        }

        // Mark as processing and save instance info
        // Use phone_number if available, otherwise use display_name
        console.log(`[CampaignProcessor] Marking number as processing...`);
        const instanceIdentifier = instance.phone_number || instance.display_name || `Instance ${instance.id}`;
        console.log(`[CampaignProcessor] Instance identifier: ${instanceIdentifier}`);
        await db.query(
          'UPDATE campaign_numbers SET status = ?, instance_id = ?, instance_phone = ? WHERE id = ?',
          ['processing', instance.id, instanceIdentifier, number.id]
        );
        console.log(`[CampaignProcessor] Number marked as processing`);

        // Track instance usage in campaign
        console.log(`[CampaignProcessor] Tracking instance usage...`);
        await this.trackInstanceUsage(campaignId, instance.id, instanceIdentifier);
        console.log(`[CampaignProcessor] Instance usage tracked`);

        // Emit socket event for processing status
        console.log(`[CampaignProcessor] Emitting socket event...`);
        if (global.io) {
          global.io.to(`campaign:${campaignId}`).emit('message-processing', {
            campaignId,
            numberId: number.id,
            phoneNumber: number.phone_number,
            status: 'processing',
            instanceId: instance.id,
            instancePhone: instanceIdentifier
          });
        }
        console.log(`[CampaignProcessor] Socket event emitted`);

        // Skip tracking URL - use original URL directly for better deliverability
        console.log(`[CampaignProcessor] Using original button URL: ${processed.buttonUrl || 'none'}`);
        let trackingUrl = null;
        // Tracking disabled - keeping original URL for better WhatsApp compatibility

        // Send message
        console.log(`[CampaignProcessor] Getting Z-API instance credentials for zapi_instance_id: ${instance.zapi_instance_id}`);
        const [zapiInstance] = await db.query(
          'SELECT instance_id, instance_token, client_token FROM zapi_instances WHERE id = ?',
          [instance.zapi_instance_id]
        );
        console.log(`[CampaignProcessor] Found ${zapiInstance.length} Z-API instances`);

        if (zapiInstance.length === 0) {
          await db.query(
            'UPDATE campaign_numbers SET status = ?, error_message = ? WHERE id = ?',
            ['failed', 'Instância Z-API não encontrada', number.id]
          );
          await db.query(
            'UPDATE campaigns SET failed_count = failed_count + 1, sent_count = sent_count + 1 WHERE id = ?',
            [campaignId]
          );
          continue;
        }

        const { instance_id, instance_token, client_token } = zapiInstance[0];
        console.log(`[CampaignProcessor] Z-API credentials: instance_id=${instance_id}, token=${instance_token?.substring(0,10)}...`);
        console.log(`[CampaignProcessor] Sending message to ${number.phone_number} via instance ${instance_id}...`);
        console.log(`[CampaignProcessor] Message type: imageUrl=${!!processed.imageUrl}, buttonLabel=${!!processed.buttonLabel}, buttonUrl=${!!processed.buttonUrl}`);

        let result;
        if (processed.imageUrl) {
          // Send with image
          result = await zapi.sendImageMessage(
            instance_id,
            instance_token,
            number.phone_number,
            processed.imageUrl,
            processed.message,
            proxy,
            client_token
          );
        } else if (processed.buttonLabel && processed.buttonUrl) {
          // Send with button using send-button-actions
          result = await zapi.sendButtonMessage(
            instance_id,
            instance_token,
            number.phone_number,
            {
              title: processed.title || '',
              message: processed.message,
              footer: processed.footer || '',
              buttons: [{
                label: processed.buttonLabel,
                url: processed.buttonUrl
              }]
            },
            proxy,
            client_token
          );
        } else {
          // Send text only
          const fullMessage = [
            processed.title,
            processed.message,
            processed.footer
          ].filter(Boolean).join('\n\n');

          result = await zapi.sendTextMessage(
            instance_id,
            instance_token,
            number.phone_number,
            fullMessage,
            proxy,
            client_token
          );
        }

        console.log(`[CampaignProcessor] Message send result:`, result);

        // Update number status
        if (result.success) {
          await db.query(
            'UPDATE campaign_numbers SET status = ?, sent_at = NOW(), template_used = ?, tracking_url = ?, error_message = NULL WHERE id = ?',
            ['sent', templateId, trackingUrl, number.id]
          );

          // Update campaign counters
          await db.query(
            'UPDATE campaigns SET sent_count = sent_count + 1, success_count = success_count + 1 WHERE id = ?',
            [campaignId]
          );

          // Update instance counters
          await this.updateInstanceCounters(instance.id);

          // Emit socket event for successful send
          if (global.io) {
            global.io.to(`campaign:${campaignId}`).emit('message-sent', {
              campaignId,
              numberId: number.id,
              phoneNumber: number.phone_number,
              status: 'sent',
              instanceId: instance.id,
              instancePhone: instanceIdentifier
            });
          }
        } else {
          // Determine if error is retryable (non-fatal errors)
          const retryableErrors = [
            'rate limit',
            'too many requests',
            'temporarily',
            'timeout',
            'network',
            'connection',
            '502',
            '503',
            '504'
          ];

          const isRetryable = retryableErrors.some(err =>
            result.error?.toLowerCase().includes(err)
          );

          const newStatus = isRetryable ? 'pending' : 'failed';
          const errorMessage = result.error?.substring(0, 500) || 'Erro desconhecido'; // Limit error message length

          // Keep instance info for tracking purposes (don't set to NULL)
          await db.query(
            'UPDATE campaign_numbers SET status = ?, error_message = ? WHERE id = ?',
            [newStatus, errorMessage, number.id]
          );

          // Only increment failed_count if it's actually failed (not retryable)
          if (newStatus === 'failed') {
            await db.query(
              'UPDATE campaigns SET sent_count = sent_count + 1, failed_count = failed_count + 1 WHERE id = ?',
              [campaignId]
            );
          } else {
            // For retryable errors, just increment sent_count (will be retried)
            await db.query(
              'UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?',
              [campaignId]
            );
          }

          // Check if error is due to disconnection (only for non-retryable errors)
          const disconnectionErrors = [
            'disconnected',
            'not connected',
            'instance not found',
            'qrcode',
            'instance offline'
          ];

          const isDisconnectionError = !isRetryable && disconnectionErrors.some(err =>
            result.error?.toLowerCase().includes(err)
          );

          if (isDisconnectionError) {
            // Auto-pause campaign due to connection error
            await db.query(
              'UPDATE campaigns SET status = ?, paused_at = NOW() WHERE id = ?',
              ['paused', campaignId]
            );

            // Mark instance as disconnected
            await db.query(
              'UPDATE instances SET status = ? WHERE id = ?',
              ['disconnected', instance.id]
            );
            // Emit socket event
            if (global.io) {
              global.io.to(`campaign:${campaignId}`).emit('campaign-auto-paused', {
                campaignId,
                reason: 'connection_error',
                message: 'Campanha pausada automaticamente: Erro de conexão com WhatsApp',
                error: result.error
              });
            }

            break;
          }

          // Emit socket event for failed send
          if (global.io) {
            global.io.to(`campaign:${campaignId}`).emit('message-failed', {
              campaignId,
              numberId: number.id,
              phoneNumber: number.phone_number,
              status: 'failed',
              error: result.error,
              instanceId: instance.id,
              instancePhone: instanceIdentifier
            });
          }
        }

        // Update progress percentage
        const [progress] = await db.query(
          'SELECT total_numbers, sent_count, failed_count, success_count, status FROM campaigns WHERE id = ?',
          [campaignId]
        );

        if (progress.length > 0) {
          const p = progress[0];
          const processed = p.sent_count + p.failed_count;
          const percentage = p.total_numbers > 0 ? (processed / p.total_numbers) * 100 : 0;

          await db.query(
            'UPDATE campaigns SET progress_percentage = ? WHERE id = ?',
            [percentage, campaignId]
          );

          // Emit progress update with status
          if (global.io) {
            global.io.to(`campaign:${campaignId}`).emit('campaign-progress', {
              campaignId,
              total: p.total_numbers,
              sent: p.sent_count,
              failed: p.failed_count,
              success: p.success_count,
              pending: p.total_numbers - processed,
              percentage: Math.round(percentage * 100) / 100,
              status: p.status
            });
          }
        }

        // Apply delay
        const delay = antiBan.getDelay(instance, campaign.min_interval * 1000, campaign.max_interval * 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`[CampaignProcessor] CRITICAL ERROR in campaign ${campaignId}:`, error);
      console.error(`[CampaignProcessor] Error stack:`, error.stack);
    } finally {
      this.processing.delete(campaignId);
      // Clean up rotation tracking
      delete this.instanceRotation[campaignId];
    }
  }

  // Get available instance for user with load balancing
  // Get campaign instances for rotation
  async getCampaignInstances(campaignId) {
    const [instances] = await db.query(
      `SELECT i.*, z.id as zapi_instance_id, z.instance_id as zapi_id, z.instance_token, z.client_token,
              i.phone_number,
              COALESCE(i.instance_name, z.instance_name) as display_name,
              ci.order as instance_order
       FROM campaign_instances ci
       JOIN instances i ON ci.instance_id = i.id
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE ci.campaign_id = ? AND i.status = 'connected' AND i.is_active = TRUE
       ORDER BY ci.order ASC`,
      [campaignId]
    );

    return instances;
  }

  // Get next available instance for campaign (with fallback if one disconnects)
  async getNextAvailableCampaignInstance(campaignId) {
    console.log(`[CampaignProcessor] getNextAvailableCampaignInstance called for campaign ${campaignId}`);
    // Initialize rotation tracking for this campaign if not exists
    if (!this.instanceRotation[campaignId]) {
      this.instanceRotation[campaignId] = {
        currentIndex: 0,
        messageCount: 0,
        instances: [],
        disconnectedInstances: new Set()
      };
    }

    const rotation = this.instanceRotation[campaignId];

    // Refresh instances list every 5 messages or if empty
    if (rotation.instances.length === 0 || rotation.messageCount % 5 === 0) {
      console.log(`[CampaignProcessor] Refreshing instances list for campaign ${campaignId}`);
      // Get all campaign instances (both connected and disconnected)
      let allInstances = [];
      try {
        const [instances] = await db.query(
          `SELECT i.*, z.id as zapi_instance_id, z.instance_id as zapi_id, z.instance_token, z.client_token,
                  i.phone_number,
                  COALESCE(i.instance_name, z.instance_name) as display_name,
                  ci.order as instance_order
           FROM campaign_instances ci
           JOIN instances i ON ci.instance_id = i.id
           JOIN zapi_instances z ON i.zapi_instance_id = z.id
           WHERE ci.campaign_id = ? AND i.is_active = TRUE
           ORDER BY ci.order ASC`,
          [campaignId]
        );
        allInstances = instances;
        console.log(`[CampaignProcessor] Found ${allInstances.length} instances for campaign ${campaignId}:`, allInstances.map(i => ({ id: i.id, status: i.status })));
        rotation.instances = allInstances;
      } catch (err) {
        console.error(`[CampaignProcessor] Error fetching instances:`, err);
        return null;
      }

      // Check which instances reconnected
      const previouslyDisconnected = new Set(rotation.disconnectedInstances);
      rotation.disconnectedInstances.clear();

      for (const inst of allInstances) {
        if (inst.status !== 'connected') {
          rotation.disconnectedInstances.add(inst.id);
        } else if (previouslyDisconnected.has(inst.id)) {
          // Instance reconnected!
          if (global.io) {
            global.io.to(`campaign:${campaignId}`).emit('instance-reconnected', {
              campaignId,
              instanceId: inst.id,
              instanceName: inst.display_name || inst.instance_name
            });
          }
        }
      }
    }

    // Find next connected instance
    const connectedInstances = rotation.instances.filter(i => i.status === 'connected');
    console.log(`[CampaignProcessor] Connected instances: ${connectedInstances.length}`);

    if (connectedInstances.length === 0) {
      console.log(`[CampaignProcessor] No connected instances found`);
      return null; // No connected instances
    }

    // Adjust current index if needed
    if (rotation.currentIndex >= connectedInstances.length) {
      rotation.currentIndex = 0;
    }

    // Get current instance
    const instance = connectedInstances[rotation.currentIndex];
    console.log(`[CampaignProcessor] Selected instance ${instance.id} for rotation`);

    // Verify instance is still connected (real-time check)
    const [instanceStatus] = await db.query(
      'SELECT status, instance_name FROM instances WHERE id = ?',
      [instance.id]
    );

    if (instanceStatus.length === 0 || instanceStatus[0].status !== 'connected') {
      // Instance just disconnected - notify and try next one
      if (global.io) {
        global.io.to(`campaign:${campaignId}`).emit('instance-disconnected', {
          campaignId,
          instanceId: instance.id,
          instanceName: instance.display_name || instance.instance_name,
          remainingInstances: connectedInstances.length - 1
        });
      }

      // Mark as disconnected and recurse to find next available
      rotation.disconnectedInstances.add(instance.id);
      rotation.instances = rotation.instances.map(i =>
        i.id === instance.id ? { ...i, status: 'disconnected' } : i
      );

      // Try next instance
      rotation.currentIndex = (rotation.currentIndex + 1) % Math.max(connectedInstances.length - 1, 1);
      return this.getNextAvailableCampaignInstance(campaignId);
    }

    // Increment message count
    rotation.messageCount++;

    // Rotate to next instance every 3 messages
    if (rotation.messageCount % 3 === 0 && connectedInstances.length > 1) {
      rotation.currentIndex = (rotation.currentIndex + 1) % connectedInstances.length;
      const nextInstance = connectedInstances[rotation.currentIndex];
    }

    return instance;
  }

  // Legacy function - kept for compatibility
  async getNextCampaignInstance(campaignId) {
    return this.getNextAvailableCampaignInstance(campaignId);
  }

  async getAvailableInstance(userId, excludeInstanceIds = []) {
    // Build exclusion clause if there are instances to exclude
    let exclusionClause = '';
    let queryParams = [userId, 'connected'];

    if (excludeInstanceIds.length > 0) {
      const placeholders = excludeInstanceIds.map(() => '?').join(',');
      exclusionClause = `AND i.id NOT IN (${placeholders})`;
      queryParams.push(...excludeInstanceIds);
    }

    const [instances] = await db.query(
      `SELECT i.*, z.id as zapi_instance_id, z.instance_id as zapi_id, z.instance_token, z.client_token,
              i.phone_number,
              COALESCE(i.instance_name, z.instance_name) as display_name
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.user_id = ? AND i.status = ? AND i.is_active = TRUE ${exclusionClause}
       ORDER BY i.messages_sent_today ASC, i.last_message_time ASC
       LIMIT 1`,
      queryParams
    );

    if (instances.length === 0) {
      return null;
    }

    return instances[0];
  }

  // Get all available instances for multi-instance campaigns
  async getAllAvailableInstances(userId) {
    const [instances] = await db.query(
      `SELECT i.*, z.id as zapi_instance_id
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.user_id = ? AND i.status = ? AND i.is_active = TRUE
       ORDER BY i.messages_sent_today ASC, i.last_message_time ASC`,
      [userId, 'connected']
    );

    return instances;
  }

  // Select template (rotate if multiple)
  selectTemplate(campaign, number) {
    const templates = [
      campaign.template_id,
      campaign.template_id_2,
      campaign.template_id_3
    ].filter(Boolean);

    if (templates.length === 1) {
      return templates[0];
    }

    // Round-robin selection based on number id
    const index = number.id % templates.length;
    return templates[index];
  }

  // Get proxy for user
  async getProxy(userId) {
    const [proxies] = await db.query(
      'SELECT * FROM proxies WHERE user_id = ? AND is_active = TRUE ORDER BY last_used ASC LIMIT 1',
      [userId]
    );

    if (proxies.length === 0) {
      return null;
    }

    const proxy = proxies[0];

    // Update last used
    await db.query(
      'UPDATE proxies SET last_used = NOW() WHERE id = ?',
      [proxy.id]
    );

    return {
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password
    };
  }

  // Create tracking URL
  async createTrackingUrl(campaignId, phoneNumber, templateId, originalUrl) {
    const trackingCode = crypto.randomBytes(16).toString('hex');

    await db.query(
      'INSERT INTO link_clicks (campaign_id, phone_number, template_id, original_url, tracking_code) VALUES (?, ?, ?, ?, ?)',
      [campaignId, phoneNumber, templateId, originalUrl, trackingCode]
    );

    return `${process.env.API_URL}/track/${trackingCode}`;
  }

  // Update instance counters
  async updateInstanceCounters(instanceId) {
    const [instances] = await db.query(
      'SELECT * FROM instances WHERE id = ?',
      [instanceId]
    );

    if (instances.length === 0) return;

    const instance = instances[0];

    // Reset counters if needed
    if (antiBan.shouldResetDailyCounter(instance)) {
      await db.query(
        'UPDATE instances SET messages_sent_today = 0, messages_sent_hour = 0, warmup_phase = 1, warmup_messages_sent = 0 WHERE id = ?',
        [instanceId]
      );
      return;
    }

    if (antiBan.shouldResetHourlyCounter(instance)) {
      await db.query(
        'UPDATE instances SET messages_sent_hour = 0 WHERE id = ?',
        [instanceId]
      );
    }

    // Update counters
    await db.query(
      'UPDATE instances SET messages_sent_today = messages_sent_today + 1, messages_sent_hour = messages_sent_hour + 1, warmup_messages_sent = warmup_messages_sent + 1, last_message_time = NOW() WHERE id = ?',
      [instanceId]
    );

    // Check warm-up progression
    const [updated] = await db.query(
      'SELECT * FROM instances WHERE id = ?',
      [instanceId]
    );

    if (updated.length > 0 && antiBan.shouldProgressWarmup(updated[0])) {
      const newPhase = Math.min(updated[0].warmup_phase + 1, 3);
      await db.query(
        'UPDATE instances SET warmup_phase = ? WHERE id = ?',
        [newPhase, instanceId]
      );
    }
  }

  // Track instance usage in campaign
  async trackInstanceUsage(campaignId, instanceId, instancePhone) {
    try {
      // Get current instances_used from campaign
      const [campaigns] = await db.query(
        'SELECT instances_used FROM campaigns WHERE id = ?',
        [campaignId]
      );

      if (campaigns.length === 0) return;

      let instancesUsed = [];
      try {
        instancesUsed = campaigns[0].instances_used ? JSON.parse(campaigns[0].instances_used) : [];
      } catch (e) {
        instancesUsed = [];
      }

      // Check if instance already tracked
      const existingIndex = instancesUsed.findIndex(inst => inst.id === instanceId);

      if (existingIndex === -1) {
        // Add new instance
        instancesUsed.push({
          id: instanceId,
          phone: instancePhone,
          addedAt: new Date().toISOString()
        });

        // Update campaign
        await db.query(
          'UPDATE campaigns SET instances_used = ?, active_instances_count = ? WHERE id = ?',
          [JSON.stringify(instancesUsed), instancesUsed.length, campaignId]
        );
      }
    } catch (error) {
    }
  }
}

export default new CampaignProcessor();
