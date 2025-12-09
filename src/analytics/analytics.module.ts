import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TradeModule } from '../trade/trade.module';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Trade,TradeSchema } from 'src/trade/entities/trade.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Trade.name, schema: TradeSchema }]),TradeModule, UserModule],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})

export class AnalyticsModule {}