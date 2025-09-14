import { Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ActionLogger } from '../common/decorators/action-logger.decorator'
import { BusinessLogger } from '../common/decorators/business-logger.decorator'
import { TransactionsService } from './transactions.service'

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);
  constructor(private readonly transactionsService: TransactionsService) {}



  @Post('withdrawal')
  @ApiOperation({ summary: 'Request withdrawal' })
  @ApiResponse({ status: 201, description: 'Withdrawal request created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Request Withdrawal', 'Transaction')
  async requestWithdrawal(@Request() req, @Body() withdrawalDto: any) {
    this.logger.log(`💸 Withdrawal request: ${withdrawalDto.amount} by user: ${req.user.userId}`);
    return this.transactionsService.requestWithdrawal(req.user.id, withdrawalDto);
  }


  @Get()
  @ApiOperation({ 
    summary: 'Get transactions',
    description: 'Получить транзакции пользователя с фильтрацией'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transactions retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Transactions', 'TransactionsController')
  async getTransactions(@Request() req, @Query() query: any) {
    this.logger.log(`💰 Getting transactions for user: ${req.user.userId}`);
    return this.transactionsService.getTransactions(req.user.id, query);
  }

  @Get('all-data')
  @ApiOperation({ 
    summary: 'Get complete transaction data',
    description: 'Получить полную информацию о транзакциях пользователя: все транзакции, статистика, баланс'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Complete transaction data retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Complete Transaction Data', 'TransactionsController')
  async getAllTransactionData(@Request() req) {
    this.logger.log(`💰 Getting complete transaction data for user: ${req.user.userId}`);
    return this.transactionsService.getCompleteTransactionData(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get transaction statistics',
    description: 'Получить статистику транзакций'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction statistics retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Transaction Statistics', 'TransactionsController')
  async getStats(@Request() req, @Query() query: any) {
    this.logger.log(`📊 Getting transaction stats for user: ${req.user.userId}`);
    return this.transactionsService.getStats(req.user.id, query);
  }

  // ========== МЕТОДЫ ДЛЯ ПЛАТЕЖЕЙ ==========

  @Post('payment/create')
  @ApiOperation({ summary: 'Create payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Create Payment', 'Transaction')
  async createPayment(@Request() req, @Body() createPaymentDto: any) {
    this.logger.log(`💳 Creating payment: ${createPaymentDto.amount} ${createPaymentDto.paymentMethod} by user: ${req.user.userId}`);
    return this.transactionsService.createPayment(req.user.id, createPaymentDto);
  }

  @Get('payment/:id')
  @ApiOperation({ summary: 'Get payment by id' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Payment Details', 'TransactionsController')
  async getPayment(@Request() req, @Param('id') id: string) {
    this.logger.log(`🔍 Getting payment details: ${id} by user: ${req.user.userId}`);
    return this.transactionsService.getPayment(req.user.id, id);
  }

  @Post('payment/:id/confirm')
  @ApiOperation({ summary: 'Confirm payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Confirm Payment', 'Transaction')
  async confirmPayment(@Request() req, @Param('id') id: string) {
    this.logger.log(`✅ Confirming payment: ${id} by user: ${req.user.userId}`);
    return this.transactionsService.confirmPayment(req.user.id, id);
  }

  @Post('payment/:id/cancel')
  @ApiOperation({ summary: 'Cancel payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Cancel Payment', 'Transaction')
  async cancelPayment(@Request() req, @Param('id') id: string) {
    this.logger.log(`❌ Cancelling payment: ${id} by user: ${req.user.userId}`);
    return this.transactionsService.cancelPayment(req.user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel transaction' })
  @ApiResponse({ status: 200, description: 'Transaction cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Cancel Transaction', 'Transaction')
  async cancelTransaction(@Request() req, @Param('id') id: string) {
    this.logger.log(`❌ Cancelling transaction: ${id} by user: ${req.user.userId}`);
    return this.transactionsService.cancelTransaction(req.user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by id' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ActionLogger('Get Transaction Details', 'TransactionsController')
  findOne(@Param('id') id: string) {
    this.logger.log(`🔍 Getting transaction details: ${id}`);
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  @BusinessLogger('Update Transaction', 'Transaction')
  update(@Param('id') id: string, @Body() updateTransactionDto: any) {
    this.logger.log(`✏️ Updating transaction: ${id}`);
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
  @BusinessLogger('Delete Transaction', 'Transaction')
  remove(@Param('id') id: string) {
    this.logger.log(`🗑️ Deleting transaction: ${id}`);
    return this.transactionsService.remove(id);
  }
}
