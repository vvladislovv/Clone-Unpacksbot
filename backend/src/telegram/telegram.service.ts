import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserInfo(telegramId: string) {
    this.logger.log(`Getting Telegram user info: ${telegramId}`);
    
    // В реальном приложении здесь был бы запрос к Telegram API
    // Пока возвращаем моковые данные
    return {
      id: telegramId,
      firstName: 'Telegram',
      lastName: 'User',
      username: 'telegram_user',
      photoUrl: 'https://t.me/i/userpic/320/photo.jpg',
      isBot: false,
    };
  }

  async getUserPhoto(telegramId: string) {
    this.logger.log(`Getting Telegram user photo: ${telegramId}`);
    
    return {
      photoUrl: 'https://t.me/i/userpic/320/photo.jpg',
      fileId: 'photo_file_id',
    };
  }

  async searchUser(username: string) {
    this.logger.log(`Searching Telegram user: ${username}`);
    
    // В реальном приложении здесь был бы поиск через Telegram API
    return {
      id: '123456789',
      firstName: 'Found',
      lastName: 'User',
      username: username,
      photoUrl: 'https://t.me/i/userpic/320/photo.jpg',
    };
  }

  async verifyUser(telegramId: string, verifyDto: any) {
    this.logger.log(`Verifying Telegram user: ${telegramId}`);
    
    // Создаем или обновляем пользователя
    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName: verifyDto.firstName,
        lastName: verifyDto.lastName,
        username: verifyDto.username,
        telegramVerified: true,
      },
      create: {
        telegramId,
        firstName: verifyDto.firstName,
        lastName: verifyDto.lastName,
        username: verifyDto.username,
        telegramVerified: true,
        role: 'BUYER',
      },
    });

    return user;
  }

  async connectAccount(userId: string, connectDto: any) {
    this.logger.log(`Connecting social account for user: ${userId}`);
    
    const socialLink = await this.prisma.socialLink.create({
      data: {
        userId,
        platform: connectDto.platform,
        username: connectDto.username,
        url: connectDto.url,
        verified: false,
      },
    });

    return socialLink;
  }

  async getSocialLinks(userId: string) {
    this.logger.log(`Getting social links for user: ${userId}`);
    
    const links = await this.prisma.socialLink.findMany({
      where: { userId },
    });

    return links;
  }

  async updateSocialLink(userId: string, linkId: string, updateDto: any) {
    this.logger.log(`Updating social link: ${linkId} for user: ${userId}`);
    
    const link = await this.prisma.socialLink.findFirst({
      where: { id: linkId, userId },
    });

    if (!link) {
      throw new NotFoundException('Social link not found');
    }

    const updatedLink = await this.prisma.socialLink.update({
      where: { id: linkId },
      data: updateDto,
    });

    return updatedLink;
  }

  async deleteSocialLink(userId: string, linkId: string) {
    this.logger.log(`Deleting social link: ${linkId} for user: ${userId}`);
    
    const link = await this.prisma.socialLink.findFirst({
      where: { id: linkId, userId },
    });

    if (!link) {
      throw new NotFoundException('Social link not found');
    }

    await this.prisma.socialLink.delete({
      where: { id: linkId },
    });

    return { message: 'Social link deleted successfully' };
  }
}
