import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { BusinessLogger } from '../common/decorators/business-logger.decorator';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(private readonly chatService: ChatService) {}

  @Get('chats')
  @Public()
  @ApiOperation({ summary: 'Get user chats' })
  @ApiResponse({ status: 200, description: 'Chats retrieved successfully' })
  @ActionLogger('Get User Chats', 'ChatController')
  async getChats(@Request() req) {
    this.logger.log(`💬 Getting chats for user: ${req.user?.userId || 'anonymous'}`);
    // Получаем первого пользователя для демонстрации
    const user = await this.chatService.getFirstUser();
    return this.chatService.getUserChats(user.id);
  }

  @Get('admin-chat')
  @Public()
  @ApiOperation({ summary: 'Get admin chat for user' })
  @ApiResponse({ status: 200, description: 'Admin chat retrieved successfully' })
  @ActionLogger('Get Admin Chat', 'ChatController')
  async getAdminChat(@Request() req) {
    this.logger.log(`💬 Getting admin chat for user: ${req.user?.userId || 'anonymous'}`);
    // Получаем первого пользователя для демонстрации
    const user = await this.chatService.getFirstUser();
    return this.chatService.getAdminChat(user.id);
  }

  @Post('admin-chat/message')
  @Public()
  @ApiOperation({ summary: 'Send message to admin chat' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @BusinessLogger('Send Message to Admin', 'Message')
  async sendMessageToAdmin(@Request() req, @Body() messageDto: any) {
    this.logger.log(`💬 Sending message to admin: ${messageDto.content}`);
    // Получаем первого пользователя для демонстрации
    const user = await this.chatService.getFirstUser();
    return this.chatService.sendMessageToAdmin(user.id, messageDto.content);
  }

  @Post('chats')
  @ApiOperation({ summary: 'Create chat' })
  @ApiResponse({ status: 201, description: 'Chat created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Create Chat', 'Chat')
  async createChat(@Request() req, @Body() createChatDto: any) {
    this.logger.log(`💬 Creating chat: ${createChatDto.name} by user: ${req.user.userId}`);
    return this.chatService.createChat(req.user.id, createChatDto);
  }

  @Get('chats/:id/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ActionLogger('Get Chat Messages', 'ChatController')
  async getChatMessages(@Request() req, @Param('id') chatId: string) {
    this.logger.log(`💬 Getting messages for chat: ${chatId} by user: ${req.user.userId}`);
    return this.chatService.getChatMessages(req.user.id, chatId);
  }

  @Post('chats/:id/messages')
  @ApiOperation({ summary: 'Send message to chat' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @BusinessLogger('Send Message', 'Message')
  async sendMessage(@Request() req, @Param('id') chatId: string, @Body() messageDto: any) {
    this.logger.log(`💬 Sending message to chat: ${chatId} by user: ${req.user.userId}`);
    return this.chatService.sendMessage(req.user.id, chatId, messageDto);
  }

  @Put('messages/:id')
  @ApiOperation({ summary: 'Edit message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @BusinessLogger('Edit Message', 'Message')
  async editMessage(@Request() req, @Param('id') messageId: string, @Body() updateMessageDto: any) {
    this.logger.log(`✏️ Editing message: ${messageId} by user: ${req.user.userId}`);
    return this.chatService.editMessage(req.user.id, messageId, updateMessageDto);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @BusinessLogger('Delete Message', 'Message')
  async deleteMessage(@Request() req, @Param('id') messageId: string) {
    this.logger.log(`🗑️ Deleting message: ${messageId} by user: ${req.user.userId}`);
    return this.chatService.deleteMessage(req.user.id, messageId);
  }

}


