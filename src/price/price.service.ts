import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price } from './entities/price.entity';

@Injectable()
export class PriceService {

  private readonly DEFAULT_PRICES: Record<string, number> = {
    BTC: 65000,
    ETH: 3200,
    BNB: 580,
    USDT: 1,
  };

  constructor(@InjectModel(Price.name) private priceModel: Model<Price>) { }

  // -----------------------------------
  // SET CUSTOM PRICE
  // -----------------------------------
  async setCustomPrice(symbol: string, price: number) {
    await this.priceModel.findOneAndUpdate(
      { symbol },
      { symbol, customPrice: price },
      { upsert: true }
    );
  }

  // -----------------------------------
  // GET PRICE + FLUCTUATION LOGIC
  // -----------------------------------
  async getPrice(symbol: string): Promise<number> {
    const doc = await this.priceModel.findOne({ symbol });
    console.log("custom price", doc);

    // Select Base Price
    let basePrice =
      doc?.customPrice ||
      (doc as any)?.basePrice ||
      this.DEFAULT_PRICES[symbol.toUpperCase()] ||
      0;

    if (basePrice === 0) return 0;

    // Volatility
    const volatility = symbol.toUpperCase() === 'USDT' ? 0.1 : 3;
    const changePercent = (Math.random() - 0.5) * volatility;
    const newPrice = basePrice * (1 + changePercent / 100);

    // Save updated live price
    await this.priceModel.findOneAndUpdate(
      { symbol },
      {
        symbol,
        customPrice: doc?.customPrice || null,
        basePrice: basePrice,
        currentPrice: newPrice,
        updatedAt: new Date(),
      },
      { upsert: true }
    );

    return Math.max(0, newPrice);
  }

  async getAllPrices(): Promise<Record<string, number>> {
    const customs = await this.priceModel.find().exec();
    const result: Record<string, number> = { ...this.DEFAULT_PRICES };

    customs.forEach(p => {
      result[p.symbol] =
        p.currentPrice || p.customPrice || result[p.symbol];
    });

    return result;
  }

  async getHistoricalPrices(symbol: string, limit: number = 100): Promise<any[]> {
    const docs = await this.priceModel
      .find({ symbol })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    return docs.map(d => ({
      timestamp: d.updatedAt,
      price: d.currentPrice,
      change:
        (d as any).basePrice
          ? (
              (
                ((d.currentPrice || 0) - (d as any).basePrice) /
                (d as any).basePrice
              ) * 100
            ).toFixed(2) + "%"
          : "0%",
    }));
  }

  async simulateTrend(
    symbol: string,
    trend?: 'bull' | 'bear',
    duration: number = 60
  ) {
    const interval = setInterval(async () => {
      await this.getPrice(symbol);
      if (--duration <= 0) clearInterval(interval);
    }, 5000);

    return { message: `Trend simulation started for ${symbol}` };
  }
}
