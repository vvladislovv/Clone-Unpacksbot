import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCampaigns(query: any) {
    this.logger.log(`Getting campaigns with filters: ${JSON.stringify(query)}`);
    
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: query.status || undefined,
        type: query.type || undefined,
        advertiserId: query.advertiserId || undefined,
      },
      take: query.limit || 50,
      skip: query.offset || 0,
      orderBy: { createdAt: 'desc' },
    });

    return campaigns;
  }

  async getMyCampaigns(userId: string, query: any) {
    this.logger.log(`Getting campaigns for user: ${userId}`);
    
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        advertiserId: userId,
        status: query.status || undefined,
      },
      take: query.limit || 50,
      skip: query.offset || 0,
      orderBy: { createdAt: 'desc' },
    });

    return campaigns;
  }

  async getCampaign(id: string) {
    this.logger.log(`Getting campaign: ${id}`);
    
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async createCampaign(userId: string, createCampaignDto: any) {
    this.logger.log(`Creating campaign for user: ${userId}`);
    
    const campaign = await this.prisma.campaign.create({
      data: {
        title: createCampaignDto.title,
        description: createCampaignDto.description,
        type: createCampaignDto.type,
        budget: createCampaignDto.budget,
        pricePerClick: createCampaignDto.pricePerClick,
        maxClicks: createCampaignDto.maxClicks,
        startDate: createCampaignDto.startDate ? new Date(createCampaignDto.startDate) : undefined,
        endDate: createCampaignDto.endDate ? new Date(createCampaignDto.endDate) : undefined,
        productId: createCampaignDto.productId,
        channelId: createCampaignDto.channelId,
        advertiserId: userId,
        status: 'DRAFT',
      },
    });

    return campaign;
  }

  async updateCampaign(userId: string, id: string, updateCampaignDto: any) {
    this.logger.log(`Updating campaign: ${id} for user: ${userId}`);
    
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, advertiserId: userId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: updateCampaignDto,
    });

    return updatedCampaign;
  }

  async startCampaign(userId: string, id: string) {
    this.logger.log(`Starting campaign: ${id} for user: ${userId}`);
    
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, advertiserId: userId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    return updatedCampaign;
  }

  async pauseCampaign(userId: string, id: string) {
    this.logger.log(`Pausing campaign: ${id} for user: ${userId}`);
    
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, advertiserId: userId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    return updatedCampaign;
  }

  async recordClick(userId: string, id: string) {
    this.logger.log(`Recording click for campaign: ${id} by user: ${userId}`);
    
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Создаем запись о клике
    const click = await this.prisma.campaignClick.create({
      data: {
        campaignId: id,
        userId,
        clickedAt: new Date(),
      },
    });

    // Обновляем счетчик кликов
    await this.prisma.campaign.update({
      where: { id },
      data: {
        clicksCount: {
          increment: 1,
        },
      },
    });

    return click;
  }
}

