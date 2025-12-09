// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
    NotificationModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [
    UserService,  
  ],
})
export class UserModule {}
