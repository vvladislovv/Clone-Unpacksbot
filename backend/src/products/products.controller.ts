import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @BusinessLogger('Create Product', 'Product')
  create(@Body() createProductDto: any, @Request() req) {
    this.logger.log(`📦 Creating product: ${createProductDto.title} by user: ${req.user.userId}`);
    return this.productsService.create({
      ...createProductDto,
      sellerId: req.user.id,
    });
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ActionLogger('Get Products Catalog', 'ProductsController')
  async findAll(@Query() query: any) {
    this.logger.log(`📋 Catalog request - Filters: ${JSON.stringify(query)}`);
    this.logger.log(`🌐 Request from: ${query.userAgent || 'unknown'}`);
    
    const result = await this.productsService.findAll(query);
    
    this.logger.log(`📊 RESPONSE: Returning ${result.products.length} products`);
    this.logger.log(`📄 Pagination: page ${result.pagination.page}/${result.pagination.pages} (${result.pagination.total} total)`);
    
    return result;
  }

  @Get('my/products')
  @ApiOperation({ summary: 'Get user products' })
  @ApiResponse({ status: 200, description: 'User products retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get My Products', 'ProductsController')
  async getMyProducts(@Request() req) {
    this.logger.log(`👤 My products request from user: ${req.user.userId}`);
    return this.productsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ActionLogger('Get Product Details', 'ProductsController')
  findOne(@Param('id') id: string) {
    this.logger.log(`🔍 Product details request: ${id}`);
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @BusinessLogger('Update Product', 'Product')
  update(@Param('id') id: string, @Body() updateProductDto: any, @Request() req) {
    this.logger.log(`✏️ Updating product: ${id} by user: ${req.user?.userId || 'unknown'}`);
    return this.productsService.update(id, updateProductDto);
  }

  @Put(':id/images')
  @ApiOperation({ summary: 'Update product images' })
  @ApiResponse({ status: 200, description: 'Product images updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ActionLogger('Update Product Images', 'ProductsController')
  updateImages(@Param('id') id: string, @Query('force') force?: string) {
    const forceUpdate = force === 'true';
    this.logger.log(`🖼️ Updating images for product: ${id} (force: ${forceUpdate})`);
    return this.productsService.updateImages(id, forceUpdate);
  }

  @Post('images/update-all')
  @ApiOperation({ summary: 'Update images for all products without images' })
  @ApiResponse({ status: 200, description: 'Bulk image update completed' })
  @ActionLogger('Bulk Update Images', 'ProductsController')
  updateAllMissingImages() {
    this.logger.log('🔄 Starting bulk image update for all products without images');
    return this.productsService.updateAllMissingImages();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @BusinessLogger('Delete Product', 'Product')
  remove(@Param('id') id: string, @Request() req) {
    this.logger.log(`🗑️ Deleting product: ${id} by user: ${req.user?.userId || 'unknown'}`);
    return this.productsService.remove(id);
  }
}
