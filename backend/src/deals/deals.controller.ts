import { Body, Controller, Get, Logger, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { DealsService } from './deals.service';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DealsController {
  private readonly logger = new Logger(DealsController.name);
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create deal' })
  @ApiResponse({ status: 201, description: 'Deal created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Create Deal', 'Deal')
  async create(@Request() req, @Body() createDealDto: any) {
    this.logger.log(`🤝 Creating deal for product: ${createDealDto.productId} by user: ${req.user.userId}`);
    return this.dealsService.create(req.user.id, createDealDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all deals' })
  @ApiResponse({ status: 200, description: 'Deals retrieved successfully' })
  @ActionLogger('Get All Deals', 'DealsController')
  async findAll() {
    this.logger.log(`📋 Getting all deals (public endpoint)`);
    return this.dealsService.findAll();
  }

  @Get('my/deals')
  @ApiOperation({ summary: 'Get user deals' })
  @ApiResponse({ status: 200, description: 'User deals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get My Deals', 'DealsController')
  async getMyDeals(@Request() req) {
    this.logger.log(`👤 Getting deals for user: ${req.user.userId}`);
    return this.dealsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by id' })
  @ApiResponse({ status: 200, description: 'Deal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ActionLogger('Get Deal Details', 'DealsController')
  async findOne(@Param('id') id: string) {
    this.logger.log(`🔍 Getting deal details: ${id}`);
    return this.dealsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update deal' })
  @ApiResponse({ status: 200, description: 'Deal updated successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Update Deal', 'Deal')
  async update(@Request() req, @Param('id') id: string, @Body() updateDealDto: any) {
    this.logger.log(`✏️ Updating deal: ${id} by user: ${req.user.userId}`);
    return this.dealsService.update(req.user.id, id, updateDealDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel deal' })
  @ApiResponse({ status: 200, description: 'Deal cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Cancel Deal', 'Deal')
  async cancel(@Request() req, @Param('id') id: string) {
    this.logger.log(`❌ Cancelling deal: ${id} by user: ${req.user.userId}`);
    return this.dealsService.cancel(req.user.id, id);
  }
}
