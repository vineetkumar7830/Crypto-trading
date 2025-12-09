import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { TradeModule } from './trade/trade.module';
import { PriceModule } from './price/price.module';
import { WalletModule } from './wallet/wallet.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { KycModule } from './kyc/kyc.module';
import { SignalsModule } from './signals/signals.module';
import { SocialModule } from './social/social.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from './dashboard/dashboard.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
   MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb+srv://rs5045280:xbpneTRReMJD9LAc@cluster0.sbbouj5.mongodb.net/crypto_api_v2'), 
    UserModule, AuthModule, AffiliateModule, TradeModule, PriceModule, WalletModule, NotificationModule, AdminModule, AnalyticsModule, KycModule, SignalsModule, SocialModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
