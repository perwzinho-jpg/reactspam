import axios from 'axios';
import antiBan from './antiBan.js';

class ZApiService {
  constructor() {
    this.baseUrl = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';
  }

  // Get instance URL
  getInstanceUrl(instanceId, instanceToken) {
    return `${this.baseUrl}/instances/${instanceId}/token/${instanceToken}`;
  }

  // Get QR Code for connection
  async getQRCode(instanceId, instanceToken, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/qr-code/image`;
      const headers = {
        'User-Agent': antiBan.getRandomUserAgent()
      };

      if (clientToken) {
        headers['Client-Token'] = clientToken;
      }

      const response = await axios.get(url, { headers });
      let qrCode = response.data.value || response.data.qrcode || response.data.image;

      // Ensure QR code is a proper data URL for img src
      if (qrCode && !qrCode.startsWith('data:')) {
        qrCode = `data:image/png;base64,${qrCode}`;
      }

      return {
        success: true,
        qrCode: qrCode
      };
    } catch (error) {
      console.error('Z-API getQRCode error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get Phone Code (Pair Code) for connection
  async getPhoneCode(instanceId, instanceToken, phone, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/phone-code/${phone}`;
      const headers = {
        'User-Agent': antiBan.getRandomUserAgent()
      };

      if (clientToken) {
        headers['Client-Token'] = clientToken;
      }

      const response = await axios.get(url, { headers });
      return {
        success: true,
        code: response.data.code || response.data.value || response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Check instance status
  async checkStatus(instanceId, instanceToken, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/status`;
      const headers = {
        'User-Agent': antiBan.getRandomUserAgent()
      };

      if (clientToken) {
        headers['Client-Token'] = clientToken;
      }

      const response = await axios.get(url, { headers });

      return {
        success: true,
        connected: response.data.connected || response.data.state === 'CONNECTED',
        phone: response.data.phone || response.data.phoneNumber,
        pushname: response.data.pushname || response.data.accountName || null,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Send text message
  async sendTextMessage(instanceId, instanceToken, phone, message, proxy = null, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/send-text`;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': antiBan.getRandomUserAgent()
        }
      };

      if (clientToken) {
        config.headers['Client-Token'] = clientToken;
      }

      if (proxy) {
        config.proxy = {
          host: proxy.host,
          port: proxy.port,
          auth: proxy.username ? {
            username: proxy.username,
            password: proxy.password
          } : undefined
        };
      }

      const response = await axios.post(url, {
        phone: phone,
        message: message
      }, config);

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Send message with button
  async sendButtonMessage(instanceId, instanceToken, phone, data, proxy = null, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/send-button-actions`;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': antiBan.getRandomUserAgent()
        }
      };

      if (clientToken) {
        config.headers['Client-Token'] = clientToken;
      }

      if (proxy) {
        config.proxy = {
          host: proxy.host,
          port: proxy.port,
          auth: proxy.username ? {
            username: proxy.username,
            password: proxy.password
          } : undefined
        };
      }

      // Format buttons for Z-API send-button-actions endpoint
      // Z-API expects: { type: "URL", label: string, url: string, id?: string }
      const buttonActions = (data.buttons || [])
        .filter(button => button && (button.label || button.title) && button.url)
        .map((button, index) => ({
          id: `${index + 1}`,
          type: 'URL',
          label: button.label || button.title,
          url: button.url
        }));

      if (buttonActions.length === 0) {
        throw new Error('At least one button with label and url is required');
      }

      const payload = {
        phone: phone,
        message: data.message,
        ...(data.title && { title: data.title }),
        ...(data.footer && { footer: data.footer }),
        buttonActions: buttonActions
      };

      console.log(`[Z-API] Sending button message to ${phone}:`, JSON.stringify(payload));

      const response = await axios.post(url, payload, config);

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data
      };
    } catch (error) {
      console.error(`[Z-API] Button message error:`, error.response?.data || error.message);
      console.error(`[Z-API] Full error response:`, JSON.stringify(error.response?.data));
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Send message with link preview (clickable link card)
  async sendLinkMessage(instanceId, instanceToken, phone, data, proxy = null, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/send-link`;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': antiBan.getRandomUserAgent()
        }
      };

      if (clientToken) {
        config.headers['Client-Token'] = clientToken;
      }

      if (proxy) {
        config.proxy = {
          host: proxy.host,
          port: proxy.port,
          auth: proxy.username ? {
            username: proxy.username,
            password: proxy.password
          } : undefined
        };
      }

      const payload = {
        phone: phone,
        message: data.message || '',
        linkUrl: data.linkUrl
      };

      // Only add optional fields if they have values
      if (data.title) {
        payload.title = data.title;
      }

      console.log(`[Z-API] Sending link message to ${phone}:`, payload);

