import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ImageGeneratorService {
  private readonly logger = new Logger(ImageGeneratorService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Генерирует URL изображения на основе названия товара
   */
  async generateImageUrl(productTitle: string, width: number = 400, height: number = 400): Promise<string> {
    try {
      // Извлекаем ключевые слова из названия товара
      const keywords = this.extractKeywords(productTitle);
      
      // Пробуем разные источники изображений
      const imageUrl = await this.tryImageSources(keywords, width, height);
      
      this.logger.log(`🖼️ Generated image for "${productTitle}": ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      this.logger.warn(`⚠️ Failed to generate image for "${productTitle}", using fallback: ${error.message}`);
      return this.getFallbackImage(width, height);
    }
  }

  /**
   * Извлекает ключевые слова из названия товара
   */
  private extractKeywords(title: string): string[] {
    // Убираем лишние символы и приводим к нижнему регистру
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Разбиваем на слова и фильтруем короткие слова
    const words = cleanTitle
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 3); // Берем максимум 3 ключевых слова

    return words;
  }

  /**
   * Пробует разные источники изображений
   */
  private async tryImageSources(keywords: string[], width: number, height: number): Promise<string> {
    const sources = [
      () => this.getUnsplashImage(keywords, width, height),
      () => this.getPicsumImage(width, height),
      () => this.getPlaceholderImage(keywords, width, height),
    ];

    for (const source of sources) {
      try {
        const imageUrl = await source();
        if (imageUrl) {
          return imageUrl;
        }
      } catch (error) {
        this.logger.debug(`Image source failed: ${error.message}`);
        continue;
      }
    }

    throw new Error('All image sources failed');
  }

  /**
   * Получает изображение с Unsplash (требует API ключ)
   */
  private async getUnsplashImage(keywords: string[], width: number, height: number): Promise<string> {
    const query = keywords.join(' ');
    const unsplashUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
    
    // Проверяем доступность URL
    try {
      await firstValueFrom(this.httpService.head(unsplashUrl, { timeout: 5000 }));
      return unsplashUrl;
    } catch (error) {
      throw new Error(`Unsplash unavailable: ${error.message}`);
    }
  }

  /**
   * Получает изображение с Lorem Picsum
   */
  private async getPicsumImage(width: number, height: number): Promise<string> {
    const picsumUrl = `https://picsum.photos/${width}/${height}`;
    
    try {
      await firstValueFrom(this.httpService.head(picsumUrl, { timeout: 5000 }));
      return picsumUrl;
    } catch (error) {
      throw new Error(`Picsum unavailable: ${error.message}`);
    }
  }

  /**
   * Получает изображение с Lorem Picsum (случайное)
   */
  private getPlaceholderImage(keywords: string[], width: number, height: number): string {
    const randomId = Math.floor(Math.random() * 1000) + 1;
    return `https://picsum.photos/${width}/${height}?random=${randomId}`;
  }

  /**
   * Резервное изображение
   */
  private getFallbackImage(width: number, height: number): string {
    const randomId = Math.floor(Math.random() * 1000) + 1;
    return `https://picsum.photos/${width}/${height}?random=${randomId}`;
  }

  /**
   * Генерирует несколько изображений для товара
   */
  async generateMultipleImages(productTitle: string, count: number = 3): Promise<string[]> {
    const images: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const imageUrl = await this.generateImageUrl(productTitle, 400, 400);
        images.push(imageUrl);
        
        // Небольшая задержка между запросами
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        this.logger.warn(`Failed to generate image ${i + 1} for "${productTitle}": ${error.message}`);
        images.push(this.getFallbackImage(400, 400));
      }
    }

    return images;
  }

  /**
   * Генерирует изображения на основе категории товара
   */
  async generateImagesByCategory(category: string, productTitle: string, count: number = 3): Promise<string[]> {
    const categoryKeywords = this.getCategoryKeywords(category);
    const titleKeywords = this.extractKeywords(productTitle);
    const combinedKeywords = [...categoryKeywords, ...titleKeywords].slice(0, 3);

    const images: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const imageUrl = await this.generateImageUrl(combinedKeywords.join(' '), 400, 400);
        images.push(imageUrl);
        
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        this.logger.warn(`Failed to generate category image ${i + 1} for "${category}": ${error.message}`);
        images.push(this.getFallbackImage(400, 400));
      }
    }

    return images;
  }

  /**
   * Получает ключевые слова для категории
   */
  private getCategoryKeywords(category: string): string[] {
    const categoryMap: { [key: string]: string[] } = {
      'electronics': ['electronic', 'device', 'gadget'],
      'clothing': ['fashion', 'clothes', 'style'],
      'home': ['home', 'house', 'decor'],
      'beauty': ['beauty', 'cosmetic', 'makeup'],
      'sports': ['sport', 'fitness', 'exercise'],
      'books': ['book', 'reading', 'literature'],
      'toys': ['toy', 'game', 'play'],
      'automotive': ['car', 'auto', 'vehicle'],
      'food': ['food', 'cooking', 'kitchen'],
      'health': ['health', 'medical', 'wellness'],
    };

    return categoryMap[category.toLowerCase()] || [category.toLowerCase()];
  }
}


