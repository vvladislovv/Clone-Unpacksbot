import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalProducts,
      totalDeals,
      totalTransactions,
      activeUsers,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.deal.count(),
      this.prisma.transaction.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalDeals,
      totalTransactions,
      activeUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }

  async getMessages() {
    return this.prisma.supportTicket.findMany({
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
  }

  async replyToMessage(messageId: string, replyDto: any) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: messageId },
    });

    if (!ticket) {
      throw new Error('Message not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: messageId },
      data: {
        status: 'IN_PROGRESS',
        // Здесь можно добавить логику для отправки ответа
      },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        balance: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(userId: string, updateUserDto: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        balance: true,
        updatedAt: true,
      },
    });
  }

  async blockUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async unblockUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        username: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async verifyUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      select: {
        id: true,
        username: true,
        isVerified: true,
        updatedAt: true,
      },
    });
  }

  async getProducts() {
    return this.prisma.product.findMany({
      include: {
        seller: {
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
  }

  async updateProduct(productId: string, updateProductDto: any) {
    return this.prisma.product.update({
      where: { id: productId },
      data: updateProductDto,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteProduct(productId: string) {
    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  async getDeals() {
    return this.prisma.deal.findMany({
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

