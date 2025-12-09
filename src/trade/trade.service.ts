import { Injectable, forwardRef, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ethers } from 'ethers';
import { Trade } from './entities/trade.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { PriceService } from '../price/price.service';
import { WalletService } from '../wallet/wallet.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { NotificationService } from '../notification/notification.service';
import CustomResponse from 'providers/custom-response.service';
import CustomError from 'providers/customer-error.service';

@Injectable()
export class TradeService {
  constructor(
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    private priceService: PriceService,
    private walletService: WalletService,
    @Inject(forwardRef(() => AffiliateService))
    private affiliateService: AffiliateService,
    private notiService: NotificationService,
    @InjectQueue('trades') private tradeQueue: Queue,
  ) {}

  async createTrade(
    dto: CreateTradeDto & {
      symbol: string;
      quantity: number;
      stopLoss?: number;
      takeProfit?: number;
      expiryTime?: number;
    },
    type: 'buy' | 'sell',
    userId: string,
  ) {
    try {
      const currentPrice = await this.priceService.getPrice(dto.symbol);

      const fakeOrder = {
        id: `fake-${Date.now()}`,
        symbol: `${dto.symbol}/USDT`,
        side: type,
        amount: dto.quantity,
        price: currentPrice,
        status: 'FILLED',
        timestamp: Date.now(),
      };

      // set makerId / takerId so getUserTrades can find trades by user
      const makerId = userId;
      const takerId = userId;

      const trade = new this.tradeModel({
        ...dto,
        type,
        userId,
        makerId,
        takerId,
        entryPrice: currentPrice,
        status: 'open',
        orderId: fakeOrder.id,
      });

      await trade.save();

      const amount = dto.quantity * currentPrice;

      // update main balance: buy reduces, sell increases
      await this.walletService.updateBalance(
        userId,
        type === 'buy' ? -amount : amount,
      );

      // calculate commission on the trade amount once
      await this.affiliateService.calculateCommission(userId, amount);

      const adminCut = amount * 0.01; // just log for now
      console.log(`Admin Cut Saved: ${adminCut} USDT`);
      console.log(`Commission Earned (calc): ${amount * 0.05} USDT`);

      await this.notiService.emitTradeUpdate(userId, { status: 'open', trade });

      return new CustomResponse(200, 'Trade created successfully', {
        fakeOrder,
        trade,
      });
    } catch (error: any) {
      console.error('Create Trade Error:', error);
      return new CustomError(500, error.message || 'Failed to create trade');
    }
  }

  async getHistory(userId: string, status: 'open' | 'closed') {
    try {
      const trades = await this.tradeModel
        .find({ userId, status })
        .sort({ createdAt: -1 })
        .exec();
      return new CustomResponse(200, 'Trade history fetched successfully', trades);
    } catch (error: any) {
      return new CustomError(500, error.message || 'Failed to fetch trade history');
    }
  }

  async closeTrade(tradeId: string, reason: string, exitPrice: number) {
    try {
      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) throw new Error('Trade not found');

      trade.status = 'closed';
      trade.exitPrice = exitPrice;
      trade.profitLoss =
        (exitPrice - trade.entryPrice) * trade.quantity * (trade.type === 'buy' ? 1 : -1);
      trade.closeReason = reason;
      await trade.save();

      if (this.walletService?.updatePnL) {
        await this.walletService.updatePnL(trade.userId, trade.profitLoss);
      }

      if (process.env.ETHER_PRIVATE_KEY) {
        await this.notiService.sendEmail(
          trade.userId,
          'Trade Closed',
          `P&L: ${trade.profitLoss.toFixed(2)} USDT`,
        );
      }

      return new CustomResponse(200, 'Trade closed successfully', trade);
    } catch (error: any) {
      console.error('Close Trade Error:', error);
      return new CustomError(500, error.message || 'Failed to close trade');
    }
  }

  async filterTrades(userId: string, query: any) {
    try {
      if (!userId) throw new BadRequestException('userId is required');

      const filter: any = { userId };

      if (query.status) filter.status = query.status;
      if (query.symbol) filter.symbol = query.symbol.toUpperCase();
      if (query.type) filter.type = query.type;

      if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
        if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
      }

      const page = Math.max(1, parseInt(query.page as string) || 1);
      const limit = Math.min(100, parseInt(query.limit as string) || 20);
      const skip = (page - 1) * limit;

      const [trades, total] = await Promise.all([
        this.tradeModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.tradeModel.countDocuments(filter).exec(),
      ]);

      return new CustomResponse(200, 'Trades filtered successfully', {
        data: trades,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      console.error('Filter Trade Error:', error);
      return new CustomError(500, error.message || 'Failed to filter trades');
    }
  }

  private async logToBlockchain(trade: Trade) {
    if (!process.env.ETHER_PRIVATE_KEY) return;

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_KEY',
      );
      const wallet = new ethers.Wallet(process.env.ETHER_PRIVATE_KEY, provider);

      const tx = await wallet.sendTransaction({
        to: '0x000000000000000000000000000000000000dEaD',
        value: 0,
        data: ethers.hexlify(
          ethers.toUtf8Bytes(
            JSON.stringify({
              tradeId: trade._id,
              userId: trade.userId,
              symbol: trade.symbol,
              type: trade.type,
              quantity: trade.quantity,
              entryPrice: trade.entryPrice,
              status: trade.status,
            }),
          ),
        ),
      });

      trade.txHash = tx.hash;
      await trade.save();
    } catch (error) {
      console.error('Blockchain log failed:', error?.message || error);
    }
  }

  async getChildTrades(userId: string): Promise<any[]> {
    try {
      // return trades where user is owner or maker or taker
      const trades = await this.tradeModel
        .find({
          $or: [{ userId }, { makerId: userId }, { takerId: userId }],
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
      return trades;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch child trades');
    }
  }

  async getUserTrades(userId: string): Promise<any[]> {
    try {
      // broaden query — some trades may have makerId/takerId fields instead of userId
      const trades = await this.tradeModel
        .find({
          $or: [{ userId }, { makerId: userId }, { takerId: userId }],
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
      return trades;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch user trades');
    }
  }
}
