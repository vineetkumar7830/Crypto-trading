import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
