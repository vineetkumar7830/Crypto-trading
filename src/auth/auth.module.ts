import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './guards/jwt.strategy';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => AffiliateModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'lokeshkumar',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
