import { PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const createProductSchema = z.object({
  wbArticle: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  images: z.array(z.string().url()).min(1),
  category: z.string().min(1),
  brand: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial();

interface ProductRequest extends FastifyRequest {
  prisma: PrismaClient;
  user: { userId: string; role: string };
}

export async function productRoutes(fastify: FastifyInstance) {
  
  // Get products list with filters and pagination
  fastify.get('/', {
    schema: {
      description: 'Get products list',
      tags: ['Products'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          category: { type: 'string' },
          brand: { type: 'string' },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          sellerId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['createdAt', 'price', 'title', 'rating'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
    },
  }, async (request: ProductRequest, reply: FastifyReply) => {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sellerId,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = request.query as any;

    try {
      const where = {
        isActive: true,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { wbArticle: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(category && { category }),
        ...(brand && { brand }),
        ...(sellerId && { sellerId }),
        ...(minPrice !== undefined && { price: { gte: minPrice } }),
        ...(maxPrice !== undefined && { 
          price: { 
            ...(minPrice !== undefined ? { gte: minPrice, lte: maxPrice } : { lte: maxPrice })
          }
        }),
      };

      const products = await request.prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
          _count: {
            select: { campaigns: true },
          },
        },
      });

      const totalCount = await request.prisma.product.count({ where });

      reply.send({
        products,
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
        error: 'Failed to fetch products',
        message: 'An error occurred while fetching products',
      });
    }
  });

  // Get single product
  fastify.get('/:id', {
    schema: {
      description: 'Get product by ID',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request: ProductRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const product = await request.prisma.product.findUnique({
        where: { id },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
          campaigns: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              title: true,
              pricePerClick: true,
              budget: true,
              currentClicks: true,
              maxClicks: true,
            },
          },
          reviews: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!product) {
        return reply.code(404).send({
          error: 'Product not found',
          message: 'Product with this ID does not exist',
        });
      }

      reply.send(product);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch product',
        message: 'An error occurred while fetching product',
      });
    }
  });

  // Create new product (sellers only)
  fastify.post('/', {
    schema: {
      description: 'Create new product',
      tags: ['Products'],
      security: [{ Bearer: [] }],
      body: createProductSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: ProductRequest, reply: FastifyReply) => {
    const data = createProductSchema.parse(request.body);

    // Check if user is seller or admin
    if (!['SELLER', 'ADMIN'].includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Only sellers can create products',
      });
    }

    try {
      // Check if product with this WB article already exists
      const existingProduct = await request.prisma.product.findUnique({
        where: { wbArticle: data.wbArticle },
      });

      if (existingProduct) {
        return reply.code(409).send({
          error: 'Product already exists',
          message: 'Product with this Wildberries article number already exists',
        });
      }

      const product = await request.prisma.product.create({
        data: {
          ...data,
          sellerId: request.user.userId,
        },
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
      });

      reply.code(201).send(product);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to create product',
        message: 'An error occurred while creating product',
      });
    }
  });

  // Update product
  fastify.put('/:id', {
    schema: {
      description: 'Update product',
      tags: ['Products'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: updateProductSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: ProductRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const data = updateProductSchema.parse(request.body);

    try {
      // Check if product exists and user owns it
      const existingProduct = await request.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return reply.code(404).send({
          error: 'Product not found',
          message: 'Product with this ID does not exist',
        });
      }

      if (existingProduct.sellerId !== request.user.userId && request.user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only update your own products',
        });
      }

      const product = await request.prisma.product.update({
        where: { id },
        data,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
      });

      reply.send(product);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to update product',
        message: 'An error occurred while updating product',
      });
    }
  });

  // Delete product
  fastify.delete('/:id', {
    schema: {
      description: 'Delete product',
      tags: ['Products'],
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
  }, async (request: ProductRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      // Check if product exists and user owns it
      const existingProduct = await request.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return reply.code(404).send({
          error: 'Product not found',
          message: 'Product with this ID does not exist',
        });
      }

      if (existingProduct.sellerId !== request.user.userId && request.user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only delete your own products',
        });
      }

      // Soft delete by setting isActive to false
      await request.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      reply.send({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to delete product',
        message: 'An error occurred while deleting product',
      });
    }
  });

  // Get my products (for sellers)
  fastify.get('/my/products', {
    schema: {
      description: 'Get current user products',
      tags: ['Products'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          isActive: { type: 'boolean' },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: ProductRequest, reply: FastifyReply) => {
    const { limit = 20, offset = 0, isActive } = request.query as any;

    try {
      const where = {
        sellerId: request.user.userId,
        ...(isActive !== undefined && { isActive }),
      };

      const products = await request.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { campaigns: true },
          },
        },
      });

      const totalCount = await request.prisma.product.count({ where });

      reply.send({
        products,
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
        error: 'Failed to fetch products',
        message: 'An error occurred while fetching your products',
      });
    }
  });
}
