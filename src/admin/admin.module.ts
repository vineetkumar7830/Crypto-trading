// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { Trade, TradeSchema } from '../trade/entities/trade.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { TradeModule } from '../trade/trade.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { KycModule } from '../kyc/kyc.module'; 
import { PriceModule } from 'src/price/price.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Trade.name, schema: TradeSchema },
    ]),
    UserModule,
    TradeModule,
    AffiliateModule,
    PriceModule,
    KycModule, 
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}