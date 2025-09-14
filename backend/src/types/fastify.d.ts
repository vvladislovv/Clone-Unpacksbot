import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    prisma: PrismaClient;
    redis: Redis;
    user?: { userId: string; role: string };
  }
}
