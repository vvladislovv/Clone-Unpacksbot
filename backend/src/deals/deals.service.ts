import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDealDto: any) {
    // Получаем информацию о продукте для sellerId
    const product = await this.prisma.product.findUnique({
      where: { id: createDealDto.productId },
      select: { sellerId: true, price: true }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Вычисляем сумму сделки на основе цены продукта и количества
    const amount = product.price.mul(createDealDto.quantity || 1);

    const deal = await this.prisma.deal.create({
      data: {
        productId: createDealDto.productId,
        buyerId: userId,
        sellerId: product.sellerId,
        amount: amount,
        status: 'PENDING',
        description: createDealDto.description,
        metadata: createDealDto.metadata,
      },
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
            images: true,
          },
        },
      },
    });

    return deal;
  }

  async findAll() {
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
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
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
            images: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return deal;
  }

  async findByUserId(userId: string) {
    return this.prisma.deal.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
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
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, id: string, updateDealDto: any) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.buyerId !== userId && deal.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own deals');
    }

    return this.prisma.deal.update({
      where: { id },
      data: updateDealDto,
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
            images: true,
          },
        },
      },
    });
  }

  async cancel(userId: string, id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.buyerId !== userId && deal.sellerId !== userId) {
      throw new ForbiddenException('You can only cancel your own deals');
    }

    if (deal.status === 'CANCELLED') {
      throw new ForbiddenException('Deal is already cancelled');
    }

    return this.prisma.deal.update({
      where: { id },
      data: { status: 'CANCELLED' },
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
            images: true,
          },
        },
      },
    });
  }
}
