import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { Trade, TradeSchema } from './entities/trade.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
    ]),
    forwardRef(() => WalletModule),
  ],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}
