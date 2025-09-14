import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageGeneratorService } from './image-generator.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private imageGenerator: ImageGeneratorService,
  ) {}

  async findAll(query: any = {}) {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice } = query;
    
    this.logger.log(`🔍 Products query started with params: ${JSON.stringify(query)}`);
    
    // Строим условия фильтрации
    const where: any = { isActive: true };
    
    if (category) {
      where.category = category;
      this.logger.log(`📂 Filtering by category: ${category}`);
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
      this.logger.log(`🔎 Filtering by search: ${search}`);
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
      this.logger.log(`💰 Filtering by price: ${minPrice || 'no min'} - ${maxPrice || 'no max'}`);
    }
    
    // Вычисляем пагинацию
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    this.logger.log(`📊 Pagination: page=${page}, limit=${limit}, skip=${skip}, take=${take}`);
    this.logger.log(`🔍 Where clause: ${JSON.stringify(where)}`);
    
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);
    
    this.logger.log(`📦 Found ${products.length} products out of ${total} total`);
    this.logger.log(`📄 Returning page ${page} of ${Math.ceil(total / parseInt(limit))} pages`);
    
    // Логируем детали каждого товара
    products.forEach((product, index) => {
      this.logger.log(`   ${index + 1}. ${product.title} (${product.category}) - ${product.price} ₽`);
    });
    
    const result = {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
    
    this.logger.log(`✅ Products query completed successfully`);
    return result;
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.product.findMany({
      where: { sellerId: userId },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async create(createProductDto: any) {
    const { price, images, ...rest } = createProductDto;
    
    try {
      // Генерируем изображения, если они не предоставлены
      let productImages: string[] = images || [];
      
      if (!images || images.length === 0) {
        this.logger.log(`🖼️ Generating images for product: ${createProductDto.title}`);
        productImages = await this.imageGenerator.generateImagesByCategory(
          createProductDto.category || 'general',
          createProductDto.title,
          3
        );
      }

      const product = await this.prisma.product.create({
        data: {
          ...rest,
          price: price ? parseFloat(price) : 0,
          images: productImages,
        },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      this.logger.log(`✅ Product created with ${productImages.length} images: ${product.id}`);
      return product;
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('wbArticle')) {
        throw new ConflictException('Product with this wbArticle already exists');
      }
      throw error;
    }
  }

  async update(id: string, updateProductDto: any) {
    const { price, ...rest } = updateProductDto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(price && { price: parseFloat(price) }),
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Обновляет изображения для существующего товара
   */
  async updateImages(id: string, force: boolean = false) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, title: true, category: true, images: true }
    });

    if (!product) {
      throw new ConflictException('Product not found');
    }

    // Если изображения уже есть и не принудительное обновление, пропускаем
    if (!force && product.images && product.images.length > 0) {
      this.logger.log(`📷 Product ${id} already has images, skipping generation`);
      return product;
    }

    this.logger.log(`🖼️ Updating images for product: ${product.title}`);
    
    const newImages = await this.imageGenerator.generateImagesByCategory(
      product.category || 'general',
      product.title,
      3
    );

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { images: newImages },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`✅ Updated product ${id} with ${newImages.length} new images`);
    return updatedProduct;
  }

  /**
   * Обновляет изображения для всех товаров без изображений
   */
  async updateAllMissingImages() {
    this.logger.log('🔄 Starting bulk image update for products without images');
    
    const productsWithoutImages = await this.prisma.product.findMany({
      where: {
        OR: [
          { images: { isEmpty: true } },
          { images: null }
        ]
      },
      select: { id: true, title: true, category: true }
    });

    this.logger.log(`📊 Found ${productsWithoutImages.length} products without images`);

    const results = [];
    for (const product of productsWithoutImages) {
      try {
        const updated = await this.updateImages(product.id, true);
        results.push({ id: product.id, success: true, images: updated.images.length });
      } catch (error) {
        this.logger.error(`❌ Failed to update images for product ${product.id}: ${error.message}`);
        results.push({ id: product.id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`✅ Bulk image update completed: ${successCount}/${productsWithoutImages.length} successful`);
    
    return {
      total: productsWithoutImages.length,
      successful: successCount,
      failed: productsWithoutImages.length - successCount,
      results
    };
  }

  async remove(id: string) {
    // Проверяем наличие связанных сделок
    const dealsCount = await this.prisma.deal.count({
      where: { productId: id }
    });

    if (dealsCount > 0) {
      throw new ConflictException(`Cannot delete product. It has ${dealsCount} related deals. Please cancel or complete all deals first.`);
    }

    // Проверяем наличие связанных кампаний (удалено - кампании не используются)

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
