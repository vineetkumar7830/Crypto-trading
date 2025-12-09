import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmailUser(email);
    if (!user) throw new UnauthorizedException('User not found');
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      statusCode: 200,
      message: 'Login successful',
      data: {
        access_token: token,
        user: { id: user.id, email: user.email, role: user.role },
      },
    };
  }

  async generateOTP(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `CryptoApp (${userId})`,
      length: 20,
    });

    await this.userService.update(userId, { twoFactorSecret: secret.base32 });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: 'CryptoApp',
      encoding: 'ascii',
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    
    return {
      statusCode: 200,
      message: 'OTP generated successfully',
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
      },
    };
  }
  
  async verifyOTP(userId: string, token: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.result.twoFactorSecret)
      throw new BadRequestException('2FA not set up for this user');

    const verified = speakeasy.totp.verify({
      secret: user.result.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) throw new UnauthorizedException('Invalid or expired OTP');

    return {
      statusCode: 200,
      message: 'OTP verified successfully',
      data: { verified: true },
    };
  }
}
