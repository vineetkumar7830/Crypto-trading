
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { Trade, TradeSchema } from '../trade/entities/trade.entity';
import { Social, SocialSchema } from './entities/social.entity';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { UserModule } from '../user/user.module';
import { TradeModule } from '../trade/trade.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Trade.name, schema: TradeSchema },
      { name: Social.name, schema: SocialSchema },
    ]),

    UserModule,
    TradeModule,
    NotificationModule,
    
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}