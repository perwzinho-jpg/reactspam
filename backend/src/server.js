import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';
import routes from './routes/index.js';
import campaignProcessor from './services/campaignProcessor.js';
import db from './config/database.js';
import { addCustomPhotoUrlColumn } from './migrations/addCustomPhotoUrl.js';
import { addSendOrderColumn } from './migrations/addSendOrderColumn.js';
import { createCampaignInstancesTable } from './migrations/createCampaignInstances.js';
import { createNotificationsTable } from './migrations/createNotificationsTable.js';
import { addAvatarColumn } from './migrations/addAvatarColumn.js';
import { addMissingColumns } from './migrations/addMissingColumns.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SITE_URL || 'http://localhost:5173',
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Make io available globally
global.io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on('join-campaign', (campaignId) => {
    socket.join(`campaign:${campaignId}`);
  });

  socket.on('leave-campaign', (campaignId) => {
    socket.leave(`campaign:${campaignId}`);
  });

  socket.on('request-campaign-progress', async (campaignId) => {
    try {
      const [campaigns] = await db.query(
        'SELECT sent_count, failed_count, success_count, total_numbers, status FROM campaigns WHERE id = ?',
        [campaignId]
      );

      if (campaigns.length > 0) {
        const campaign = campaigns[0];
        const processed = campaign.sent_count + campaign.failed_count;
        const pending = campaign.total_numbers - processed;
        const percentage = campaign.total_numbers > 0
          ? (processed / campaign.total_numbers) * 100
          : 0;

        socket.emit('campaign-progress', {
          campaignId: parseInt(campaignId),
          total: campaign.total_numbers,
          sent: campaign.sent_count,
          failed: campaign.failed_count,
          success: campaign.success_count,
          pending: pending,
          percentage: Math.round(percentage * 100) / 100,
          status: campaign.status
        });
      }
    } catch (error) {
      // Silent error handling
    }
  });

  socket.on('disconnect', () => {
    // Socket disconnected
  });
});

// Security middleware with enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.SITE_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting - General API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { success: false, message: 'Muitas requisições, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.includes('/socket.io')
});

// Rate limiting - Strict for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Muitas tentativas de login, tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting - Admin routes
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Muitas requisições admin, aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/', adminLimiter);

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers for uploads
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}, express.static('uploads'));

// API routes
app.use('/api', routes);

// Link tracking route
app.get('/track/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Validate code format to prevent injection
    if (!/^[a-zA-Z0-9]+$/.test(code)) {
      return res.status(400).send('Código inválido');
    }

    const [clicks] = await db.query(
      'SELECT * FROM link_clicks WHERE tracking_code = ?',
      [code]
    );

    if (clicks.length === 0) {
      return res.status(404).send('Link não encontrado');
    }

    const click = clicks[0];

    await db.query(
      'UPDATE link_clicks SET clicked_at = NOW(), ip_address = ?, user_agent = ? WHERE id = ?',
      [req.ip, req.get('user-agent')?.substring(0, 500), click.id]
    );

    res.redirect(click.original_url);
  } catch (error) {
    res.status(500).send('Erro ao processar link');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// Error handler
app.use((err, req, res, next) => {
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acesso não permitido'
    });
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'Erro no upload do arquivo'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Auto-start processing campaigns
async function startProcessingCampaigns() {
  console.log('[Server] Starting processing campaigns check...');
  try {
    const [campaigns] = await db.query(
      'SELECT id FROM campaigns WHERE status = ?',
      ['processing']
    );
    console.log(`[Server] Found ${campaigns.length} campaigns in processing status`);

    for (const campaign of campaigns) {
      console.log(`[Server] Starting campaign processor for campaign ${campaign.id}`);
      campaignProcessor.processCampaign(campaign.id).catch((err) => {
        console.error(`[Server] Error processing campaign ${campaign.id}:`, err);
      });
    }
  } catch (error) {
    console.error('[Server] Error in startProcessingCampaigns:', error);
  }
}

// Cron job to check instance status every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const [instances] = await db.query(
      `SELECT i.id, z.instance_id, z.instance_token, z.client_token
       FROM instances i
       JOIN zapi_instances z ON i.zapi_instance_id = z.id
       WHERE i.is_active = TRUE`
    );

    for (const instance of instances) {
      const zapi = (await import('./utils/zapi.js')).default;
      const status = await zapi.checkStatus(instance.instance_id, instance.instance_token, instance.client_token);

      if (status.success) {
        await db.query(
          'UPDATE instances SET status = ?, phone_number = ? WHERE id = ?',
          [status.connected ? 'connected' : 'disconnected', status.phone, instance.id]
        );
      }
    }
  } catch (error) {
    // Silent error
  }
});

// Start server
httpServer.listen(PORT, async () => {
  try {
    await addCustomPhotoUrlColumn();
    await addSendOrderColumn();
    await createCampaignInstancesTable();
    await createNotificationsTable();
    await addAvatarColumn();
    await addMissingColumns();
  } catch (error) {
    // Migration errors are silent
  }

  setTimeout(startProcessingCampaigns, 5000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  httpServer.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  httpServer.close(() => {
    process.exit(0);
  });
});
