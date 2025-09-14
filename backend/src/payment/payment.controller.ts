import { Body, Controller, Get, Logger, Param, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ActionLogger } from '../common/decorators/action-logger.decorator'
import { BusinessLogger } from '../common/decorators/business-logger.decorator'
import { PaymentService } from './payment.service'

@ApiTags('Payment')
@Controller('payment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Create Payment', 'Payment')
  async createPayment(@Request() req, @Body() createPaymentDto: any) {
    this.logger.log(`💳 Creating payment: ${createPaymentDto.amount} ${createPaymentDto.paymentMethod} by user: ${req.user.userId}`);
    return this.paymentService.createPayment(req.user.id, createPaymentDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by id' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Payment Details', 'PaymentController')
  async getPayment(@Request() req, @Param('id') id: string) {
    this.logger.log(`🔍 Getting payment details: ${id} by user: ${req.user.userId}`);
    return this.paymentService.getPayment(req.user.id, id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Confirm Payment', 'Payment')
  async confirmPayment(@Request() req, @Param('id') id: string) {
    this.logger.log(`✅ Confirming payment: ${id} by user: ${req.user.userId}`);
    return this.paymentService.confirmPayment(req.user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @BusinessLogger('Cancel Payment', 'Payment')
  async cancelPayment(@Request() req, @Param('id') id: string) {
    this.logger.log(`❌ Cancelling payment: ${id} by user: ${req.user.userId}`);
    return this.paymentService.cancelPayment(req.user.id, id);
  }
}
