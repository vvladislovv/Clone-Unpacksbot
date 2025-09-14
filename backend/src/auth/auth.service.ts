import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TelegramLoginDto } from './dto/telegram-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, phone, telegramId, password, firstName, lastName, role, referralCode } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          username ? { username } : {},
          phone ? { phone } : {},
          telegramId ? { telegramId } : {},
        ].filter(condition => Object.keys(condition).length > 0),
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email, username, phone, or Telegram ID already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Handle referral
    let referredById = null;
    if (referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        phone,
        telegramId,
        firstName,
        lastName,
        passwordHash,
        role: role as UserRole,
        referredById,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        referralCode: true,
        balance: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = this.jwtService.sign({ 
      userId: user.id, 
      role: user.role 
    });

    // Send referral notification if applicable
    if (referredById) {
      await this.prisma.notification.create({
        data: {
          userId: referredById,
          title: 'New Referral!',
          message: `${user.firstName} joined using your referral code!`,
          type: 'SUCCESS',
        },
      });
    }

    return { user, token };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    // Find user by email, username, or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { phone: identifier },
        ],
        isActive: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = this.jwtService.sign({ 
      userId: user.id, 
      role: user.role 
    });

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      balance: user.balance,
      isVerified: user.isVerified,
    };

    return { user: userResponse, token };
  }

  async telegramLogin(telegramLoginDto: TelegramLoginDto) {
    const { telegramId, firstName, lastName, username, photoUrl, skipRegistration, role, referralCode } = telegramLoginDto;

    // Find existing user
    let user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      // If skipRegistration is true, throw error
      if (skipRegistration) {
        throw new UnauthorizedException('User not registered');
      }

      // Handle referral
      let referredById = null;
      if (referralCode) {
        const referrer = await this.prisma.user.findUnique({
          where: { referralCode },
        });
        if (referrer) {
          referredById = referrer.id;
        }
      }

      // Register new user via Telegram
      user = await this.prisma.user.create({
        data: {
          telegramId,
          username,
          firstName,
          lastName,
          avatar: photoUrl,
          role: role as UserRole || UserRole.SELLER,
          isVerified: true, // Telegram users are pre-verified
          referredById,
        },
      });

      // Send referral notification if applicable
      if (referredById) {
        await this.prisma.notification.create({
          data: {
            userId: referredById,
            title: 'New Referral!',
            message: `${user.firstName} joined using your referral code!`,
            type: 'SUCCESS',
          },
        });
      }
    } else {
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Generate JWT token
    const token = this.jwtService.sign({ 
      userId: user.id, 
      role: user.role 
    });

    const userResponse = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      balance: user.balance,
      isVerified: user.isVerified,
    };

    return { user: userResponse, token };
  }

  async validateUser(userId: string) {
    console.log('🔍 AuthService validateUser called with userId:', userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        balance: true,
        referralCode: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    console.log('🔍 User found in validateUser:', user ? 'Yes' : 'No');
    if (!user) {
      console.log('❌ User not found, throwing UnauthorizedException');
      throw new UnauthorizedException('User not found');
    }

    console.log('✅ User validated successfully:', user.username);
    return user;
  }
}

