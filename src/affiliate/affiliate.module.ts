import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';
import { Affiliate, AffiliateSchema } from './entities/affiliate.entity';
import { UserModule } from '../user/user.module';
import { TradeModule } from '../trade/trade.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Affiliate.name, schema: AffiliateSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => TradeModule),
    forwardRef(() => WalletModule),
  ],
  providers: [AffiliateService],
  controllers: [AffiliateController],
  exports: [AffiliateService],
})
export class AffiliateModule {}
