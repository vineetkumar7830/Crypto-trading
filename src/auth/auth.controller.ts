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
import { AffiliateService } from '../affiliate/affiliate.service';
import { WalletService } from '../wallet/wallet.service';
import CustomResponse from 'providers/custom-response.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly affiliateService: AffiliateService,
    private readonly walletService: WalletService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.userService.create(createUserDto);
    if (!newUser || newUser.statusCode >= 400) return newUser;

    const userId = newUser.result?._id || newUser.result?.id;
    try { await this.walletService.createWallet(String(userId)); } catch {}
    try { await this.affiliateService.ensureAffiliate(String(userId)); } catch {}
    if ((createUserDto as any).referralCode) {
      try { await this.affiliateService.join(String(userId), (createUserDto as any).referralCode); } catch {}
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
    if (req.user.userId !== userId) throw new UnauthorizedException('Unauthorized');
    return await this.authService.generateOTP(userId);
  }

  @Post('verify-otp/:userId')
  @UseGuards(AuthGuard('jwt'))
  async verifyOTP(
    @Param('userId') userId: string,
    @Body('token') token: string,
    @Request() req,
  ) {
    if (req.user.userId !== userId) throw new UnauthorizedException('Unauthorized');
    return await this.authService.verifyOTP(userId, token);
  }
}
