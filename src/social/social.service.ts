import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, Types } from 'mongoose';

import { User } from 'src/user/entities/user.entity';
import { Trade } from 'src/trade/entities/trade.entity';
import { Social } from './entities/social.entity';

import { UserService } from '../user/user.service';
import { TradeService } from '../trade/trade.service';
import { NotificationService } from '../notification/notification.service';

import CustomResponse from 'providers/custom-response.service';

type TradeDocument = Trade & Document;

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Trade.name)
    private readonly tradeModel: Model<TradeDocument>,

    @InjectModel(Social.name)
    private readonly socialModel: Model<Social>,

    private readonly userService: UserService,
    private readonly tradeService: TradeService,
    private readonly notificationService: NotificationService,
  ) {}

  // ================= LEADERBOARD =================
  async getLeaderboard(limit: number): Promise<CustomResponse> {
    const leaderboard = await this.userModel.aggregate([
      { $match: { role: 'user' } },
      { $addFields: { pnl: { $ifNull: ['$totalPnL', 0] } } },
      { $sort: { pnl: -1 } },
      { $limit: limit },
      { $project: { password: 0, twoFactorSecret: 0 } },
    ]);

    return new CustomResponse(200, 'Leaderboard fetched', leaderboard);
  }

  // ================= FOLLOW =================
  async follow(followerId: string, traderId: string): Promise<CustomResponse> {
    if (followerId === traderId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const trader = await this.userModel.findById(traderId);
    if (!trader || !trader.allowCopying) {
      throw new BadRequestException('Trader not available');
    }

    await this.userModel.updateOne(
      { _id: followerId },
      { $addToSet: { following: traderId } },
    );

    await this.userModel.updateOne(
      { _id: traderId },
      { $addToSet: { followers: followerId } },
    );

    return new CustomResponse(200, 'Followed successfully', null);
  }

  // ================= UNFOLLOW =================
  async unfollow(followerId: string, traderId: string): Promise<CustomResponse> {
    await this.userModel.updateOne(
      { _id: followerId },
      { $pull: { following: traderId } },
    );

    await this.userModel.updateOne(
      { _id: traderId },
      { $pull: { followers: followerId } },
    );

    return new CustomResponse(200, 'Unfollowed successfully', null);
  }

  // ================= FOLLOWING =================
  async getFollowing(userId: string): Promise<CustomResponse> {
    const user = await this.userModel
      .findById(userId)
      .populate('following', 'name email totalPnL role');

    if (!user) throw new BadRequestException('User not found');

    return new CustomResponse(200, 'Following fetched', user.following);
  }

  // ================= COPY SETTINGS (🔥 FIXED) =================
  async updateCopySettings(
    userId: string,
    settings: {
      riskPercent?: number;
      maxTrades?: number;
      autoCopy?: boolean;
    },
  ): Promise<CustomResponse> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          copySettings: {
            riskPercent: settings.riskPercent ?? 100,
            maxTrades: settings.maxTrades ?? 10,
            autoCopy: settings.autoCopy ?? false,
          },
        },
      },
      { new: true },
    );

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return new CustomResponse(
      200,
      'Copy settings updated successfully',
      user.copySettings,
    );
  }

  // ================= SOCIAL FEED =================
  async getSocialFeed(userId: string): Promise<CustomResponse> {
    const user = await this.userModel.findById(userId).select('following');
    if (!user) throw new BadRequestException('User not found');

    const ids = [...user.following, new Types.ObjectId(userId)];

    const trades = await this.tradeModel
      .find({
        userId: { $in: ids },
        status: 'closed',
        isPublic: true,
      })
      .populate('userId', 'name email')
      .sort({ closedAt: -1 })
      .limit(50);

    return new CustomResponse(200, 'Feed fetched', trades);
  }

  // ================= SHARE TRADE =================
  async shareTrade(
    userId: string,
    tradeId: string,
    message?: string,
  ): Promise<CustomResponse> {
    const trade = await this.tradeModel.findById(tradeId);
    if (!trade || trade.userId.toString() !== userId) {
      throw new BadRequestException('Invalid trade');
    }

    (trade as any).isPublic = true;
    await trade.save();

    const post = await this.socialModel.create({
      userId,
      tradeId,
      message,
    });

    return new CustomResponse(200, 'Trade shared', post);
  }

  // ================= AUTO COPY TRADE =================
  async autoCopyTrade(
    originalTrade: TradeDocument,
    traderId: string,
  ): Promise<CustomResponse> {
    if (originalTrade.type !== 'buy') {
      return new CustomResponse(200, 'Sell trade not copied', null);
    }

    const trader = await this.userModel.findById(traderId).select('followers');
    if (!trader) throw new BadRequestException('Trader not found');

    for (const followerId of trader.followers || []) {
      const follower = await this.userModel
        .findById(followerId)
        .select('copySettings');

      if (!follower?.copySettings?.autoCopy) continue;

      const riskPercent = follower.copySettings.riskPercent || 100;
      const quantity = originalTrade.quantity * (riskPercent / 100);
      if (quantity <= 0) continue;

      await this.tradeService.buy(
        {
          symbol: originalTrade.symbol,
          quantity,
          price: originalTrade.entryPrice,
          durationValue: originalTrade.durationValue,
          durationUnit: originalTrade.durationUnit,
        },
        followerId.toString(),
      );
    }

    return new CustomResponse(200, 'Auto copy executed', null);
  }
}
