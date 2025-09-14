import { Body, Controller, Get, Logger, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  private readonly logger = new Logger(SupportController.name);
  constructor(private readonly supportService: SupportService) {}

  @Post('message')
  @Public()
  @ApiOperation({ summary: 'Send message to support' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @BusinessLogger('Send Support Message', 'Message')
  async sendMessage(@Request() req, @Body() messageDto: any) {
    this.logger.log(`🆘 Sending support message by user: ${req.user?.userId || 'anonymous'}`);
    // Получаем первого пользователя для демонстрации
    const user = await this.supportService.getFirstUser();
    return this.supportService.sendMessage(user.id, messageDto);
  }

  @Get('messages')
  @Public()
  @ApiOperation({ summary: 'Get support messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ActionLogger('Get Support Messages', 'SupportController')
  async getMessages(@Request() req) {
    this.logger.log(`🆘 Getting support messages for user: ${req.user?.userId || 'anonymous'}`);
    // Получаем первого пользователя для демонстрации
    const user = await this.supportService.getFirstUser();
    return this.supportService.getUserMessages(user.id);
  }
}
