import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../chat/chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: PrismaService;
  let chatService: ChatService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deal: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    supportTicket: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    chatParticipant: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockChatService = {
    getAdminChat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);
    chatService = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return statistics with correct structure', async () => {
      const mockStats = {
        totalUsers: 100,
        totalProducts: 50,
        totalDeals: 25,
        totalTransactions: 200,
        activeUsers: 80,
        totalRevenue: 10000,
        newMessages: 5,
        usersChange: 10,
        productsChange: 20,
        revenueChange: 15,
        messagesChange: 25,
        dealsChange: 30,
      };

      // Mock all the database calls
      mockPrismaService.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80); // activeUsers
      
      mockPrismaService.product.count.mockResolvedValue(50);
      mockPrismaService.deal.count.mockResolvedValue(25);
      mockPrismaService.transaction.count.mockResolvedValue(200);
      mockPrismaService.supportTicket.count.mockResolvedValue(5);

      mockPrismaService.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } }) // totalRevenue
        .mockResolvedValueOnce({ _sum: { amount: 1500 } }); // revenueLastMonth

      // Mock last month data
      mockPrismaService.user.count.mockResolvedValue(10); // usersLastMonth
      mockPrismaService.product.count.mockResolvedValue(10); // productsLastMonth
      mockPrismaService.supportTicket.count.mockResolvedValue(1); // messagesLastMonth
      mockPrismaService.deal.count.mockResolvedValue(7); // dealsLastMonth

      const result = await service.getStats();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('totalProducts');
      expect(result).toHaveProperty('totalDeals');
      expect(result).toHaveProperty('totalTransactions');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('newMessages');
      expect(result).toHaveProperty('usersChange');
      expect(result).toHaveProperty('productsChange');
      expect(result).toHaveProperty('revenueChange');
      expect(result).toHaveProperty('messagesChange');
      expect(result).toHaveProperty('dealsChange');
    });
  });

  describe('getMessages', () => {
    it('should return messages with user information', async () => {
      const mockMessages = [
        {
          id: '1',
          message: 'Test message',
          status: 'OPEN',
          user: {
            id: 'user1',
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
          },
        },
      ];

      mockPrismaService.supportTicket.findMany.mockResolvedValue(mockMessages);

      const result = await service.getMessages();

      expect(result).toEqual(mockMessages);
      expect(mockPrismaService.supportTicket.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('replyToMessage', () => {
    it('should update support ticket status to IN_PROGRESS, create chat message and notification', async () => {
      const messageId = '1';
      const mockTicket = { 
        id: messageId, 
        status: 'OPEN',
        userId: 'user1',
        subject: 'Test Subject',
        user: {
          id: 'user1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          telegramId: '123456'
        }
      };
      const replyDto = { content: 'Test reply' };
      const mockAdmin = {
        id: 'admin1',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN'
      };
      const mockChat = {
        id: 'chat1',
        name: 'Чат с поддержкой',
        isGroup: false
      };
      const mockChatMessage = {
        id: 'msg1',
        chatId: 'chat1',
        senderId: 'admin1',
        content: 'Test reply',
        type: 'TEXT'
      };

      mockPrismaService.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.user.findFirst.mockResolvedValue(mockAdmin);
      mockPrismaService.supportTicket.update.mockResolvedValue({
        ...mockTicket,
        status: 'IN_PROGRESS',
        assigneeId: 'admin1'
      });
      mockChatService.getAdminChat.mockResolvedValue(mockChat);
      mockPrismaService.chatParticipant.findFirst.mockResolvedValue(null);
      mockPrismaService.chatParticipant.create.mockResolvedValue({});
      mockPrismaService.message.create.mockResolvedValue(mockChatMessage);
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif1',
        userId: 'user1',
        title: 'Ответ от поддержки',
        message: 'Получен ответ на ваше обращение: "Test reply"',
        type: 'INFO'
      });

      const result = await service.replyToMessage(messageId, replyDto);

      expect(mockPrismaService.supportTicket.findUnique).toHaveBeenCalledWith({
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
      expect(mockChatService.getAdminChat).toHaveBeenCalledWith('user1');
      expect(mockPrismaService.chatParticipant.findFirst).toHaveBeenCalledWith({
        where: {
          chatId: 'chat1',
          userId: 'admin1'
        }
      });
      expect(mockPrismaService.chatParticipant.create).toHaveBeenCalledWith({
        data: {
          chatId: 'chat1',
          userId: 'admin1',
          isAdmin: true
        }
      });
      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          chatId: 'chat1',
          senderId: 'admin1',
          type: 'TEXT',
          content: 'Test reply',
          metadata: {
            isFromAdmin: true,
            supportTicketId: messageId,
            adminReply: true,
            originalTicket: {
              id: messageId,
              subject: 'Test Subject'
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
      expect(result.success).toBe(true);
      expect(result.chatMessage).toEqual(mockChatMessage);
      expect(result.chatId).toBe('chat1');
    });

    it('should create admin user if not exists', async () => {
      const messageId = '1';
      const mockTicket = { 
        id: messageId, 
        status: 'OPEN',
        userId: 'user1',
        subject: 'Test Subject',
        user: {
          id: 'user1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          telegramId: '123456'
        }
      };
      const replyDto = { content: 'Test reply' };
      const mockAdmin = {
        id: 'admin1',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN'
      };
      const mockChat = {
        id: 'chat1',
        name: 'Чат с поддержкой',
        isGroup: false
      };

      mockPrismaService.supportTicket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockAdmin);
      mockPrismaService.supportTicket.update.mockResolvedValue({
        ...mockTicket,
        status: 'IN_PROGRESS',
        assigneeId: 'admin1'
      });
      mockChatService.getAdminChat.mockResolvedValue(mockChat);
      mockPrismaService.chatParticipant.findFirst.mockResolvedValue(null);
      mockPrismaService.chatParticipant.create.mockResolvedValue({});
      mockPrismaService.message.create.mockResolvedValue({});
      mockPrismaService.notification.create.mockResolvedValue({});

      await service.replyToMessage(messageId, replyDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
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
    });

    it('should throw error if support ticket not found', async () => {
      const messageId = '1';
      const replyDto = { content: 'Test reply' };

      mockPrismaService.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.replyToMessage(messageId, replyDto)).rejects.toThrow(
        'Support ticket not found',
      );
    });
  });

  describe('getUsers', () => {
    it('should return users with correct fields', async () => {
      const mockUsers = [
        {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
          isActive: true,
          isVerified: true,
          balance: 100,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsers();

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('updateUser', () => {
    it('should update user and return updated data', async () => {
      const userId = '1';
      const updateUserDto = { firstName: 'Updated' };
      const mockUpdatedUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'User',
        role: 'USER',
        isActive: true,
        isVerified: true,
        balance: 100,
        updatedAt: new Date(),
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateUser(userId, updateUserDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
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
    });
  });

  describe('blockUser', () => {
    it('should block user and return updated data', async () => {
      const userId = '1';
      const mockBlockedUser = {
        id: userId,
        username: 'testuser',
        isActive: false,
        updatedAt: new Date(),
      };

      mockPrismaService.user.update.mockResolvedValue(mockBlockedUser);

      const result = await service.blockUser(userId);

      expect(result).toEqual(mockBlockedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: false },
        select: {
          id: true,
          username: true,
          isActive: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('unblockUser', () => {
    it('should unblock user and return updated data', async () => {
      const userId = '1';
      const mockUnblockedUser = {
        id: userId,
        username: 'testuser',
        isActive: true,
        updatedAt: new Date(),
      };

      mockPrismaService.user.update.mockResolvedValue(mockUnblockedUser);

      const result = await service.unblockUser(userId);

      expect(result).toEqual(mockUnblockedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: true },
        select: {
          id: true,
          username: true,
          isActive: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('verifyUser', () => {
    it('should verify user and return updated data', async () => {
      const userId = '1';
      const mockVerifiedUser = {
        id: userId,
        username: 'testuser',
        isVerified: true,
        updatedAt: new Date(),
      };

      mockPrismaService.user.update.mockResolvedValue(mockVerifiedUser);

      const result = await service.verifyUser(userId);

      expect(result).toEqual(mockVerifiedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isVerified: true },
        select: {
          id: true,
          username: true,
          isVerified: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('getProducts', () => {
    it('should return products with seller information', async () => {
      const mockProducts = [
        {
          id: '1',
          title: 'Test Product',
          price: 100,
          seller: {
            id: 'seller1',
            username: 'seller',
            firstName: 'Seller',
            lastName: 'User',
          },
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getProducts();

      expect(result).toEqual(mockProducts);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('createProduct', () => {
    it('should create product with admin as seller', async () => {
      const createProductDto = {
        title: 'Test Product',
        wbArticle: '123456789',
        category: 'Electronics',
        description: 'Test description',
        price: 100,
        brand: 'Test Brand'
      };
      const mockAdmin = {
        id: 'admin1',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN'
      };
      const mockProduct = {
        id: 'product1',
        title: 'Test Product',
        wbArticle: '123456789',
        category: 'Electronics',
        price: 100,
        sellerId: 'admin1',
        seller: {
          id: 'admin1',
          username: 'admin',
          firstName: 'Admin',
          lastName: 'System'
        }
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockAdmin);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.createProduct(createProductDto);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { role: 'ADMIN' }
      });
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Product',
          wbArticle: '123456789',
          category: 'Electronics',
          description: 'Test description',
          brand: 'Test Brand',
          price: 100,
          images: expect.any(Array),
          sellerId: 'admin1'
        },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      expect(result).toEqual(mockProduct);
    });

    it('should create admin user if not exists', async () => {
      const createProductDto = {
        title: 'Test Product',
        wbArticle: '123456789',
        category: 'Electronics',
        price: 100
      };
      const mockAdmin = {
        id: 'admin1',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN'
      };
      const mockProduct = {
        id: 'product1',
        title: 'Test Product',
        sellerId: 'admin1'
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockAdmin);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      await service.createProduct(createProductDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
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
    });

    it('should throw error if required fields are missing', async () => {
      const createProductDto = {
        title: 'Test Product',
        // missing wbArticle and category
        price: 100
      };

      await expect(service.createProduct(createProductDto)).rejects.toThrow('WB Article is required');
    });

    it('should throw error if title is missing', async () => {
      const createProductDto = {
        wbArticle: '123456789',
        category: 'Electronics',
        price: 100
      };

      await expect(service.createProduct(createProductDto)).rejects.toThrow('Title is required');
    });
  });

  describe('updateProduct', () => {
    it('should update product and return updated data', async () => {
      const productId = '1';
      const updateProductDto = { title: 'Updated Product' };
      const mockUpdatedProduct = {
        id: productId,
        title: 'Updated Product',
        price: 100,
        seller: {
          id: 'seller1',
          username: 'seller',
          firstName: 'Seller',
          lastName: 'User',
        },
      };

      mockPrismaService.product.update.mockResolvedValue(mockUpdatedProduct);

      const result = await service.updateProduct(productId, updateProductDto);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
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
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      const productId = '1';
      const mockDeletedProduct = { id: productId, title: 'Deleted Product' };

      mockPrismaService.product.delete.mockResolvedValue(mockDeletedProduct);

      const result = await service.deleteProduct(productId);

      expect(result).toEqual(mockDeletedProduct);
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });
  });

  describe('getDeals', () => {
    it('should return deals with buyer, seller and product information', async () => {
      const mockDeals = [
        {
          id: '1',
          status: 'PENDING',
          buyer: {
            id: 'buyer1',
            username: 'buyer',
            firstName: 'Buyer',
            lastName: 'User',
          },
          seller: {
            id: 'seller1',
            username: 'seller',
            firstName: 'Seller',
            lastName: 'User',
          },
          product: {
            id: 'product1',
            title: 'Test Product',
            price: 100,
          },
        },
      ];

      mockPrismaService.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getDeals();

      expect(result).toEqual(mockDeals);
      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith({
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
    });
  });
});
