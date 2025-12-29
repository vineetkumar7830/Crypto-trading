import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Signal, SignalDocument } from './entities/signal.entity';
import { CreateSignalDto } from './dto/create-signal.dto';

@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal.name)
    private readonly signalModel: Model<SignalDocument>,
  ) {}

  async createSignal(
    createSignalDto: CreateSignalDto,
  ): Promise<SignalDocument> {
    const signal = new this.signalModel({
      asset: createSignalDto.asset,        
      direction: createSignalDto.direction,  
      expiry: createSignalDto.expiry,        
      entryPrice: createSignalDto.entryPrice,
      entryTime: new Date(),
      executed: false,
      result: 'RUNNING',
    });

    const savedSignal = await signal.save();

    this.autoCloseSignal(savedSignal);

    return savedSignal;
  }

  async getAllSignals(): Promise<SignalDocument[]> {
    return this.signalModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }
  async autoCloseSignal(signal: SignalDocument): Promise<void> {
    setTimeout(async () => {
      const s = await this.signalModel.findById(signal._id);
      if (!s || s.executed) return;

      const closePrice = this.getDummyClosePrice(s.entryPrice);

      let result: 'PROFIT' | 'LOSS';

      if (s.direction === 'BUY') {
        result = closePrice > s.entryPrice ? 'PROFIT' : 'LOSS';
      } else {
        result = closePrice < s.entryPrice ? 'PROFIT' : 'LOSS';
      }

      s.closePrice = closePrice;
      s.closeTime = new Date();
      s.executed = true;
      s.result = result;

      await s.save();

      console.log(
        `[AUTO CLOSE] ${s.asset} | ${s.direction} | ${result}`,
      );
    }, signal.expiry * 1000);
  }

  private getDummyClosePrice(entryPrice: number): number {
    const movement = Math.random() * 0.002;
    return Math.random() > 0.5
      ? entryPrice + movement
      : entryPrice - movement;
  }
}
