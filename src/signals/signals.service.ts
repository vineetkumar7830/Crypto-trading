
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Signals } from './entities/signal.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SignalsService {
  constructor(@InjectModel(Signals.name) private signalsModel: Model<Signals>) {}

  async getLatest(userId: string) {
    return this.signalsModel
      .find({ subscribers: { $in: [userId] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec(); 
  }
  
  async subscribe(userId: string, signalId: string) {
    await this.signalsModel.updateOne(
      { _id: signalId },
      { $addToSet: { subscribers: userId } }
    ).exec(); 
  }
  @Cron('0 * * * *')
  generateSignals() {
  }
}
