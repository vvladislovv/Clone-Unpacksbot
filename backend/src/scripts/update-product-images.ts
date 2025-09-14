import { PrismaService } from '../prisma/prisma.service';

async function updateProductImages() {
  const prisma = new PrismaService();
  
  try {
    console.log('🔄 Обновляем изображения товаров...');
    
    // Получаем все товары
    const products = await prisma.product.findMany({
      select: { id: true, images: true }
    });
    
    console.log(`📦 Найдено товаров: ${products.length}`);
    
    let updated = 0;
    
    for (const product of products) {
      // Проверяем, есть ли старые изображения via.placeholder.com
      const hasOldImages = product.images.some(img => 
        img.includes('via.placeholder.com') || img.includes('example.com')
      );
      
      if (hasOldImages) {
        // Генерируем новые изображения
        const newImages = [];
        for (let i = 0; i < 3; i++) {
          const randomId = Math.floor(Math.random() * 1000) + 1;
          newImages.push(`https://picsum.photos/400/400?random=${randomId}`);
        }
        
        // Обновляем товар
        await prisma.product.update({
          where: { id: product.id },
          data: { images: newImages }
        });
        
        updated++;
        console.log(`✅ Обновлен товар ${product.id}`);
      }
    }
    
    console.log(`🎉 Обновлено товаров: ${updated}`);
    
  } catch (error) {
    console.error('❌ Ошибка обновления изображений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
updateProductImages();

