import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPayment(userId: string, createPaymentDto: any) {
    this.logger.log(`Creating payment for user: ${userId}`);
    
    // Маппинг строковых значений на enum
    const methodMapping = {
      'card': 'CARD',
      'wallet': 'YOOMONEY',
      'crypto': 'CRYPTO',
      'bank': 'BANK_TRANSFER',
      'paypal': 'PAYPAL'
    };
    
    const paymentMethod = methodMapping[createPaymentDto.paymentMethod] || 'CARD';
    
    // Создаем платеж
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: createPaymentDto.amount,
        status: 'PENDING',
        method: paymentMethod,
        description: createPaymentDto.description || 'Payment',
        metadata: createPaymentDto.metadata || {},
      },
    });

    return payment;
  }

  async getPayment(userId: string, paymentId: string) {
    this.logger.log(`Getting payment: ${paymentId} for user: ${userId}`);
    
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async confirmPayment(userId: string, paymentId: string) {
    this.logger.log(`Confirming payment: ${paymentId} for user: ${userId}`);
    
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Обновляем статус платежа
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED' },
    });

    // Пополняем баланс пользователя
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: payment.amount,
        },
      },
    });

    return updatedPayment;
  }

  async cancelPayment(userId: string, paymentId: string) {
    this.logger.log(`Cancelling payment: ${paymentId} for user: ${userId}`);
    
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
    });

    return updatedPayment;
  }
}
