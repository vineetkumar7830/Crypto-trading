import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
    
    const user = await this.userService.findByEmail(email); 
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      statusCode: 200,
      message: 'Login successful',
      data: {
        access_token: token,
        user,
      },
    };
  }

  // -------------------------------
  // GENERATE OTP
  // -------------------------------
  async generateOTP(userId: string) {
    const resp = await this.userService.findById(userId);
    const user = resp?.result;
    if (!user) throw new BadRequestException('User not found');

    const secret = speakeasy.generateSecret({ length: 20 });
    await this.userService.update(userId, { otpSecret: secret.base32 });

    const otpURL = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `MyApp:${userId}`,
      algorithm: 'sha1',
    });

    const qrCode = await QRCode.toDataURL(otpURL);

    return { qrCode, secret: secret.base32 };
  }

  async verifyOTP(userId: string, token: string) {
    const resp = await this.userService.findById(userId);
    const user = resp?.result;
    if (!user) throw new BadRequestException('User not found');

    const verified = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) throw new UnauthorizedException('Invalid OTP');

    return { verified: true };
  }
}
