import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ActionLogger } from './common/decorators/action-logger.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get app info' })
  @ApiResponse({ status: 200, description: 'App information' })
  @ActionLogger('Get App Info', 'AppController')
  getAppInfo() {
    this.logger.log(`🏠 Getting app information`);
    return this.appService.getAppInfo();
  }
}

