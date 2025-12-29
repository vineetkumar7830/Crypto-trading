import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Signal, SignalSchema } from './entities/signal.entity';
import { SignalController } from './signals.controller';
import { SignalService } from './signals.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Signal.name, schema: SignalSchema }]), UserModule],
  controllers: [SignalController],
  providers: [SignalService],
})
export class SignalsModule {}