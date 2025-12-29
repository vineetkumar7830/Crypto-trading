import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trade } from './entities/trade.entity';
import CustomResponse from 'providers/custom-response.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class TradeService {
  constructor(
    @InjectModel(Trade.name)
    private tradeModel: Model<Trade>,

    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}
  
  private getMarketPrice(price: number): number {
    const change = (Math.random() * 2 - 1) / 100;
    return +(price + price * change).toFixed(2);
  }

  private durationToMs(value: number, unit: string): number {
    switch (unit) {
      case 'seconds':
        return value * 1000;
      case 'minutes':
        return value * 60 * 1000;
      case 'hours':
        return value * 60 * 60 * 1000;
      case 'days':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new BadRequestException('Invalid duration unit');
    }
  }

  async buy(data: any, userId: string) {
    const stake = Number(data.quantity) * Number(data.price);
    if (!userId || stake <= 0) {
      throw new BadRequestException('Invalid trade data');
    }

    await this.walletService.lockBalance(userId, stake);
  
    const expiryMs = this.durationToMs(
      data.durationValue,
      data.durationUnit,
    );

    const trade = await this.tradeModel.create({
      userId: new Types.ObjectId(userId),
      symbol: data.symbol,
      type: 'buy',
      quantity: data.quantity,
      entryPrice: data.price,
      durationValue: data.durationValue,
      durationUnit: data.durationUnit,
      expiryTime: new Date(Date.now() + expiryMs),
      status: 'open',
      profitLoss: 0,
    });

    setTimeout(() => {
      this.closeTrade(trade._id as Types.ObjectId);
    }, expiryMs);

    return new CustomResponse(200, 'BUY trade placed', trade);
  }

  async sell(data: any, userId: string) {
    const stake = Number(data.quantity) * Number(data.price);
    if (!userId || stake <= 0) {
      throw new BadRequestException('Invalid trade data');
    }

    await this.walletService.lockBalance(userId, stake);

    const expiryMs = this.durationToMs(
      data.durationValue,
      data.durationUnit,
    );

    const trade = await this.tradeModel.create({
      userId: new Types.ObjectId(userId),
      symbol: data.symbol,
      type: 'sell',
      quantity: data.quantity,
      entryPrice: data.price,
      durationValue: data.durationValue,
      durationUnit: data.durationUnit,
      expiryTime: new Date(Date.now() + expiryMs),
      status: 'open',
      profitLoss: 0,
    });
    
    setTimeout(() => {
      this.closeTrade(trade._id as Types.ObjectId);
    }, expiryMs);

    return new CustomResponse(200, 'SELL trade placed', trade);
  }

  private async closeTrade(tradeId: Types.ObjectId) {

    const trade = await this.tradeModel.findOneAndUpdate(
      {
        _id: tradeId,
        status: 'open',
      },
      { status: 'closing' },
      { new: true },
    );

    if (!trade) return;

    const exitPrice = this.getMarketPrice(trade.entryPrice);
    const stake = trade.quantity * trade.entryPrice;

    let profitLoss = 0;
    if (trade.type === 'buy') {
      profitLoss = exitPrice > trade.entryPrice ? stake * 0.8 : -stake;
    } else {
      profitLoss = exitPrice < trade.entryPrice ? stake * 0.8 : -stake;
    }

    trade.exitPrice = exitPrice;
    trade.profitLoss = +profitLoss.toFixed(2);
    trade.result = profitLoss > 0 ? 'profit' : 'loss';
    trade.status = 'closed';
    trade.closedAt = new Date();

    await trade.save();

    await this.walletService.unlockBalance(
      trade.userId.toString(),
      stake,
      profitLoss,
    );
  }

  async getOpenTrades(userId: string) {
    return new CustomResponse(
      200,
      'Open trades',
      await this.tradeModel
        .find({
          userId: new Types.ObjectId(userId),
          status: 'open',
          expiryTime: { $gt: new Date() }, 
        })
        .sort({ createdAt: -1 }), 
    );
  }
                                
  async getClosedTrades(userId: string) {
    return new CustomResponse(
      200,
      'Closed trades',
      await this.tradeModel
        .find({
          userId: new Types.ObjectId(userId),
          status: 'closed',
        })
        .sort({ createdAt: -1 }),
    );
  }

  async getTradeHistory(userId: string) {
    return new CustomResponse(
      200,
      'Trade history',
      await this.tradeModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 }),
    );
  }
}
