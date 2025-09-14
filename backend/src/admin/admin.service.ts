import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  
  constructor(
    private prisma: PrismaService,
    private chatService: ChatService
  ) {}

  async getStats() {
    this.logger.log('📊 Начинаем получение статистики админки...');
    
    const [
      totalUsers,
      totalProducts,
      totalDeals,
      totalTransactions,
      activeUsers,
      totalRevenue,
      newMessages,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.deal.count(),
      this.prisma.transaction.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    ]);

    this.logger.log(`📊 Получены базовые данные: пользователи=${totalUsers}, товары=${totalProducts}, сделки=${totalDeals}, транзакции=${totalTransactions}, активные=${activeUsers}, сообщения=${newMessages}`);
    
    // Дополнительная проверка товаров
    const allProducts = await this.prisma.product.count();
    const activeProducts = await this.prisma.product.count({ where: { isActive: true } });
    this.logger.log(`📦 Детальная проверка товаров: всего=${allProducts}, активных=${activeProducts}`);

    // Вычисляем изменения за последний месяц
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [
      usersLastMonth,
      productsLastMonth,
      revenueLastMonth,
      messagesLastMonth,
      dealsLastMonth,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: oneMonthAgo } }
      }),
      this.prisma.product.count({
        where: { createdAt: { gte: oneMonthAgo } }
      }),
      this.prisma.transaction.aggregate({
        where: { 
          status: 'COMPLETED',
          createdAt: { gte: oneMonthAgo }
        },
        _sum: { amount: true },
      }),
      this.prisma.supportTicket.count({
        where: { 
          status: 'OPEN',
          createdAt: { gte: oneMonthAgo }
        }
      }),
      this.prisma.deal.count({
        where: { createdAt: { gte: oneMonthAgo } }
      }),
    ]);

    const usersChange = totalUsers > 0 ? Math.round((usersLastMonth / totalUsers) * 100) : 0;
    const productsChange = totalProducts > 0 ? Math.round((productsLastMonth / totalProducts) * 100) : 0;
    const totalRevenueAmount = Number(totalRevenue._sum.amount || 0);
    const revenueLastMonthAmount = Number(revenueLastMonth._sum.amount || 0);
    const revenueChange = totalRevenueAmount > 0 ? 
      Math.round((revenueLastMonthAmount / totalRevenueAmount) * 100) : 0;
    const messagesChange = newMessages > 0 ? Math.round((messagesLastMonth / newMessages) * 100) : 0;
    const dealsChange = totalDeals > 0 ? Math.round((dealsLastMonth / totalDeals) * 100) : 0;

    const result = {
      totalUsers,
      totalProducts,
      totalDeals,
      totalTransactions,
      activeUsers,
      totalRevenue: totalRevenueAmount,
      newMessages,
      usersChange,
      productsChange,
      revenueChange,
      messagesChange,
      dealsChange,
    };

    this.logger.log(`📊 Финальная статистика: ${JSON.stringify(result)}`);
    return result;
  }

  async getMessages() {
    this.logger.log('💬 Получаем сообщения поддержки...');
    
    const messages = await this.prisma.supportTicket.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`💬 Найдено сообщений: ${messages.length}`);
    this.logger.log(`💬 Первые 3 сообщения: ${JSON.stringify(messages.slice(0, 3).map(m => ({ id: m.id, subject: m.subject, user: m.user.firstName + ' ' + m.user.lastName, status: m.status })))}`);
    
    return messages;
  }

  async replyToMessage(messageId: string, replyDto: any) {
    this.logger.log(`💬 Отвечаем на сообщение поддержки: ${messageId}`);
    
    try {
      // Находим тикет поддержки
      const supportTicket = await this.prisma.supportTicket.findUnique({
        where: { id: messageId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              telegramId: true
            }
          }
        }
      });

      if (!supportTicket) {
        this.logger.error(`❌ Тикет поддержки не найден: ${messageId}`);
        throw new Error('Support ticket not found');
      }

      // Находим или создаем админа
      let adminUser = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (!adminUser) {
        // Создаем админа если его нет
        adminUser = await this.prisma.user.create({
          data: {
            username: 'admin',
            firstName: 'Admin',
            lastName: 'System',
            role: 'ADMIN',
            isActive: true,
            isVerified: true,
            email: 'admin@system.local'
          }
        });
        this.logger.log(`👤 Создан админ пользователь: ${adminUser.id}`);
      }

      // Обновляем статус тикета
      const updatedTicket = await this.prisma.supportTicket.update({
        where: { id: messageId },
        data: {
          status: 'IN_PROGRESS',
          assigneeId: adminUser.id,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              telegramId: true
            }
          }
        }
      });

      // Получаем или создаем чат с админом для пользователя
      const adminChat = await this.chatService.getAdminChat(supportTicket.userId);
      
      // Добавляем админа в чат, если его там нет
      const adminParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: adminChat.id,
          userId: adminUser.id
        }
      });

      if (!adminParticipant) {
        await this.prisma.chatParticipant.create({
          data: {
            chatId: adminChat.id,
            userId: adminUser.id,
            isAdmin: true
          }
        });
        this.logger.log(`👤 Админ добавлен в чат: ${adminChat.id}`);
      }

      // Отправляем сообщение в чат от имени админа
      const chatMessage = await this.prisma.message.create({
        data: {
          chatId: adminChat.id,
          senderId: adminUser.id,
          type: 'TEXT',
          content: replyDto.content,
          metadata: {
            isFromAdmin: true,
            supportTicketId: messageId,
            adminReply: true,
            originalTicket: {
              id: supportTicket.id,
              subject: supportTicket.subject
            }
          }
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      // Создаем уведомление для пользователя
      await this.prisma.notification.create({
        data: {
          userId: supportTicket.userId,
          title: 'Ответ от поддержки',
          message: `Получен ответ на ваше обращение: "${replyDto.content}"`,
          type: 'INFO',
          metadata: {
            supportTicketId: messageId,
            chatId: adminChat.id,
            messageId: chatMessage.id,
            isAdminReply: true
          }
        }
      });

      this.logger.log(`✅ Ответ админа отправлен в чат ${adminChat.id} пользователю ${supportTicket.user.firstName} ${supportTicket.user.lastName}`);
      
      return {
        success: true,
        ticket: updatedTicket,
        chatMessage: chatMessage,
        chatId: adminChat.id,
        reply: 'Ответ успешно отправлен пользователю в чат',
        adminUser: {
          id: adminUser.id,
          username: adminUser.username,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName
        }
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка при ответе на сообщение: ${error.message}`);
      throw error;
    }
  }

  async getChatMessages() {
    this.logger.log('💬 Получаем сообщения чатов для админа...');
    
    // Получаем все сообщения из чатов с админом
    const messages = await this.prisma.message.findMany({
      where: {
        chat: {
          isGroup: false // Админские чаты обычно не групповые
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        chat: {
          include: {
            participants: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    this.logger.log(`✅ Найдено ${messages.length} сообщений чатов`);
    
    return messages;
  }

  async getUsers() {
    this.logger.log('👥 Получаем всех пользователей...');
    
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        balance: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`👥 Найдено пользователей: ${users.length}`);
    this.logger.log(`👥 Роли пользователей: ${JSON.stringify(users.reduce((acc, user) => { acc[user.role] = (acc[user.role] || 0) + 1; return acc; }, {}))}`);
    this.logger.log(`👥 Первые 3 пользователя: ${JSON.stringify(users.slice(0, 3).map(u => ({ id: u.id, name: u.firstName + ' ' + u.lastName, role: u.role, email: u.email })))}`);
    
    return users;
  }

  async updateUser(userId: string, updateUserDto: any) {
    this.logger.log(`✏️ Обновляем пользователя: ${userId}`);
    
    try {
      // Валидация обязательных полей
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Подготавливаем данные для обновления
      const updateData: any = {};
      
      if (updateUserDto.firstName) updateData.firstName = updateUserDto.firstName;
      if (updateUserDto.lastName !== undefined) updateData.lastName = updateUserDto.lastName;
      if (updateUserDto.email) updateData.email = updateUserDto.email;
      if (updateUserDto.phone !== undefined) updateData.phone = updateUserDto.phone;
      if (updateUserDto.username !== undefined) updateData.username = updateUserDto.username;
      if (updateUserDto.role) updateData.role = updateUserDto.role;
      if (updateUserDto.verified !== undefined) updateData.isVerified = updateUserDto.verified;
      if (updateUserDto.password) {
        updateData.passwordHash = await this.hashPassword(updateUserDto.password);
      }

      // Проверяем, существует ли пользователь
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('Пользователь не найден');
      }

      // Если обновляется email, проверяем уникальность
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: updateData.email }
        });

        if (emailExists) {
          throw new Error('Пользователь с таким email уже существует');
        }
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isVerified: true,
          balance: true,
          updatedAt: true,
        },
      });

      this.logger.log(`✅ Пользователь обновлен: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`❌ Ошибка обновления пользователя: ${error.message}`);
      this.logger.error(`❌ Код ошибки: ${error.code}`);
      this.logger.error(`❌ Имя ошибки: ${error.name}`);
      
      // Обрабатываем все возможные варианты ошибок
      if (
        error.code === 'P2002' ||
        error.name === 'PrismaClientKnownRequestError' ||
        error.message.includes('Unique constraint failed') ||
        error.message.includes('уже существует') ||
        error.message.includes('already exists')
      ) {
        const errorMessage = 'Пользователь с таким email уже существует';
        this.logger.warn(`⚠️ ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }

  async blockUser(userId: string, reason: string) {
    this.logger.log(`🚫 Блокируем пользователя ${userId}, причина: ${reason}`);
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        isBlocked: true,
        // Можно добавить поле для хранения причины блокировки в будущем
      },
      select: {
        id: true,
        username: true,
        isActive: true,
        isBlocked: true,
        updatedAt: true,
      },
    });
  }

  async unblockUser(userId: string) {
    this.logger.log(`✅ Разблокируем пользователя ${userId}`);
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: true,
        isBlocked: false,
      },
      select: {
        id: true,
        username: true,
        isActive: true,
        isBlocked: true,
        updatedAt: true,
      },
    });
  }

  async verifyUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      select: {
        id: true,
        username: true,
        isVerified: true,
        updatedAt: true,
      },
    });
  }

  async createUser(createUserDto: any) {
    this.logger.log(`👤 Создаем пользователя админом: ${createUserDto.firstName} ${createUserDto.lastName}`);
    
    try {
      // Валидация обязательных полей
      if (!createUserDto.firstName) {
        throw new Error('First name is required');
      }
      if (!createUserDto.email) {
        throw new Error('Email is required');
      }

      // Проверяем, существует ли пользователь с таким email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        this.logger.warn(`⚠️ Пользователь с email ${createUserDto.email} уже существует`);
        throw new Error(`Пользователь с email ${createUserDto.email} уже существует`);
      }

      const user = await this.prisma.user.create({
        data: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName || '',
          email: createUserDto.email,
          phone: createUserDto.phone || null,
          username: createUserDto.username || null,
          role: createUserDto.role || 'BUYER',
          isActive: true,
          isVerified: createUserDto.verified || false,
          passwordHash: createUserDto.password ? await this.hashPassword(createUserDto.password) : null,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`✅ Пользователь создан админом: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`❌ Ошибка создания пользователя: ${error.message}`);
      this.logger.error(`❌ Код ошибки: ${error.code}`);
      this.logger.error(`❌ Имя ошибки: ${error.name}`);
      this.logger.error(`❌ Полная ошибка:`, error);
      
      // Обрабатываем все возможные варианты ошибок дублирования email
      if (
        error.code === 'P2002' ||
        error.name === 'PrismaClientKnownRequestError' ||
        error.message.includes('Unique constraint failed') ||
        error.message.includes('уже существует') ||
        error.message.includes('already exists')
      ) {
        const errorMessage = 'Пользователь с таким email уже существует';
        this.logger.warn(`⚠️ ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // Простая хеш-функция для демонстрации
    // В реальном проекте используйте bcrypt
    return Buffer.from(password).toString('base64');
  }

  async getProducts() {
    this.logger.log('📦 Получаем все товары...');
    
    const products = await this.prisma.product.findMany({
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
    });

    this.logger.log(`📦 Найдено товаров: ${products.length}`);
    this.logger.log(`📦 Активных товаров: ${products.filter(p => p.isActive).length}`);
    this.logger.log(`📦 Категории товаров: ${JSON.stringify(products.reduce((acc, product) => { acc[product.category] = (acc[product.category] || 0) + 1; return acc; }, {}))}`);
    this.logger.log(`📦 Первые 3 товара: ${JSON.stringify(products.slice(0, 3).map(p => ({ id: p.id, title: p.title, price: p.price, category: p.category, seller: p.seller.firstName + ' ' + p.seller.lastName, isActive: p.isActive })))}`);
    
    return products;
  }

  async createProduct(createProductDto: any) {
    this.logger.log(`📦 Создаем товар админом: ${createProductDto.title}`);
    
    try {
      // Валидация обязательных полей
      if (!createProductDto.title) {
        this.logger.error('❌ Ошибка валидации: Title is required');
        throw new Error('Title is required');
      }
      if (!createProductDto.wbArticle) {
        this.logger.error('❌ Ошибка валидации: WB Article is required');
        throw new Error('WB Article is required');
      }
      if (!createProductDto.category) {
        this.logger.error('❌ Ошибка валидации: Category is required');
        throw new Error('Category is required');
      }

      this.logger.log('✅ Валидация пройдена, ищем админа...');

      // Находим или создаем админа
      let adminUser = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (!adminUser) {
        this.logger.log('👤 Админ не найден, создаем нового...');
        // Создаем админа если его нет
        adminUser = await this.prisma.user.create({
          data: {
            username: 'admin',
            firstName: 'Admin',
            lastName: 'System',
            role: 'ADMIN',
            isActive: true,
            isVerified: true,
            email: 'admin@system.local'
          }
        });
        this.logger.log(`👤 Создан админ пользователь: ${adminUser.id}`);
      } else {
        this.logger.log(`👤 Найден админ пользователь: ${adminUser.id}`);
      }

      const { price, images, ...rest } = createProductDto;
      
      this.logger.log(`📋 Обрабатываем данные товара: rest=${JSON.stringify(rest)}, price=${price}, images=${JSON.stringify(images)}`);
      
      // Генерируем изображения, если они не предоставлены
      let productImages: string[] = images || [];
      
      if (!images || images.length === 0) {
        this.logger.log(`🖼️ Генерируем изображения для товара: ${createProductDto.title}`);
        // Для админа используем простые placeholder изображения
        productImages = [
          `https://picsum.photos/400/400?random=${Math.random()}`,
          `https://picsum.photos/400/400?random=${Math.random()}`,
          `https://picsum.photos/400/400?random=${Math.random()}`
        ];
      }

      this.logger.log(`📋 Финальные данные для создания: price=${price ? parseFloat(price) : 0}, images=${productImages.length}, sellerId=${adminUser.id}`);

      const product = await this.prisma.product.create({
        data: {
          ...rest,
          price: price ? parseFloat(price) : 0,
          images: productImages,
          sellerId: adminUser.id, // Используем реальный ID админа
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

      this.logger.log(`✅ Товар создан админом ${adminUser.username} с ${productImages.length} изображениями: ${product.id}`);
      return product;
    } catch (error) {
      this.logger.error(`❌ Ошибка создания товара: ${error.message}`);
      this.logger.error(`❌ Стек ошибки: ${error.stack}`);
      throw error;
    }
  }

  async updateProduct(productId: string, updateProductDto: any) {
    return this.prisma.product.update({
      where: { id: productId },
      data: updateProductDto,
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

  async deleteProduct(productId: string) {
    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  async getDeals() {
    this.logger.log('🤝 Получаем все сделки...');
    
    const deals = await this.prisma.deal.findMany({
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`🤝 Найдено сделок: ${deals.length}`);
    this.logger.log(`🤝 Статусы сделок: ${JSON.stringify(deals.reduce((acc, deal) => { acc[deal.status] = (acc[deal.status] || 0) + 1; return acc; }, {}))}`);
    this.logger.log(`🤝 Первые 3 сделки: ${JSON.stringify(deals.slice(0, 3).map(d => ({ id: d.id, amount: d.amount, status: d.status, buyer: d.buyer.firstName + ' ' + d.buyer.lastName, seller: d.seller.firstName + ' ' + d.seller.lastName, product: d.product.title })))}`);
    
    return deals;
  }

  async updateDealStatus(dealId: string, status: string) {
    this.logger.log(`🤝 Обновляем статус сделки ${dealId} на ${status}`);
    
    try {
      // Валидация статуса
      const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Valid statuses: ${validStatuses.join(', ')}`);
      }

      // Проверяем, существует ли сделка
      const existingDeal = await this.prisma.deal.findUnique({
        where: { id: dealId }
      });

      if (!existingDeal) {
        throw new Error(`Deal with id ${dealId} not found`);
      }

      // Обновляем статус сделки
      const updatedDeal = await this.prisma.deal.update({
        where: { id: dealId },
        data: { 
          status: status as any,
          updatedAt: new Date()
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      });

      this.logger.log(`✅ Статус сделки ${dealId} обновлен на ${status}`);
      return updatedDeal;
    } catch (error) {
      this.logger.error(`❌ Ошибка обновления статуса сделки: ${error.message}`);
      throw error;
    }
  }

  async closeDeal(dealId: string) {
    this.logger.log(`🤝 Закрываем сделку ${dealId}`);
    return this.updateDealStatus(dealId, 'COMPLETED');
  }

  async openDeal(dealId: string) {
    this.logger.log(`🤝 Открываем сделку ${dealId}`);
    return this.updateDealStatus(dealId, 'PENDING');
  }

  async cancelDeal(dealId: string) {
    this.logger.log(`🤝 Отменяем сделку ${dealId}`);
    return this.updateDealStatus(dealId, 'CANCELLED');
  }

  async disputeDeal(dealId: string) {
    this.logger.log(`🤝 Переводим сделку ${dealId} в спор`);
    return this.updateDealStatus(dealId, 'DISPUTED');
  }
}