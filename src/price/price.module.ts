import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Price, PriceSchema } from './entities/price.entity';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Price.name, schema: PriceSchema }])],
  controllers: [PriceController],
  providers: [PriceService],
  exports: [PriceService],
})
export class PriceModule {}