import { Controller, Get, Logger, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatisticsController {
  private readonly logger = new Logger(StatisticsController.name);
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('user')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get User Statistics', 'StatisticsController')
  async getUserStats(@Request() req) {
    this.logger.log(`📊 Getting user statistics for: ${req.user.id}`);
    this.logger.log(`📊 User object:`, JSON.stringify(req.user, null, 2));
    return this.statisticsService.getUserStats(req.user.id);
  }

  @Get('product/:id')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Product statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Product Statistics', 'StatisticsController')
  async getProductStats(@Request() req, @Param('id') productId: string) {
    this.logger.log(`📊 Getting product statistics for: ${productId} by user: ${req.user.id}`);
    return this.statisticsService.getProductStats(req.user.id, productId);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales statistics' })
  @ApiResponse({ status: 200, description: 'Sales statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Sales Statistics', 'StatisticsController')
  async getSalesStats(@Request() req) {
    this.logger.log(`📈 Getting sales statistics for user: ${req.user.id}`);
    return this.statisticsService.getSalesStats(req.user.id);
  }
}
