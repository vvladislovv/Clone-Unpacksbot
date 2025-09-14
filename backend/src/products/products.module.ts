import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ImageGeneratorService } from './image-generator.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [HttpModule],
  controllers: [ProductsController],
  providers: [ProductsService, ImageGeneratorService],
  exports: [ProductsService, ImageGeneratorService],
})
export class ProductsModule {}

