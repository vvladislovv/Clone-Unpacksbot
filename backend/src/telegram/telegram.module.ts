import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialController, TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [PrismaModule],
  controllers: [TelegramController, SocialController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}

