import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getStats: jest.fn(),
    getMessages: jest.fn(),
    replyToMessage: jest.fn(),
    getUsers: jest.fn(),
    updateUser: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    verifyUser: jest.fn(),
    getProducts: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    getDeals: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return admin statistics', async () => {
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

      mockAdminService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(mockAdminService.getStats).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return admin messages', async () => {
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

      mockAdminService.getMessages.mockResolvedValue(mockMessages);

      const result = await controller.getMessages();

      expect(result).toEqual(mockMessages);
      expect(mockAdminService.getMessages).toHaveBeenCalled();
    });
  });

  describe('replyToMessage', () => {
    it('should reply to message', async () => {
      const messageId = '1';
      const replyDto = { reply: 'Test reply' };
      const mockReply = {
        id: messageId,
        status: 'IN_PROGRESS',
        reply: 'Test reply',
      };

      mockAdminService.replyToMessage.mockResolvedValue(mockReply);

      const result = await controller.replyToMessage(messageId, replyDto);

      expect(result).toEqual(mockReply);
      expect(mockAdminService.replyToMessage).toHaveBeenCalledWith(messageId, replyDto);
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
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

      mockAdminService.getUsers.mockResolvedValue(mockUsers);

      const result = await controller.getUsers();

      expect(result).toEqual(mockUsers);
      expect(mockAdminService.getUsers).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
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

      mockAdminService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockAdminService.updateUser).toHaveBeenCalledWith(userId, updateUserDto);
    });
  });

  describe('blockUser', () => {
    it('should block user', async () => {
      const userId = '1';
      const mockBlockedUser = {
        id: userId,
        username: 'testuser',
        isActive: false,
        updatedAt: new Date(),
      };

      mockAdminService.blockUser.mockResolvedValue(mockBlockedUser);

      const result = await controller.blockUser(userId);

      expect(result).toEqual(mockBlockedUser);
      expect(mockAdminService.blockUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('unblockUser', () => {
    it('should unblock user', async () => {
      const userId = '1';
      const mockUnblockedUser = {
        id: userId,
        username: 'testuser',
        isActive: true,
        updatedAt: new Date(),
      };

      mockAdminService.unblockUser.mockResolvedValue(mockUnblockedUser);

      const result = await controller.unblockUser(userId);

      expect(result).toEqual(mockUnblockedUser);
      expect(mockAdminService.unblockUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('verifyUser', () => {
    it('should verify user', async () => {
      const userId = '1';
      const mockVerifiedUser = {
        id: userId,
        username: 'testuser',
        isVerified: true,
        updatedAt: new Date(),
      };

      mockAdminService.verifyUser.mockResolvedValue(mockVerifiedUser);

      const result = await controller.verifyUser(userId);

      expect(result).toEqual(mockVerifiedUser);
      expect(mockAdminService.verifyUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
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

      mockAdminService.getProducts.mockResolvedValue(mockProducts);

      const result = await controller.getProducts();

      expect(result).toEqual(mockProducts);
      expect(mockAdminService.getProducts).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update product', async () => {
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

      mockAdminService.updateProduct.mockResolvedValue(mockUpdatedProduct);

      const result = await controller.updateProduct(productId, updateProductDto);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockAdminService.updateProduct).toHaveBeenCalledWith(productId, updateProductDto);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      const productId = '1';
      const mockDeletedProduct = { id: productId, title: 'Deleted Product' };

      mockAdminService.deleteProduct.mockResolvedValue(mockDeletedProduct);

      const result = await controller.deleteProduct(productId);

      expect(result).toEqual(mockDeletedProduct);
      expect(mockAdminService.deleteProduct).toHaveBeenCalledWith(productId);
    });
  });

  describe('getDeals', () => {
    it('should return all deals', async () => {
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

      mockAdminService.getDeals.mockResolvedValue(mockDeals);

      const result = await controller.getDeals();

      expect(result).toEqual(mockDeals);
      expect(mockAdminService.getDeals).toHaveBeenCalled();
    });
  });
});
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getStats: jest.fn(),
    getMessages: jest.fn(),
    replyToMessage: jest.fn(),
    getUsers: jest.fn(),
    updateUser: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    verifyUser: jest.fn(),
    getProducts: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    getDeals: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return admin statistics', async () => {
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

      mockAdminService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(mockAdminService.getStats).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return admin messages', async () => {
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

      mockAdminService.getMessages.mockResolvedValue(mockMessages);

      const result = await controller.getMessages();

      expect(result).toEqual(mockMessages);
      expect(mockAdminService.getMessages).toHaveBeenCalled();
    });
  });

  describe('replyToMessage', () => {
    it('should reply to message', async () => {
      const messageId = '1';
      const replyDto = { reply: 'Test reply' };
      const mockReply = {
        id: messageId,
        status: 'IN_PROGRESS',
        reply: 'Test reply',
      };

      mockAdminService.replyToMessage.mockResolvedValue(mockReply);

      const result = await controller.replyToMessage(messageId, replyDto);

      expect(result).toEqual(mockReply);
      expect(mockAdminService.replyToMessage).toHaveBeenCalledWith(messageId, replyDto);
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
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

      mockAdminService.getUsers.mockResolvedValue(mockUsers);

      const result = await controller.getUsers();

      expect(result).toEqual(mockUsers);
      expect(mockAdminService.getUsers).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
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

      mockAdminService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUser(userId, updateUserDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockAdminService.updateUser).toHaveBeenCalledWith(userId, updateUserDto);
    });
  });

  describe('blockUser', () => {
    it('should block user', async () => {
      const userId = '1';
      const mockBlockedUser = {
        id: userId,
        username: 'testuser',
        isActive: false,
        updatedAt: new Date(),
      };

      mockAdminService.blockUser.mockResolvedValue(mockBlockedUser);

      const result = await controller.blockUser(userId);

      expect(result).toEqual(mockBlockedUser);
      expect(mockAdminService.blockUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('unblockUser', () => {
    it('should unblock user', async () => {
      const userId = '1';
      const mockUnblockedUser = {
        id: userId,
        username: 'testuser',
        isActive: true,
        updatedAt: new Date(),
      };

      mockAdminService.unblockUser.mockResolvedValue(mockUnblockedUser);

      const result = await controller.unblockUser(userId);

      expect(result).toEqual(mockUnblockedUser);
      expect(mockAdminService.unblockUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('verifyUser', () => {
    it('should verify user', async () => {
      const userId = '1';
      const mockVerifiedUser = {
        id: userId,
        username: 'testuser',
        isVerified: true,
        updatedAt: new Date(),
      };

      mockAdminService.verifyUser.mockResolvedValue(mockVerifiedUser);

      const result = await controller.verifyUser(userId);

      expect(result).toEqual(mockVerifiedUser);
      expect(mockAdminService.verifyUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
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

      mockAdminService.getProducts.mockResolvedValue(mockProducts);

      const result = await controller.getProducts();

      expect(result).toEqual(mockProducts);
      expect(mockAdminService.getProducts).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update product', async () => {
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

      mockAdminService.updateProduct.mockResolvedValue(mockUpdatedProduct);

      const result = await controller.updateProduct(productId, updateProductDto);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockAdminService.updateProduct).toHaveBeenCalledWith(productId, updateProductDto);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      const productId = '1';
      const mockDeletedProduct = { id: productId, title: 'Deleted Product' };

      mockAdminService.deleteProduct.mockResolvedValue(mockDeletedProduct);

      const result = await controller.deleteProduct(productId);

      expect(result).toEqual(mockDeletedProduct);
      expect(mockAdminService.deleteProduct).toHaveBeenCalledWith(productId);
    });
  });

  describe('getDeals', () => {
    it('should return all deals', async () => {
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

      mockAdminService.getDeals.mockResolvedValue(mockDeals);

      const result = await controller.getDeals();

      expect(result).toEqual(mockDeals);
      expect(mockAdminService.getDeals).toHaveBeenCalled();
    });
  });
});
