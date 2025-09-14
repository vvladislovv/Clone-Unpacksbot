import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'Unpacker Clone API',
      version: '1.0.0',
      description: 'Backend API for Unpacker Clone platform',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}


