import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Kyc, KycSchema } from './entities/kyc.entity';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MongooseModule.forFeature([{ name: Kyc.name, schema: KycSchema }]), MulterModule.register({ dest: './uploads' })],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
