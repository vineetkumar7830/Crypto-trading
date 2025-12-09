import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Signals, SignalsSchema } from './entities/signal.entity';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Signals.name, schema: SignalsSchema }]), UserModule],
  controllers: [SignalsController],
  providers: [SignalsService],
})
export class SignalsModule {}