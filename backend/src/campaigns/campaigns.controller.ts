import { Body, Controller, Get, Logger, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { CampaignsService } from './campaigns.service';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignsController {
  private readonly logger = new Logger(CampaignsController.name);
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'Get campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  @ActionLogger('Get Campaigns', 'CampaignsController')
  async getCampaigns(@Query() query: any) {
    this.logger.log(`📢 Getting campaigns with filters: ${JSON.stringify(query)}`);
    return this.campaignsService.getCampaigns(query);
  }

  @Get('my/campaigns')
  @ApiOperation({ summary: 'Get my campaigns' })
  @ApiResponse({ status: 200, description: 'My campaigns retrieved successfully' })
  @ActionLogger('Get My Campaigns', 'CampaignsController')
  async getMyCampaigns(@Request() req, @Query() query: any) {
    this.logger.log(`👤 Getting campaigns for user: ${req.user.userId}`);
    return this.campaignsService.getMyCampaigns(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by id' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ActionLogger('Get Campaign Details', 'CampaignsController')
  async getCampaign(@Param('id') id: string) {
    this.logger.log(`🔍 Getting campaign details: ${id}`);
    return this.campaignsService.getCampaign(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  @BusinessLogger('Create Campaign', 'Campaign')
  async createCampaign(@Request() req, @Body() createCampaignDto: any) {
    this.logger.log(`📢 Creating campaign: ${createCampaignDto.title} by user: ${req.user.userId}`);
    return this.campaignsService.createCampaign(req.user.id, createCampaignDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  @BusinessLogger('Update Campaign', 'Campaign')
  async updateCampaign(@Request() req, @Param('id') id: string, @Body() updateCampaignDto: any) {
    this.logger.log(`✏️ Updating campaign: ${id} by user: ${req.user.userId}`);
    return this.campaignsService.updateCampaign(req.user.id, id, updateCampaignDto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start campaign' })
  @ApiResponse({ status: 200, description: 'Campaign started successfully' })
  @BusinessLogger('Start Campaign', 'Campaign')
  async startCampaign(@Request() req, @Param('id') id: string) {
    this.logger.log(`▶️ Starting campaign: ${id} by user: ${req.user.userId}`);
    return this.campaignsService.startCampaign(req.user.id, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause campaign' })
  @ApiResponse({ status: 200, description: 'Campaign paused successfully' })
  @BusinessLogger('Pause Campaign', 'Campaign')
  async pauseCampaign(@Request() req, @Param('id') id: string) {
    this.logger.log(`⏸️ Pausing campaign: ${id} by user: ${req.user.userId}`);
    return this.campaignsService.pauseCampaign(req.user.id, id);
  }

  @Post(':id/click')
  @ApiOperation({ summary: 'Record campaign click' })
  @ApiResponse({ status: 200, description: 'Click recorded successfully' })
  @BusinessLogger('Record Campaign Click', 'Campaign')
  async recordClick(@Request() req, @Param('id') id: string) {
    this.logger.log(`👆 Recording click for campaign: ${id} by user: ${req.user.userId}`);
    return this.campaignsService.recordClick(req.user.id, id);
  }
}

