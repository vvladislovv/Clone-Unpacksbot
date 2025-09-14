import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Logger, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
// @UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ActionLogger('Get Admin Statistics', 'AdminController')
  async getStats() {
    this.logger.log(`📊 Getting admin statistics`);
    return this.adminService.getStats();
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get admin messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ActionLogger('Get Admin Messages', 'AdminController')
  async getMessages() {
    this.logger.log(`💬 Getting admin messages`);
    return this.adminService.getMessages();
  }

  @Post('messages/:id/reply')
  @ApiOperation({ summary: 'Reply to message' })
  @ApiResponse({ status: 200, description: 'Reply sent successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Reply to Message', 'Message')
  async replyToMessage(@Param('id') messageId: string, @Body() replyDto: any) {
    this.logger.log(`💬 Replying to message: ${messageId}`);
    return this.adminService.replyToMessage(messageId, replyDto);
  }

  @Get('chat-messages')
  @ApiOperation({ summary: 'Get chat messages for admin' })
  @ApiResponse({ status: 200, description: 'Chat messages retrieved successfully' })
  @ActionLogger('Get Chat Messages', 'AdminController')
  async getChatMessages() {
    this.logger.log(`💬 Getting chat messages for admin`);
    return this.adminService.getChatMessages();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users for admin' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ActionLogger('Get All Users (Admin)', 'AdminController')
  async getUsers() {
    this.logger.log(`👥 Getting all users for admin`);
    return this.adminService.getUsers();
  }

  @Post('users')
  @ApiOperation({ summary: 'Create user by admin' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  @BusinessLogger('Create User (Admin)', 'User')
  async createUser(@Body() createUserDto: any) {
    this.logger.log(`👤 Creating user by admin: ${createUserDto.firstName} ${createUserDto.lastName}`);
    try {
      return await this.adminService.createUser(createUserDto);
    } catch (error) {
      this.logger.error(`❌ Error creating user: ${error.message}`);
      this.logger.error(`❌ Error details:`, error);
      
      // Возвращаем правильные HTTP исключения
      if (error.message.includes('уже существует') || error.message.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      
      // Обрабатываем ошибки Prisma
      if (error.code === 'P2002' || error.name === 'PrismaClientKnownRequestError') {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      
      // Обрабатываем ошибки валидации
      if (error.message.includes('required') || error.message.includes('обязательно')) {
        throw new BadRequestException(error.message);
      }
      
      throw error;
    }
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user by admin' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  @BusinessLogger('Update User (Admin)', 'User')
  async updateUser(@Param('id') userId: string, @Body() updateUserDto: any) {
    this.logger.log(`✏️ Updating user: ${userId} by admin`);
    try {
      return await this.adminService.updateUser(userId, updateUserDto);
    } catch (error) {
      this.logger.error(`❌ Error updating user: ${error.message}`);
      this.logger.error(`❌ Error details:`, error);
      
      // Возвращаем правильные HTTP исключения
      if (error.message.includes('уже существует') || error.message.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      
      if (error.message.includes('не найден') || error.message.includes('not found')) {
        throw new BadRequestException(error.message);
      }
      
      // Обрабатываем ошибки Prisma
      if (error.code === 'P2002' || error.name === 'PrismaClientKnownRequestError') {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      
      // Обрабатываем ошибки валидации
      if (error.message.includes('required') || error.message.includes('обязательно')) {
        throw new BadRequestException(error.message);
      }
      
      throw error;
    }
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Block user' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Block User', 'User')
  async blockUser(@Param('id') userId: string, @Body() blockDto: { reason: string }) {
    this.logger.log(`🚫 Blocking user: ${userId}, reason: ${blockDto.reason}`);
    return this.adminService.blockUser(userId, blockDto.reason);
  }

  @Post('users/:id/unblock')
  @ApiOperation({ summary: 'Unblock user' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Unblock User', 'User')
  async unblockUser(@Param('id') userId: string) {
    this.logger.log(`✅ Unblocking user: ${userId}`);
    return this.adminService.unblockUser(userId);
  }

  @Post('users/:id/verify')
  @ApiOperation({ summary: 'Verify user' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Verify User', 'User')
  async verifyUser(@Param('id') userId: string) {
    this.logger.log(`✅ Verifying user: ${userId}`);
    return this.adminService.verifyUser(userId);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products for admin' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ActionLogger('Get All Products (Admin)', 'AdminController')
  async getProducts() {
    this.logger.log(`📦 Getting all products for admin`);
    return this.adminService.getProducts();
  }

  @Post('products')
  @ApiOperation({ summary: 'Create product by admin' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Create Product (Admin)', 'Product')
  async createProduct(@Body() createProductDto: any) {
    this.logger.log(`📦 Creating product by admin: ${createProductDto.title}`);
    return this.adminService.createProduct(createProductDto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product by admin' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Update Product (Admin)', 'Product')
  async updateProduct(@Param('id') productId: string, @Body() updateProductDto: any) {
    this.logger.log(`✏️ Updating product: ${productId} by admin`);
    return this.adminService.updateProduct(productId, updateProductDto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product by admin' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Delete Product (Admin)', 'Product')
  async deleteProduct(@Param('id') productId: string) {
    this.logger.log(`🗑️ Deleting product: ${productId} by admin`);
    return this.adminService.deleteProduct(productId);
  }

  @Get('deals')
  @ApiOperation({ summary: 'Get all deals for admin' })
  @ApiResponse({ status: 200, description: 'Deals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ActionLogger('Get All Deals (Admin)', 'AdminController')
  async getDeals() {
    this.logger.log(`🤝 Getting all deals for admin`);
    return this.adminService.getDeals();
  }

  @Put('deals/:id/status')
  @ApiOperation({ summary: 'Update deal status' })
  @ApiResponse({ status: 200, description: 'Deal status updated successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Update Deal Status', 'Deal')
  async updateDealStatus(@Param('id') dealId: string, @Body() body: { status: string }) {
    this.logger.log(`🤝 Updating deal status: ${dealId} to ${body.status}`);
    return this.adminService.updateDealStatus(dealId, body.status);
  }

  @Post('deals/:id/close')
  @ApiOperation({ summary: 'Close deal' })
  @ApiResponse({ status: 200, description: 'Deal closed successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Close Deal', 'Deal')
  async closeDeal(@Param('id') dealId: string) {
    this.logger.log(`🤝 Closing deal: ${dealId}`);
    return this.adminService.closeDeal(dealId);
  }

  @Post('deals/:id/open')
  @ApiOperation({ summary: 'Open deal' })
  @ApiResponse({ status: 200, description: 'Deal opened successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Open Deal', 'Deal')
  async openDeal(@Param('id') dealId: string) {
    this.logger.log(`🤝 Opening deal: ${dealId}`);
    return this.adminService.openDeal(dealId);
  }

  @Post('deals/:id/cancel')
  @ApiOperation({ summary: 'Cancel deal' })
  @ApiResponse({ status: 200, description: 'Deal cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Cancel Deal', 'Deal')
  async cancelDeal(@Param('id') dealId: string) {
    this.logger.log(`🤝 Cancelling deal: ${dealId}`);
    return this.adminService.cancelDeal(dealId);
  }

  @Post('deals/:id/dispute')
  @ApiOperation({ summary: 'Dispute deal' })
  @ApiResponse({ status: 200, description: 'Deal disputed successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Dispute Deal', 'Deal')
  async disputeDeal(@Param('id') dealId: string) {
    this.logger.log(`🤝 Disputing deal: ${dealId}`);
    return this.adminService.disputeDeal(dealId);
  }
}
