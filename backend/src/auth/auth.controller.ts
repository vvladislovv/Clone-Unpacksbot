import { Body, Controller, Get, Logger, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActionLogger } from '../common/decorators/action-logger.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ActionLogger('User Registration', 'AuthController')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`📝 New user registration attempt: ${registerDto.email || registerDto.username}`);
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ActionLogger('User Login', 'AuthController')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`🔐 Login attempt: ${loginDto.identifier}`);
    return this.authService.login(loginDto);
  }

  @Post('telegram')
  @ApiOperation({ summary: 'Login or register via Telegram' })
  @ApiResponse({ status: 200, description: 'Telegram authentication successful' })
  @ApiResponse({ status: 401, description: 'User not found' })
  @ActionLogger('Telegram Login', 'AuthController')
  async telegramLogin(@Body() telegramLoginDto: TelegramLoginDto) {
    this.logger.log(`📱 Telegram login attempt: ${telegramLoginDto.telegramId}`);
    return this.authService.telegramLogin(telegramLoginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('Get Profile', 'AuthController')
  async getProfile(@Request() req) {
    this.logger.log(`👤 Profile request from user: ${req.user?.userId}`);
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ActionLogger('User Logout', 'AuthController')
  async logout(@Request() req) {
    this.logger.log(`🚪 Logout request from user: ${req.user?.userId}`);
    // In a real implementation, you'd add the token to a blacklist in Redis
    return { message: 'Logged out successfully' };
  }
}

