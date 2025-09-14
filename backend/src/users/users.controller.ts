import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
// @UseGuards(JwtAuthGuard) // Временно отключаем
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}


  @Get('profile')
  @Public()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Profile', 'UsersController')
  async getProfile(@Request() req) {
    this.logger.log(`👤 Profile request from user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.findOne(req.user.id);
  }

  @Put('profile')
  @Public()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Update Profile', 'User')
  async updateProfile(@Request() req, @Body() updateProfileDto: any) {
    this.logger.log(`✏️ Updating profile for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('payments')
  @Public()
  @ApiOperation({ summary: 'Get user payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  @ActionLogger('Get Payment Methods', 'UsersController')
  async getPayments(@Request() req) {
    this.logger.log(`💳 Getting payment methods for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.getPaymentMethods(req.user.id);
  }

  @Post('payments')
  @Public()
  @ApiOperation({ summary: 'Add payment method' })
  @ApiResponse({ status: 201, description: 'Payment method added successfully' })
  @BusinessLogger('Add Payment Method', 'Payment')
  async addPaymentMethod(@Request() req, @Body() paymentDto: any) {
    this.logger.log(`💳 Adding payment method for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.addPaymentMethod(req.user.id, paymentDto);
  }

  @Delete('payments/:id')
  @Public()
  @ApiOperation({ summary: 'Remove payment method' })
  @ApiResponse({ status: 200, description: 'Payment method removed successfully' })
  @BusinessLogger('Remove Payment Method', 'Payment')
  async removePaymentMethod(@Request() req, @Param('id') paymentId: string) {
    this.logger.log(`💳 Removing payment method ${paymentId} for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.removePaymentMethod(req.user.id, paymentId);
  }

  @Get('social')
  @Public()
  @ApiOperation({ summary: 'Get user social links' })
  @ApiResponse({ status: 200, description: 'Social links retrieved successfully' })
  @ActionLogger('Get Social Links', 'UsersController')
  async getSocialLinks(@Request() req) {
    this.logger.log(`🔗 Getting social links for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.getSocialLinks(req.user.id);
  }

  @Post('social')
  @Public()
  @ApiOperation({ summary: 'Add social link' })
  @ApiResponse({ status: 201, description: 'Social link added successfully' })
  @BusinessLogger('Add Social Link', 'Social')
  async addSocialLink(@Request() req, @Body() socialDto: any) {
    this.logger.log(`🔗 Adding social link for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.addSocialLink(req.user.id, socialDto);
  }

  @Delete('social/:id')
  @Public()
  @ApiOperation({ summary: 'Remove social link' })
  @ApiResponse({ status: 200, description: 'Social link removed successfully' })
  @BusinessLogger('Remove Social Link', 'Social')
  async removeSocialLink(@Request() req, @Param('id') linkId: string) {
    this.logger.log(`🔗 Removing social link ${linkId} for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.removeSocialLink(req.user.id, linkId);
  }

  @Get('verification')
  @Public()
  @ApiOperation({ summary: 'Get verification status' })
  @ApiResponse({ status: 200, description: 'Verification status retrieved successfully' })
  @ActionLogger('Get Verification Status', 'UsersController')
  async getVerificationStatus(@Request() req) {
    this.logger.log(`✅ Getting verification status for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.getVerificationStatus(req.user.id);
  }

  @Post('verification')
  @Public()
  @ApiOperation({ summary: 'Submit verification documents' })
  @ApiResponse({ status: 201, description: 'Verification documents submitted successfully' })
  @BusinessLogger('Submit Verification', 'Verification')
  async submitVerification(@Request() req, @Body() verificationDto: any) {
    this.logger.log(`✅ Submitting verification for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.submitVerification(req.user.id, verificationDto);
  }

  @Get('test-notifications')
  @Public()
  @ApiOperation({ summary: 'Test notifications endpoint' })
  async testNotifications(@Request() req) {
    console.log('🧪 Test notifications endpoint called');
    
    try {
      // Получаем первого пользователя из БД
      const testUser = await this.usersService.findFirst();
      if (testUser) {
        console.log('✅ Found test user:', testUser.username);
        const notifications = await this.usersService.getNotifications(testUser.id);
        console.log('📊 Notifications found:', notifications.length);
        return { 
          success: true, 
          data: notifications, 
          user: testUser.username,
          count: notifications.length 
        };
      }
      return { 
        success: false, 
        message: 'No users found', 
        data: [] 
      };
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return { 
        success: false, 
        message: 'Error getting notifications', 
        error: error.message,
        data: []
      };
    }
  }

  @Get('notifications')
  @Public()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(@Request() req, @Query('limit') limit?: string) {
    console.log('🔔 Getting notifications endpoint called');
    
    try {
      // Получаем первого пользователя из БД
      const testUser = await this.usersService.findFirst();
      if (testUser) {
        console.log('✅ Found test user:', testUser.username);
        const limitNum = limit ? parseInt(limit) : 50;
        const notifications = await this.usersService.getNotifications(testUser.id, limitNum);
        console.log('📊 Notifications found:', notifications.length);
        return { 
          success: true, 
          data: notifications, 
          user: testUser.username,
          count: notifications.length 
        };
      }
      console.log('❌ No users found');
      return { 
        success: false, 
        message: 'No users found', 
        data: [] 
      };
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return { 
        success: false, 
        message: 'Error getting notifications', 
        error: error.message,
        data: []
      };
    }
  }

  @Get('notification-settings')
  @Public()
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved successfully' })
  @ActionLogger('Get Notification Settings', 'UsersController')
  async getNotificationSettings(@Request() req) {
    this.logger.log(`🔔 Getting notification settings for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.getNotificationSettings(req.user.id);
  }

  @Put('notifications')
  @Public()
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated successfully' })
  @BusinessLogger('Update Notification Settings', 'Notification')
  async updateNotificationSettings(@Request() req, @Body() settingsDto: any) {
    this.logger.log(`🔔 Updating notification settings for user: ${req.user?.id}`);
    if (!req.user) {
      return { message: 'Not authenticated' };
    }
    return this.usersService.updateNotificationSettings(req.user.id, settingsDto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions() {
    this.logger.log(`💰 Getting transactions for testing`);
    
    try {
      // Для тестирования используем первого пользователя из БД
      const firstUser = await this.usersService.findFirst();
      if (firstUser) {
        const transactions = await this.usersService.getTransactions(firstUser.id);
        return { data: transactions, message: 'Success' };
      }
      return { message: 'No users found', data: [] };
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { message: 'Error getting transactions', error: error.message };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ActionLogger('Get User by ID', 'UsersController')
  findOne(@Param('id') id: string) {
    this.logger.log(`👤 Getting user by ID: ${id}`);
    return this.usersService.findOne(id);
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @BusinessLogger('Delete User', 'User')
  remove(@Param('id') id: string) {
    this.logger.log(`🗑️ Deleting user: ${id}`);
    return this.usersService.remove(id);
  }

  // Новые ручки согласно требованиям
  @Get('referrals')
  @ApiOperation({ summary: 'Get user referrals' })
  @ApiResponse({ status: 200, description: 'Referrals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Referrals', 'UsersController')
  async getReferrals(@Request() req) {
    this.logger.log(`🤝 Getting referrals for user: ${req.user.id}`);
    return this.usersService.getReferrals(req.user.id);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Balance', 'UsersController')
  async getBalance(@Request() req) {
    this.logger.log(`💰 Getting balance for user: ${req.user.id}`);
    return this.usersService.getBalance(req.user.id);
  }


  @Put('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ActionLogger('Mark Notification as Read', 'UsersController')
  async markNotificationAsRead(@Request() req, @Param('id') notificationId: string) {
    this.logger.log(`✅ Marking notification ${notificationId} as read for user: ${req.user.id}`);
    return this.usersService.markNotificationAsRead(req.user.id, notificationId);
  }

  @Put('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Mark All Notifications as Read', 'UsersController')
  async markAllNotificationsAsRead(@Request() req) {
    this.logger.log(`✅ Marking all notifications as read for user: ${req.user.id}`);
    return this.usersService.markAllNotificationsAsRead(req.user.id);
  }
}


