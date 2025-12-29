import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './guards/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module';
import { AffiliateModule } from 'src/affiliate/affiliate.module';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'lokeshkumar', signOptions: { expiresIn: '7d' } }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserModule,
    AffiliateModule,
    WalletModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
