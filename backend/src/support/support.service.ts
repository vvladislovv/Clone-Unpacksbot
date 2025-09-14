import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getFirstUser() {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('No users found in database');
    }
    return user;
  }

  async sendMessage(userId: string, messageDto: any) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: userId,
        subject: messageDto.subject,
        message: messageDto.message,
        status: 'OPEN',
        priority: messageDto.priority || 'medium',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return ticket;
  }

  async getUserMessages(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets;
  }
}

