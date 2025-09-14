import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialService } from './social.service';

export class GetUserDataDto {
  platform: string;
  username: string;
}

export class ValidateLinkDto {
  platform: string;
  username: string;
}

export class CreateSocialLinkDto {
  @IsString()
  platform: string;
  
  @IsString()
  username: string;
  
  @IsUrl()
  url: string;
  
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class UpdateSocialLinkDto {
  @IsOptional()
  @IsString()
  username?: string;
  
  @IsOptional()
  @IsUrl()
  url?: string;
  
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

@Controller('social')
export class SocialController {
  private readonly logger = new Logger(SocialController.name);

  constructor(private readonly socialService: SocialService) {}

  @Get('user-data/:platform/:username')
  @UseGuards(JwtAuthGuard)
  async getUserData(
    @Param('platform') platform: string,
    @Param('username') username: string
  ) {
    this.logger.log(`Запрос данных пользователя ${username} с платформы ${platform}`);
    
    try {
      const userData = await this.socialService.getUserData(platform, username);
      
      if (!userData) {
        return {
          success: false,
          message: 'Не удалось получить данные пользователя',
          data: null
        };
      }

      return {
        success: true,
        message: 'Данные пользователя получены успешно',
        data: userData
      };
    } catch (error) {
      this.logger.error(`Ошибка получения данных пользователя:`, error.message);
      return {
        success: false,
        message: 'Ошибка получения данных пользователя',
        data: null
      };
    }
  }

  @Post('user-data')
  @UseGuards(JwtAuthGuard)
  async getUserDataByBody(@Body() dto: GetUserDataDto) {
    this.logger.log(`Запрос данных пользователя ${dto.username} с платформы ${dto.platform}`);
    
    try {
      const userData = await this.socialService.getUserData(dto.platform, dto.username);
      
      if (!userData) {
        return {
          success: false,
          message: 'Не удалось получить данные пользователя',
          data: null
        };
      }

      return {
        success: true,
        message: 'Данные пользователя получены успешно',
        data: userData
      };
    } catch (error) {
      this.logger.error(`Ошибка получения данных пользователя:`, error.message);
      return {
        success: false,
        message: 'Ошибка получения данных пользователя',
        data: null
      };
    }
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validateLink(@Body() dto: ValidateLinkDto) {
    this.logger.log(`Валидация ссылки ${dto.platform}/${dto.username}`);
    
    try {
      const isValid = await this.socialService.validateSocialLink(dto.platform, dto.username);
      
      return {
        success: true,
        message: isValid ? 'Ссылка валидна' : 'Ссылка невалидна',
        data: {
          valid: isValid,
          platform: dto.platform,
          username: dto.username
        }
      };
    } catch (error) {
      this.logger.error(`Ошибка валидации ссылки:`, error.message);
      return {
        success: false,
        message: 'Ошибка валидации ссылки',
        data: {
          valid: false,
          platform: dto.platform,
          username: dto.username
        }
      };
    }
  }

  @Get('platforms')
  @UseGuards(JwtAuthGuard)
  async getSupportedPlatforms() {
    return {
      success: true,
      message: 'Поддерживаемые платформы получены',
      data: {
        platforms: [
          {
            id: 'telegram',
            name: 'Telegram',
            icon: '📱',
            description: 'Мессенджер и платформа для общения',
            example: '@username'
          },
          {
            id: 'instagram',
            name: 'Instagram',
            icon: '📷',
            description: 'Социальная сеть для фото и видео',
            example: '@username'
          },
          {
            id: 'youtube',
            name: 'YouTube',
            icon: '📺',
            description: 'Платформа для видео контента',
            example: '@username'
          },
          {
            id: 'tiktok',
            name: 'TikTok',
            icon: '🎵',
            description: 'Платформа для коротких видео',
            example: '@username'
          }
        ]
      }
    };
  }

  // Методы для работы с социальными ссылками в БД
  @Post('links')
  @UseGuards(JwtAuthGuard)
  async createSocialLink(@Request() req, @Body(ValidationPipe) dto: CreateSocialLinkDto) {
    this.logger.log(`Создание социальной ссылки для пользователя ${req.user.id}`);
    
    try {
      const socialLink = await this.socialService.createSocialLink(req.user.id, dto);
      
      return {
        success: true,
        message: 'Социальная ссылка создана успешно',
        data: socialLink
      };
    } catch (error) {
      this.logger.error(`Ошибка создания социальной ссылки:`, error.message);
      return {
        success: false,
        message: 'Ошибка создания социальной ссылки',
        data: null
      };
    }
  }

  @Get('links')
  @UseGuards(JwtAuthGuard)
  async getUserSocialLinks(@Request() req) {
    this.logger.log(`Получение социальных ссылок пользователя ${req.user.id}`);
    
    try {
      const socialLinks = await this.socialService.getUserSocialLinks(req.user.id);
      
      return {
        success: true,
        message: 'Социальные ссылки получены успешно',
        data: socialLinks
      };
    } catch (error) {
      this.logger.error(`Ошибка получения социальных ссылок:`, error.message);
      return {
        success: false,
        message: 'Ошибка получения социальных ссылок',
        data: []
      };
    }
  }

  @Get('links/:id')
  @UseGuards(JwtAuthGuard)
  async getSocialLinkById(@Request() req, @Param('id') id: string) {
    this.logger.log(`Получение социальной ссылки ${id} для пользователя ${req.user.id}`);
    
    try {
      const socialLink = await this.socialService.getSocialLinkById(id, req.user.id);
      
      if (!socialLink) {
        return {
          success: false,
          message: 'Социальная ссылка не найдена',
          data: null
        };
      }

      return {
        success: true,
        message: 'Социальная ссылка получена успешно',
        data: socialLink
      };
    } catch (error) {
      this.logger.error(`Ошибка получения социальной ссылки:`, error.message);
      return {
        success: false,
        message: 'Ошибка получения социальной ссылки',
        data: null
      };
    }
  }

  @Put('links/:id')
  @UseGuards(JwtAuthGuard)
  async updateSocialLink(@Request() req, @Param('id') id: string, @Body(ValidationPipe) dto: UpdateSocialLinkDto) {
    this.logger.log(`Обновление социальной ссылки ${id} для пользователя ${req.user.id}`);
    
    try {
      const result = await this.socialService.updateSocialLink(id, req.user.id, dto);
      
      if (result.count === 0) {
        return {
          success: false,
          message: 'Социальная ссылка не найдена или нет прав на обновление',
          data: null
        };
      }

      return {
        success: true,
        message: 'Социальная ссылка обновлена успешно',
        data: { id, ...dto }
      };
    } catch (error) {
      this.logger.error(`Ошибка обновления социальной ссылки:`, error.message);
      return {
        success: false,
        message: 'Ошибка обновления социальной ссылки',
        data: null
      };
    }
  }

  @Delete('links/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSocialLink(@Request() req, @Param('id') id: string) {
    this.logger.log(`Удаление социальной ссылки ${id} для пользователя ${req.user.id}`);
    
    try {
      const result = await this.socialService.deleteSocialLink(id, req.user.id);
      
      if (result.count === 0) {
        return {
          success: false,
          message: 'Социальная ссылка не найдена или нет прав на удаление',
          data: null
        };
      }

      return {
        success: true,
        message: 'Социальная ссылка удалена успешно',
        data: { id }
      };
    } catch (error) {
      this.logger.error(`Ошибка удаления социальной ссылки:`, error.message);
      return {
        success: false,
        message: 'Ошибка удаления социальной ссылки',
        data: null
      };
    }
  }
}
