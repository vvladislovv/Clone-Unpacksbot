import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { TelegramService } from './telegram.service';

@ApiTags('Telegram')
@Controller('telegram')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  constructor(private readonly telegramService: TelegramService) {}

  @Get('user/:telegramId')
  @ApiOperation({ summary: 'Get Telegram user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ActionLogger('Get Telegram User Info', 'TelegramController')
  async getUserInfo(@Param('telegramId') telegramId: string) {
    this.logger.log(`👤 Getting Telegram user info: ${telegramId}`);
    return this.telegramService.getUserInfo(telegramId);
  }

  @Get('user/:telegramId/photo')
  @ApiOperation({ summary: 'Get Telegram user photo' })
  @ApiResponse({ status: 200, description: 'User photo retrieved successfully' })
  @ActionLogger('Get Telegram User Photo', 'TelegramController')
  async getUserPhoto(@Param('telegramId') telegramId: string) {
    this.logger.log(`📸 Getting Telegram user photo: ${telegramId}`);
    return this.telegramService.getUserPhoto(telegramId);
  }

  @Get('search/:username')
  @ApiOperation({ summary: 'Search Telegram user by username' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @ActionLogger('Search Telegram User', 'TelegramController')
  async searchUser(@Param('username') username: string) {
    this.logger.log(`🔍 Searching Telegram user: ${username}`);
    return this.telegramService.searchUser(username);
  }

  @Post('verify/:telegramId')
  @ApiOperation({ summary: 'Verify Telegram user' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @BusinessLogger('Verify Telegram User', 'User')
  async verifyUser(@Param('telegramId') telegramId: string, @Body() verifyDto: any) {
    this.logger.log(`✅ Verifying Telegram user: ${telegramId}`);
    return this.telegramService.verifyUser(telegramId, verifyDto);
  }
}

@ApiTags('Social')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  private readonly logger = new Logger(SocialController.name);
  constructor(private readonly telegramService: TelegramService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect social account' })
  @ApiResponse({ status: 201, description: 'Social account connected successfully' })
  @BusinessLogger('Connect Social Account', 'Social')
  async connectAccount(@Request() req, @Body() connectDto: any) {
    this.logger.log(`🔗 Connecting social account: ${connectDto.platform} for user: ${req.user.userId}`);
    return this.telegramService.connectAccount(req.user.id, connectDto);
  }

  @Get('links')
  @ApiOperation({ summary: 'Get social links' })
  @ApiResponse({ status: 200, description: 'Social links retrieved successfully' })
  @ActionLogger('Get Social Links', 'SocialController')
  async getSocialLinks(@Request() req) {
    this.logger.log(`🔗 Getting social links for user: ${req.user.userId}`);
    return this.telegramService.getSocialLinks(req.user.id);
  }

  @Put('links/:linkId')
  @ApiOperation({ summary: 'Update social link' })
  @ApiResponse({ status: 200, description: 'Social link updated successfully' })
  @BusinessLogger('Update Social Link', 'Social')
  async updateSocialLink(@Request() req, @Param('linkId') linkId: string, @Body() updateDto: any) {
    this.logger.log(`✏️ Updating social link: ${linkId} for user: ${req.user.userId}`);
    return this.telegramService.updateSocialLink(req.user.id, linkId, updateDto);
  }

  @Delete('links/:linkId')
  @ApiOperation({ summary: 'Delete social link' })
  @ApiResponse({ status: 200, description: 'Social link deleted successfully' })
  @BusinessLogger('Delete Social Link', 'Social')
  async deleteSocialLink(@Request() req, @Param('linkId') linkId: string) {
    this.logger.log(`🗑️ Deleting social link: ${linkId} for user: ${req.user.userId}`);
    return this.telegramService.deleteSocialLink(req.user.id, linkId);
  }
}

