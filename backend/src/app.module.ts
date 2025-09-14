import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AcademyModule } from './academy/academy.module';
import { AdminModule } from './admin/admin.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ChatModule } from './chat/chat.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DealsModule } from './deals/deals.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SocialModule } from './social/social.module';
import { StatisticsModule } from './statistics/statistics.module';
import { SupportModule } from './support/support.module';
import { TelegramModule } from './telegram/telegram.module';
import { TestController } from './test/test.controller';
import { TransactionsModule } from './transactions/transactions.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    ChatModule,
    TransactionsModule,
    PaymentModule,
    UploadModule,
    DealsModule,
    AdminModule,
    SupportModule,
    StatisticsModule,
    AcademyModule,
    AffiliateModule,
    CampaignsModule,
    SocialModule,
    TelegramModule,
  ],
  controllers: [AppController, TestController],
  providers: [
    AppService,
    // Временно отключаем глобальный JWT guard
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
