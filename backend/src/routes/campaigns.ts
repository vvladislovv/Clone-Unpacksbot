import { CampaignStatus, PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['product', 'channel']),
  budget: z.number().positive(),
  pricePerClick: z.number().positive(),
  maxClicks: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  productId: z.string().optional(),
  channelId: z.string().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial();

interface CampaignRequest extends FastifyRequest {
  prisma: PrismaClient;
  user: { userId: string; role: string };
}

export async function campaignRoutes(fastify: FastifyInstance) {
  
  // Get campaigns list
  fastify.get('/', {
    schema: {
      description: 'Get campaigns list',
      tags: ['Campaigns'],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['product', 'channel'] },
          status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] },
          advertiserId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
    },
  }, async (request: CampaignRequest, reply: FastifyReply) => {
    const {
      type,
      status,
      advertiserId,
      limit = 20,
      offset = 0,
    } = request.query as any;

    try {
      const where = {
        ...(type && { type }),
        ...(status && { status: status as CampaignStatus }),
        ...(advertiserId && { advertiserId }),
      };

      const campaigns = await request.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          advertiser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              price: true,
              wbArticle: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              subscribers: true,
              category: true,
            },
          },
          _count: {
            select: { clicks: true },
          },
        },
      });

      const totalCount = await request.prisma.campaign.count({ where });

      reply.send({
        campaigns,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch campaigns',
        message: 'An error occurred while fetching campaigns',
      });
    }
  });

  // Get single campaign
  fastify.get('/:id', {
    schema: {
      description: 'Get campaign by ID',
      tags: ['Campaigns'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request: CampaignRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const campaign = await request.prisma.campaign.findUnique({
        where: { id },
        include: {
          advertiser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
          product: true,
          channel: true,
          clicks: {
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
              id: true,
              ipAddress: true,
              userAgent: true,
              referrer: true,
              createdAt: true,
            },
          },
        },
      });

      if (!campaign) {
        return reply.code(404).send({
          error: 'Campaign not found',
          message: 'Campaign with this ID does not exist',
        });
      }

      reply.send(campaign);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch campaign',
        message: 'An error occurred while fetching campaign',
      });
    }
  });

  // Create new campaign
  fastify.post('/', {
    schema: {
      description: 'Create new campaign',
      tags: ['Campaigns'],
      security: [{ Bearer: [] }],
      body: createCampaignSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: CampaignRequest, reply: FastifyReply) => {
    const data = createCampaignSchema.parse(request.body);

    try {
      // Validate campaign data
      if (data.type === 'product' && !data.productId) {
        return reply.code(400).send({
          error: 'Invalid campaign data',
          message: 'Product ID is required for product campaigns',
        });
      }

      if (data.type === 'channel' && !data.channelId) {
        return reply.code(400).send({
          error: 'Invalid campaign data',
          message: 'Channel ID is required for channel campaigns',
        });
      }

      // Check user balance
      const user = await request.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { balance: true },
      });

      if (!user || user.balance < data.budget) {
        return reply.code(400).send({
          error: 'Insufficient balance',
          message: 'You do not have enough balance to create this campaign',
        });
      }

      // Verify product/channel ownership or accessibility
      if (data.productId) {
        const product = await request.prisma.product.findFirst({
          where: {
            id: data.productId,
            OR: [
              { sellerId: request.user.userId },
              { isActive: true }, // Allow campaigns for any active product
            ],
          },
        });

        if (!product) {
          return reply.code(404).send({
            error: 'Product not found',
            message: 'Product not found or not accessible',
          });
        }
      }

      if (data.channelId) {
        const channel = await request.prisma.channel.findFirst({
          where: {
            id: data.channelId,
            isActive: true,
          },
        });

        if (!channel) {
          return reply.code(404).send({
            error: 'Channel not found',
            message: 'Channel not found or not active',
          });
        }
      }

      // Create campaign
      const campaign = await request.prisma.campaign.create({
        data: {
          ...data,
          advertiserId: request.user.userId,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          status: 'DRAFT',
        },
        include: {
          advertiser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              price: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              subscribers: true,
            },
          },
        },
      });

      reply.code(201).send(campaign);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to create campaign',
        message: 'An error occurred while creating campaign',
      });
    }
  });

  // Update campaign
  fastify.put('/:id', {
    schema: {
      description: 'Update campaign',
      tags: ['Campaigns'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: updateCampaignSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: CampaignRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const data = updateCampaignSchema.parse(request.body);

    try {
      // Check if campaign exists and user owns it
      const existingCampaign = await request.prisma.campaign.findUnique({
        where: { id },
      });

      if (!existingCampaign) {
        return reply.code(404).send({
          error: 'Campaign not found',
          message: 'Campaign with this ID does not exist',
        });
      }

      if (existingCampaign.advertiserId !== request.user.userId && request.user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only update your own campaigns',
        });
      }

      // Prevent editing active campaigns budget
      if (existingCampaign.status === 'ACTIVE' && data.budget && data.budget !== existingCampaign.budget) {
        return reply.code(400).send({
          error: 'Cannot modify budget',
          message: 'Cannot modify budget of an active campaign',
        });
      }

      const campaign = await request.prisma.campaign.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
        include: {
          advertiser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              price: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              subscribers: true,
            },
          },
        },
      });

      reply.send(campaign);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to update campaign',
        message: 'An error occurred while updating campaign',
      });
    }
  });

  // Start campaign
  fastify.post('/:id/start', {
    schema: {
      description: 'Start campaign',
      tags: ['Campaigns'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: CampaignRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const campaign = await request.prisma.campaign.findUnique({
        where: { id },
        include: { advertiser: { select: { balance: true } } },
      });

      if (!campaign) {
        return reply.code(404).send({
          error: 'Campaign not found',
          message: 'Campaign with this ID does not exist',
        });
      }

      if (campaign.advertiserId !== request.user.userId && request.user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only start your own campaigns',
        });
      }

      if (campaign.status !== 'DRAFT' && campaign.status !== 'PAUSED') {
        return reply.code(400).send({
          error: 'Invalid campaign status',
          message: 'Only draft or paused campaigns can be started',
        });
      }

      if (campaign.advertiser.balance < campaign.budget) {
        return reply.code(400).send({
          error: 'Insufficient balance',
          message: 'Insufficient balance to start campaign',
        });
      }

      // Start campaign and deduct budget from user balance
      await request.prisma.$transaction(async (tx) => {
        await tx.campaign.update({
          where: { id },
          data: { 
            status: 'ACTIVE',
            startDate: new Date(),
          },
        });

        await tx.user.update({
          where: { id: campaign.advertiserId },
          data: { 
            balance: { decrement: campaign.budget }
          },
        });

        await tx.transaction.create({
          data: {
            userId: campaign.advertiserId,
            type: 'CAMPAIGN_PAYMENT',
            amount: -campaign.budget,
            status: 'COMPLETED',
            description: `Campaign started: ${campaign.title}`,
          },
        });
      });

      reply.send({ success: true, message: 'Campaign started successfully' });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to start campaign',
        message: 'An error occurred while starting campaign',
      });
    }
  });

  // Pause campaign
  fastify.post('/:id/pause', {
    schema: {
      description: 'Pause campaign',
      tags: ['Campaigns'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: CampaignRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const campaign = await request.prisma.campaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        return reply.code(404).send({
          error: 'Campaign not found',
          message: 'Campaign with this ID does not exist',
        });
      }

      if (campaign.advertiserId !== request.user.userId && request.user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only pause your own campaigns',
        });
      }

      if (campaign.status !== 'ACTIVE') {
        return reply.code(400).send({
          error: 'Invalid campaign status',
          message: 'Only active campaigns can be paused',
        });
      }

      await request.prisma.campaign.update({
        where: { id },
        data: { status: 'PAUSED' },
      });

      reply.send({ success: true, message: 'Campaign paused successfully' });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to pause campaign',
        message: 'An error occurred while pausing campaign',
      });
    }
  });

  // Record click
  fastify.post('/:id/click', {
    schema: {
      description: 'Record campaign click',
      tags: ['Campaigns'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request: CampaignRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'] || '';
    const referrer = request.headers.referer || '';

    try {
      const campaign = await request.prisma.campaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        return reply.code(404).send({
          error: 'Campaign not found',
          message: 'Campaign with this ID does not exist',
        });
      }

      if (campaign.status !== 'ACTIVE') {
        return reply.code(400).send({
          error: 'Campaign not active',
          message: 'Cannot record clicks for inactive campaigns',
        });
      }

      // Check if max clicks reached
      if (campaign.maxClicks && campaign.currentClicks >= campaign.maxClicks) {
        return reply.code(400).send({
          error: 'Campaign limit reached',
          message: 'Campaign has reached maximum clicks',
        });
      }

      // Record click and update campaign
      await request.prisma.$transaction(async (tx) => {
        await tx.click.create({
          data: {
            campaignId: id,
            ipAddress,
            userAgent,
            referrer,
          },
        });

        const updatedCampaign = await tx.campaign.update({
          where: { id },
          data: { currentClicks: { increment: 1 } },
        });

        // Check if campaign should be completed
        if (updatedCampaign.maxClicks && updatedCampaign.currentClicks >= updatedCampaign.maxClicks) {
          await tx.campaign.update({
            where: { id },
            data: { status: 'COMPLETED' },
          });
        }
      });

      reply.send({ success: true, message: 'Click recorded successfully' });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to record click',
        message: 'An error occurred while recording click',
      });
    }
  });

  // Get my campaigns
  fastify.get('/my/campaigns', {
    schema: {
      description: 'Get current user campaigns',
      tags: ['Campaigns'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: CampaignRequest, reply: FastifyReply) => {
    const { status, limit = 20, offset = 0 } = request.query as any;

    try {
      const where = {
        advertiserId: request.user.userId,
        ...(status && { status: status as CampaignStatus }),
      };

      const campaigns = await request.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              price: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              subscribers: true,
            },
          },
          _count: {
            select: { clicks: true },
          },
        },
      });

      const totalCount = await request.prisma.campaign.count({ where });

      // Calculate total spending and clicks
      const stats = await request.prisma.campaign.aggregate({
        where: { advertiserId: request.user.userId },
        _sum: { budget: true, currentClicks: true },
        _count: true,
      });

      reply.send({
        campaigns,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        stats: {
          totalSpent: stats._sum.budget || 0,
          totalClicks: stats._sum.currentClicks || 0,
          totalCampaigns: stats._count,
        },
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch campaigns',
        message: 'An error occurred while fetching your campaigns',
      });
    }
  });
}
