import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from './guards/role.guard';
import { AffiliateService } from '../affiliate/affiliate.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly affiliateService: AffiliateService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // create user
    const newUser = await this.userService.create(createUserDto);

    // ensure newUser exists and has result/_id
    const userId = newUser?.result?._id ? String(newUser.result._id) : (newUser?.result?.id ? String(newUser.result.id) : null);
    if (!userId) return newUser; // creation failed, return as-is

    // if front-end submitted referralCode in DTO, try to join affiliate
    if ((createUserDto as any).referralCode) {
      try {
        await this.affiliateService.join(userId, (createUserDto as any).referralCode);
      } catch (e) {
        // non-fatal — we still return user creation success; optionally log
        // You can return error to client if you prefer strict behavior
        // For now we ignore affiliate join failure
      }
    }

    return newUser;
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return await this.authService.login(body.email, body.password);
  }

  @Post('generate-otp/:userId')
  @UseGuards(AuthGuard('jwt'))
  async generateOTP(@Param('userId') userId: string, @Request() req) {
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('Unauthorized access to OTP generation');
    }
    return await this.authService.generateOTP(userId);
  }

  @Post('verify-otp/:userId')
  @UseGuards(AuthGuard('jwt'))
  async verifyOTP(
    @Param('userId') userId: string,
    @Body('token') token: string,
    @Request() req,
  ) {
    if (req.user.userId !== userId) {
      throw new UnauthorizedException('Unauthorized access to OTP verification');
    }
    return await this.authService.verifyOTP(userId, token);
  }
}
