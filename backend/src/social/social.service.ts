import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export interface SocialUserData {
  platform: string;
  username: string;
  displayName: string;
  avatar?: string;
  followers?: number;
  verified: boolean;
  url: string;
  bio?: string;
  externalId?: string;
}

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserData(platform: string, username: string): Promise<SocialUserData | null> {
    try {
      this.logger.log(`Получение данных пользователя ${username} с платформы ${platform}`);
      
      switch (platform.toLowerCase()) {
        case 'telegram':
          return await this.getTelegramUserData(username);
        case 'instagram':
          return await this.getInstagramUserData(username);
        case 'youtube':
          return await this.getYouTubeUserData(username);
        case 'tiktok':
          return await this.getTikTokUserData(username);
        default:
          throw new Error(`Неподдерживаемая платформа: ${platform}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка получения данных пользователя ${username} с ${platform}:`, error.message);
      return null;
    }
  }

  private async getTelegramUserData(username: string): Promise<SocialUserData | null> {
    try {
      // Убираем @ если есть
      const cleanUsername = username.replace('@', '');
      
      // Используем Telegram Bot API для получения информации о пользователе
      const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat`, {
        params: {
          chat_id: `@${cleanUsername}`
        },
        timeout: 10000
      });

      if (response.data.ok) {
        const chat = response.data.result;
        return {
          platform: 'telegram',
          username: `@${cleanUsername}`,
          displayName: chat.title || cleanUsername,
          avatar: chat.photo?.small_file_id ? `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${chat.photo.small_file_id}` : undefined,
          followers: chat.member_count || 0,
          verified: false, // Telegram не предоставляет информацию о верификации через Bot API
          url: `https://t.me/${cleanUsername}`,
          bio: chat.description || '',
          externalId: chat.id?.toString()
        };
      }
    } catch (error) {
      this.logger.warn(`Не удалось получить данные Telegram для @${username}:`, error.message);
    }

    // Fallback - возвращаем базовую информацию
    return {
      platform: 'telegram',
      username: username.startsWith('@') ? username : `@${username}`,
      displayName: username.replace('@', ''),
      verified: false,
      url: `https://t.me/${username.replace('@', '')}`,
      bio: ''
    };
  }

  private async getInstagramUserData(username: string): Promise<SocialUserData | null> {
    try {
      // Убираем @ если есть
      const cleanUsername = username.replace('@', '');
      
      // Используем Instagram Basic Display API или web scraping
      // Для демонстрации используем моковые данные
      const mockData = {
        platform: 'instagram',
        username: `@${cleanUsername}`,
        displayName: cleanUsername,
        avatar: `https://instagram.com/${cleanUsername}/media/?size=m`,
        followers: Math.floor(Math.random() * 10000),
        verified: Math.random() > 0.7,
        url: `https://instagram.com/${cleanUsername}`,
        bio: `Instagram профиль @${cleanUsername}`,
        externalId: cleanUsername
      };

      this.logger.log(`Получены моковые данные Instagram для @${cleanUsername}`);
      return mockData;
    } catch (error) {
      this.logger.warn(`Не удалось получить данные Instagram для @${username}:`, error.message);
    }

    return {
      platform: 'instagram',
      username: username.startsWith('@') ? username : `@${username}`,
      displayName: username.replace('@', ''),
      verified: false,
      url: `https://instagram.com/${username.replace('@', '')}`,
      bio: ''
    };
  }

  private async getYouTubeUserData(username: string): Promise<SocialUserData | null> {
    try {
      // Убираем @ если есть
      const cleanUsername = username.replace('@', '');
      
      // Используем YouTube Data API v3
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key не настроен');
      }

      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet,statistics',
          forUsername: cleanUsername,
          key: apiKey
        },
        timeout: 10000
      });

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        return {
          platform: 'youtube',
          username: `@${cleanUsername}`,
          displayName: channel.snippet.title,
          avatar: channel.snippet.thumbnails?.default?.url,
          followers: parseInt(channel.statistics.subscriberCount) || 0,
          verified: false, // YouTube API не предоставляет информацию о верификации
          url: `https://youtube.com/@${cleanUsername}`,
          bio: channel.snippet.description || '',
          externalId: channel.id
        };
      }
    } catch (error) {
      this.logger.warn(`Не удалось получить данные YouTube для @${username}:`, error.message);
    }

    return {
      platform: 'youtube',
      username: username.startsWith('@') ? username : `@${username}`,
      displayName: username.replace('@', ''),
      verified: false,
      url: `https://youtube.com/@${username.replace('@', '')}`,
      bio: ''
    };
  }

  private async getTikTokUserData(username: string): Promise<SocialUserData | null> {
    try {
      // Убираем @ если есть
      const cleanUsername = username.replace('@', '');
      
      // TikTok API требует специальной авторизации
      // Для демонстрации используем моковые данные
      const mockData = {
        platform: 'tiktok',
        username: `@${cleanUsername}`,
        displayName: cleanUsername,
        avatar: `https://p16-sign.tiktokcdn-us.com/avatar/${cleanUsername}_100x100.jpeg`,
        followers: Math.floor(Math.random() * 50000),
        verified: Math.random() > 0.8,
        url: `https://tiktok.com/@${cleanUsername}`,
        bio: `TikTok профиль @${cleanUsername}`,
        externalId: cleanUsername
      };

      this.logger.log(`Получены моковые данные TikTok для @${cleanUsername}`);
      return mockData;
    } catch (error) {
      this.logger.warn(`Не удалось получить данные TikTok для @${username}:`, error.message);
    }

    return {
      platform: 'tiktok',
      username: username.startsWith('@') ? username : `@${username}`,
      displayName: username.replace('@', ''),
      verified: false,
      url: `https://tiktok.com/@${username.replace('@', '')}`,
      bio: ''
    };
  }

  async validateSocialLink(platform: string, username: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(platform, username);
      return userData !== null;
    } catch (error) {
      this.logger.error(`Ошибка валидации ссылки ${platform}/${username}:`, error.message);
      return false;
    }
  }

  // Методы для работы с базой данных
  async createSocialLink(userId: string, data: {
    platform: string;
    username: string;
    url: string;
    verified?: boolean;
  }) {
    try {
      this.logger.log(`Создание социальной ссылки для пользователя ${userId}`);
      
      const socialLink = await this.prisma.socialLink.create({
        data: {
          userId,
          platform: data.platform,
          username: data.username,
          url: data.url,
          verified: data.verified || false,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            }
          }
        }
      });

      this.logger.log(`Социальная ссылка создана: ${socialLink.id}`);
      return socialLink;
    } catch (error) {
      this.logger.error(`Ошибка создания социальной ссылки:`, error.message);
      throw error;
    }
  }

  async getUserSocialLinks(userId: string) {
    try {
      this.logger.log(`Получение социальных ссылок пользователя ${userId}`);
      
      const socialLinks = await this.prisma.socialLink.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            }
          }
        }
      });

      this.logger.log(`Найдено социальных ссылок: ${socialLinks.length}`);
      return socialLinks;
    } catch (error) {
      this.logger.error(`Ошибка получения социальных ссылок:`, error.message);
      throw error;
    }
  }

  async updateSocialLink(linkId: string, userId: string, data: {
    username?: string;
    url?: string;
    verified?: boolean;
  }) {
    try {
      this.logger.log(`Обновление социальной ссылки ${linkId}`);
      
      const socialLink = await this.prisma.socialLink.updateMany({
        where: { 
          id: linkId,
          userId // Убеждаемся, что пользователь может обновлять только свои ссылки
        },
        data: {
          ...(data.username && { username: data.username }),
          ...(data.url && { url: data.url }),
          ...(data.verified !== undefined && { verified: data.verified }),
        }
      });

      this.logger.log(`Социальная ссылка обновлена: ${linkId}`);
      return socialLink;
    } catch (error) {
      this.logger.error(`Ошибка обновления социальной ссылки:`, error.message);
      throw error;
    }
  }

  async deleteSocialLink(linkId: string, userId: string) {
    try {
      this.logger.log(`Удаление социальной ссылки ${linkId}`);
      
      const socialLink = await this.prisma.socialLink.deleteMany({
        where: { 
          id: linkId,
          userId // Убеждаемся, что пользователь может удалять только свои ссылки
        }
      });

      this.logger.log(`Социальная ссылка удалена: ${linkId}`);
      return socialLink;
    } catch (error) {
      this.logger.error(`Ошибка удаления социальной ссылки:`, error.message);
      throw error;
    }
  }

  async getSocialLinkById(linkId: string, userId: string) {
    try {
      this.logger.log(`Получение социальной ссылки ${linkId}`);
      
      const socialLink = await this.prisma.socialLink.findFirst({
        where: { 
          id: linkId,
          userId // Убеждаемся, что пользователь может получать только свои ссылки
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            }
          }
        }
      });

      return socialLink;
    } catch (error) {
      this.logger.error(`Ошибка получения социальной ссылки:`, error.message);
      throw error;
    }
  }
}