      const response = await axios.post(url, payload, config);

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data
      };
    } catch (error) {
      console.error(`[Z-API] Error sending link message:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Send message with image
  async sendImageMessage(instanceId, instanceToken, phone, imageUrl, caption = '', proxy = null, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/send-image`;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': antiBan.getRandomUserAgent()
        }
      };

      if (clientToken) {
        config.headers['Client-Token'] = clientToken;
      }

      if (proxy) {
        config.proxy = {
          host: proxy.host,
          port: proxy.port,
          auth: proxy.username ? {
            username: proxy.username,
            password: proxy.password
          } : undefined
        };
      }

      const response = await axios.post(url, {
        phone: phone,
        image: imageUrl,
        caption: caption
      }, config);

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Disconnect instance
  async disconnect(instanceId, instanceToken, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/disconnect`;
      
      const headers = {
        'User-Agent': antiBan.getRandomUserAgent()
      };

      if (clientToken) {
        headers['Client-Token'] = clientToken;
      }

      const response = await axios.get(url, { headers });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      if (error.response?.data) {
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Restart instance
  async restart(instanceId, instanceToken) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/restart`;
      const response = await axios.get(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get profile photo
  async getProfilePhoto(instanceId, instanceToken, phone, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/profile-picture`;

      const config = {
        params: { phone },
        headers: {
          'User-Agent': antiBan.getRandomUserAgent()
        }
      };

      if (clientToken) {
        config.headers['Client-Token'] = clientToken;
      }

      const response = await axios.get(url, config);

      return {
        success: true,
        photoUrl: response.data.value || response.data.url || response.data.profilePictureUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get profile info
  async getProfile(instanceId, instanceToken, clientToken = null, customPhotoUrl = null) {
    try {
      // Use /device endpoint for complete profile information
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/device`;
      const headers = {
        'User-Agent': antiBan.getRandomUserAgent()
      };

      if (clientToken) {
        headers['Client-Token'] = clientToken;
      }

      const response = await axios.get(url, { headers });

      const phone = response.data.phone || null;
      const name = response.data.name || null;
      const isBusiness = response.data.isBusiness || false;
      // PRIORITY: Use custom photo URL from database if available
      let profilePictureUrl = null;
      if (customPhotoUrl) {
        profilePictureUrl = customPhotoUrl;
      } else {
        // Fallback: Buscar foto do WhatsApp
        if (phone) {
          try {
            const photoResult = await this.getProfilePhoto(instanceId, instanceToken, phone, clientToken);

            if (photoResult.success && photoResult.photoUrl) {
              profilePictureUrl = photoResult.photoUrl;
            } else {
              profilePictureUrl = response.data.imgUrl || null;
            }
          } catch (photoError) {
            profilePictureUrl = response.data.imgUrl || null;
          }
        } else {
          // Fallback to device imgUrl if no phone number
          profilePictureUrl = response.data.imgUrl || null;
        }
      }

      // Add cache-busting timestamp to avoid cached images
      if (profilePictureUrl && !customPhotoUrl) {
        const separator = profilePictureUrl.includes('?') ? '&' : '?';
        profilePictureUrl = `${profilePictureUrl}${separator}_t=${Date.now()}`;
      }

      return {
        wid: phone,
        pushname: name,
        status: response.data.status || null,
        profilePictureUrl: profilePictureUrl,
        phone: phone,
        isBusiness: isBusiness
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Update profile description/status
  async updateProfileStatus(instanceId, instanceToken, status, clientToken = null) {
    try {
      // Use /profile-status endpoint (correct Z-API endpoint)
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/profile-status`;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': antiBan.getRandomUserAgent()
        }
      };

      if (clientToken) {
        config.headers['Client-Token'] = clientToken;
      }

      const response = await axios.put(url, { value: status }, config);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Update profile name
  async updateProfileName(instanceId, instanceToken, name, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/profile-name`;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': antiBan.getRandomUserAgent()
        }
      };

      if (clientToken) {
        config.headers['Client-Token'] = clientToken;
      }

      const response = await axios.put(url, { value: name }, config);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Update profile photo
  async updateProfilePhoto(instanceId, instanceToken, imageUrl, clientToken = null) {
    const url = `${this.getInstanceUrl(instanceId, instanceToken)}/profile-picture`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': antiBan.getRandomUserAgent()
      }
    };

    if (clientToken) {
      config.headers['Client-Token'] = clientToken;
    }

    // Z-API accepts URL or base64. If it's base64, convert to data URL format
    let imageValue = imageUrl;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      imageValue = `data:image/jpeg;base64,${imageUrl}`;
    }
    // Try PUT with 'value' field (default method)
    try {
      const response = await axios.put(url, { value: imageValue }, config);
      if (response.status === 200 || response.status === 204) {
        return { success: true, data: response.data };
      }
    } catch (error) {
      const httpCode = error.response?.status;
      // If PUT failed with 405 (Method Not Allowed) or 400, try POST
      if (httpCode === 405 || httpCode === 400) {
        try {
          const response = await axios.post(url, { value: imageValue }, config);
          if (response.status === 200 || response.status === 204) {
            return { success: true, data: response.data };
          }
        } catch (postError) {
          // If POST with 'value' also failed, try with 'url' field
          try {
            const response = await axios.put(url, { url: imageValue }, config);
            if (response.status === 200 || response.status === 204) {
              return { success: true, data: response.data };
            }
          } catch (urlError) {
            throw new Error(urlError.response?.data?.message || urlError.message);
          }
        }
      }

      // If it's not a 405/400 error, throw the original error
      throw new Error(error.response?.data?.message || error.message);
    }

    throw new Error('Falha ao atualizar foto do perfil após múltiplas tentativas');
  }

  // Get instance data
  async getInstanceData(instanceId, instanceToken, clientToken = null) {
    try {
      const url = `${this.getInstanceUrl(instanceId, instanceToken)}/me`;
      
      const headers = {
        'User-Agent': antiBan.getRandomUserAgent()
      };

      if (clientToken) {
        headers['Client-Token'] = clientToken;
      }

      const response = await axios.get(url, { headers });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }
}

export default new ZApiService();
