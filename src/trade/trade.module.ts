// src/trade/trade.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { Trade, TradeSchema } from './entities/trade.entity';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';
import { PriceModule } from '../price/price.module';
import { WalletModule } from '../wallet/wallet.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trade.name, schema: TradeSchema }]),
    PriceModule,
    WalletModule,
    forwardRef(() => AffiliateModule),
    NotificationModule,
    BullModule.registerQueue({
      name: 'trades',
    }),
  ],
  
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}