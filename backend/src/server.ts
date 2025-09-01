import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import Fastify from 'fastify';
import Redis from 'ioredis';

import { authRoutes } from './routes/auth.js';
import { campaignRoutes } from './routes/campaigns.js';
import { chatRoutes } from './routes/chat.js';
import { productRoutes } from './routes/products.js';
import { transactionRoutes } from './routes/transactions.js';
import { uploadRoutes } from './routes/upload.js';
import { userRoutes } from './routes/users.js';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
    return;
  }

  if (error.statusCode) {
    reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
    return;
  }

  reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : error.message,
  });
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(import('@fastify/cors'), {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : true,
    credentials: true,
  });

  // Helmet for security
  await fastify.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  // Rate limiting
  await fastify.register(import('@fastify/rate-limit'), {
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    redis: redis,
  });

  // JWT
  await fastify.register(import('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'supersecret',
  });

  // Multipart for file uploads
  await fastify.register(import('@fastify/multipart'), {
    limits: {
      fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
    },
  });

  // Static files
  await fastify.register(import('@fastify/static'), {
    root: process.cwd() + '/uploads',
    prefix: '/uploads/',
  });

  // WebSocket support
  await fastify.register(import('@fastify/websocket'));

  // Swagger documentation
  await fastify.register(import('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'Unpacker Clone API',
        description: 'API documentation for Unpacker Clone platform',
        version: '1.0.0',
      },
      host: 'localhost:3001',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  });

  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}

// Decorators for dependency injection
fastify.decorate('prisma', prisma);
fastify.decorate('redis', redis);

// Authentication decorator
fastify.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Register routes
async function registerRoutes() {
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(productRoutes, { prefix: '/api/products' });
  await fastify.register(campaignRoutes, { prefix: '/api/campaigns' });
  await fastify.register(chatRoutes, { prefix: '/api/chat' });
  await fastify.register(transactionRoutes, { prefix: '/api/transactions' });
  await fastify.register(uploadRoutes, { prefix: '/api/upload' });
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    
    reply.send({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      }
    });
  } catch (error) {
    reply.code(503).send({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info('Starting graceful shutdown...');
  
  try {
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
    fastify.log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    await registerPlugins();
    await registerRoutes();
    
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    fastify.log.info(`🚀 Server is running on http://${host}:${port}`);
    fastify.log.info(`📚 API Documentation: http://${host}:${port}/docs`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
