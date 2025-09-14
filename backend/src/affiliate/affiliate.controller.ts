import { Body, Controller, Get, Logger, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { AffiliateService } from './affiliate.service';

@ApiTags('Affiliate')
@Controller('affiliate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AffiliateController {
  private readonly logger = new Logger(AffiliateController.name);
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get affiliate statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ActionLogger('Get Affiliate Stats', 'AffiliateController')
  async getStats(@Request() req) {
    this.logger.log(`📊 Getting affiliate stats for user: ${req.user?.userId || 'anonymous'}`);
    // Получаем первого пользователя для демонстрации
    const user = await this.affiliateService.getFirstUser();
    return this.affiliateService.getStats(user.id);
  }

  @Get('referrals')
  @Public()
  @ApiOperation({ summary: 'Get referrals' })
  @ApiResponse({ status: 200, description: 'Referrals retrieved successfully' })
  @ActionLogger('Get Referrals', 'AffiliateController')
  async getReferrals(@Request() req) {
    this.logger.log(`🤝 Getting referrals for user: ${req.user?.userId || 'anonymous'}`);
    // Получаем первого пользователя для демонстрации
    const user = await this.affiliateService.getFirstUser();
    return this.affiliateService.getReferrals(user.id);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Get commissions' })
  @ApiResponse({ status: 200, description: 'Commissions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Commissions', 'AffiliateController')
  async getCommissions(@Request() req) {
    this.logger.log(`💰 Getting commissions for user: ${req.user.userId}`);
    return this.affiliateService.getCommissions(req.user.id);
  }

  @Post('payout')
  @ApiOperation({ summary: 'Request payout' })
  @ApiResponse({ status: 201, description: 'Payout request created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Request Payout', 'Payout')
  async requestPayout(@Request() req, @Body() payoutDto: any) {
    this.logger.log(`💸 Requesting payout: ${payoutDto.amount} by user: ${req.user.userId}`);
    return this.affiliateService.requestPayout(req.user.id, payoutDto);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get payout history' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Payout History', 'AffiliateController')
  async getPayouts(@Request() req) {
    this.logger.log(`📋 Getting payout history for user: ${req.user.userId}`);
    return this.affiliateService.getPayouts(req.user.id);
  }
}
