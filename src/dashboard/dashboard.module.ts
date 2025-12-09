import { Module, forwardRef } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TradeModule } from '../trade/trade.module';
import { WalletModule } from '../wallet/wallet.module';
import { AffiliateModule } from '../affiliate/affiliate.module';
import { UserModule } from '../user/user.module'; 

@Module({
  imports: [
    forwardRef(() => TradeModule),
    forwardRef(() => WalletModule),
    forwardRef(() => AffiliateModule),

    UserModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
