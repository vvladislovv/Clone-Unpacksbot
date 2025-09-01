import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  telegramId: z.string().optional(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100).optional(),
  password: z.string().min(6).max(100),
  role: z.enum(['SELLER', 'BLOGGER', 'MANAGER']).default('SELLER'),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1), // email, username, or phone
  password: z.string().min(1),
});

const telegramLoginSchema = z.object({
  telegramId: z.string(),
  firstName: z.string(),
  lastName: z.string().optional(),
  username: z.string().optional(),
  photoUrl: z.string().optional(),
});

interface AuthRequest extends FastifyRequest {
  prisma: PrismaClient;
}

export async function authRoutes(fastify: FastifyInstance) {
  
  // Register new user
  fastify.post('/register', {
    schema: {
      description: 'Register a new user',
      tags: ['Authentication'],
      body: registerSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
                referralCode: { type: 'string' },
              },
            },
            token: { type: 'string' },
          },
        },
      },
    },
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const data = registerSchema.parse(request.body);
    
    try {
      // Check if user already exists
      const existingUser = await request.prisma.user.findFirst({
        where: {
          OR: [
            data.email ? { email: data.email } : {},
            data.username ? { username: data.username } : {},
            data.phone ? { phone: data.phone } : {},
            data.telegramId ? { telegramId: data.telegramId } : {},
          ].filter(condition => Object.keys(condition).length > 0),
        },
      });

      if (existingUser) {
        return reply.code(409).send({
          error: 'User already exists',
          message: 'User with this email, username, phone, or Telegram ID already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Handle referral
      let referredById = null;
      if (data.referralCode) {
        const referrer = await request.prisma.user.findUnique({
          where: { referralCode: data.referralCode },
        });
        if (referrer) {
          referredById = referrer.id;
        }
      }

      // Create user
      const user = await request.prisma.user.create({
        data: {
          ...data,
          passwordHash,
          role: data.role as UserRole,
          referredById,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          referralCode: true,
          balance: true,
          isVerified: true,
          createdAt: true,
        },
      });

      // Generate JWT token
      const token = fastify.jwt.sign({ 
        userId: user.id, 
        role: user.role 
      });

      // Send referral notification if applicable
      if (referredById) {
        await request.prisma.notification.create({
          data: {
            userId: referredById,
            title: 'New Referral!',
            message: `${user.firstName} joined using your referral code!`,
            type: 'success',
          },
        });
      }

      reply.code(201).send({ user, token });
      
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Registration failed',
        message: 'An error occurred during registration',
      });
    }
  });

  // Login user
  fastify.post('/login', {
    schema: {
      description: 'Login user',
      tags: ['Authentication'],
      body: loginSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
                balance: { type: 'number' },
              },
            },
            token: { type: 'string' },
          },
        },
      },
    },
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const { identifier, password } = loginSchema.parse(request.body);

    try {
      // Find user by email, username, or phone
      const user = await request.prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
            { phone: identifier },
          ],
          isActive: true,
        },
      });

      if (!user || !user.passwordHash) {
        return reply.code(401).send({
          error: 'Invalid credentials',
          message: 'Invalid identifier or password',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.code(401).send({
          error: 'Invalid credentials',
          message: 'Invalid identifier or password',
        });
      }

      // Update last login
      await request.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT token
      const token = fastify.jwt.sign({ 
        userId: user.id, 
        role: user.role 
      });

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        balance: user.balance,
        isVerified: user.isVerified,
      };

      reply.send({ user: userResponse, token });
      
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Login failed',
        message: 'An error occurred during login',
      });
    }
  });

  // Telegram login/register
  fastify.post('/telegram', {
    schema: {
      description: 'Login or register via Telegram',
      tags: ['Authentication'],
      body: z.object({
        telegramId: z.string(),
        firstName: z.string(),
        lastName: z.string().optional(),
        username: z.string().optional(),
        photoUrl: z.string().optional(),
        skipRegistration: z.boolean().optional(),
        role: z.enum(['SELLER', 'BLOGGER', 'MANAGER']).optional(),
        referralCode: z.string().optional(),
      }),
    },
  }, async (request: AuthRequest, reply: FastifyReply) => {
    const data = request.body as any;

    try {
      // Find existing user
      let user = await request.prisma.user.findUnique({
        where: { telegramId: data.telegramId },
      });

      if (!user) {
        // If skipRegistration is true, just return 404
        if (data.skipRegistration) {
          return reply.code(404).send({
            error: 'User not found',
            message: 'User not registered',
          });
        }

        // Handle referral
        let referredById = null;
        if (data.referralCode) {
          const referrer = await request.prisma.user.findUnique({
            where: { referralCode: data.referralCode },
          });
          if (referrer) {
            referredById = referrer.id;
          }
        }

        // Register new user via Telegram
        user = await request.prisma.user.create({
          data: {
            telegramId: data.telegramId,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            avatar: data.photoUrl,
            role: data.role as UserRole || UserRole.SELLER,
            isVerified: true, // Telegram users are pre-verified
            referredById,
          },
        });

        // Send referral notification if applicable
        if (referredById) {
          await request.prisma.notification.create({
            data: {
              userId: referredById,
              title: 'New Referral!',
              message: `${user.firstName} joined using your referral code!`,
              type: 'success',
            },
          });
        }
      } else {
        // Update last login
        await request.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      // Generate JWT token
      const token = fastify.jwt.sign({ 
        userId: user.id, 
        role: user.role 
      });

      const userResponse = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        balance: user.balance,
        isVerified: user.isVerified,
      };

      reply.send({ user: userResponse, token });
      
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Telegram authentication failed',
        message: 'An error occurred during Telegram authentication',
      });
    }
  });

  // Get current user profile
  fastify.get('/me', {
    schema: {
      description: 'Get current user profile',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request: any, reply: FastifyReply) => {
    try {
      const user = await request.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          telegramId: true,
          username: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          balance: true,
          referralCode: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          error: 'User not found',
          message: 'User profile not found',
        });
      }

      reply.send(user);
      
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch profile',
        message: 'An error occurred while fetching user profile',
      });
    }
  });

  // Logout (invalidate token - would need Redis blacklist)
  fastify.post('/logout', {
    schema: {
      description: 'Logout user',
      tags: ['Authentication'],
      security: [{ Bearer: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request: any, reply: FastifyReply) => {
    try {
      // In a real implementation, you'd add the token to a blacklist in Redis
      // For now, just send success response
      reply.send({ message: 'Logged out successfully' });
      
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Logout failed',
        message: 'An error occurred during logout',
      });
    }
  });
}
