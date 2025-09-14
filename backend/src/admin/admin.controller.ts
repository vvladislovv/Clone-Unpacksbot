import { Body, Controller, Delete, Get, Logger, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Public()
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
  @Public()
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

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user by admin' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Update User (Admin)', 'User')
  async updateUser(@Param('id') userId: string, @Body() updateUserDto: any) {
    this.logger.log(`✏️ Updating user: ${userId} by admin`);
    return this.adminService.updateUser(userId, updateUserDto);
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Block user' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @BusinessLogger('Block User', 'User')
  async blockUser(@Param('id') userId: string) {
    this.logger.log(`🚫 Blocking user: ${userId}`);
    return this.adminService.blockUser(userId);
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
}
