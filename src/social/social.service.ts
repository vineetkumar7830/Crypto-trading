import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { Trade } from 'src/trade/entities/trade.entity';
import { Social } from './entities/social.entity';
import { UserService } from '../user/user.service';
import { TradeService } from '../trade/trade.service';
import { NotificationService } from '../notification/notification.service';
import CustomResponse from 'providers/custom-response.service';
import CustomError from 'providers/customer-error.service';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    @InjectModel(Social.name) private socialModel: Model<Social>,
    private userService: UserService,
    private tradeService: TradeService,
    private notificationService: NotificationService,
  ) {}


  async getLeaderboard(limit: number): Promise<CustomResponse> {
    try {
      const leaderboard = await this.userModel.aggregate([
        { $match: { role: 'user' } },
        { $addFields: { pnl: { $ifNull: ['$totalPnL', 0] } } },
        { $sort: { pnl: -1 } },
        { $limit: limit },
        { $project: { password: 0, twoFactorSecret: 0 } },
      ]);

      return new CustomResponse(200, 'Leaderboard fetched successfully', leaderboard);

    } catch (error) {
      throw new CustomError(500, `Error fetching leaderboard: ${error.message}`);
    }
  }



  async follow(followerId: string, traderId: string): Promise<CustomResponse> {
    try {
      if (followerId === traderId) 
        throw new BadRequestException('Cannot follow yourself');

      const trader = await this.userModel.findById(traderId);
      if (!trader || !trader.allowCopying)
        throw new BadRequestException('Cannot follow this trader');

      await this.userModel.updateOne({ _id: followerId }, { $addToSet: { following: traderId } });
      await this.userModel.updateOne({ _id: traderId }, { $addToSet: { followers: followerId } });

      await this.notificationService.sendEmail(
        traderId,
        'New Follower',
        `User ${followerId} started following you!`,
      );

      return new CustomResponse(200, 'Followed successfully', { followerId, traderId });

    } catch (error) {
      throw new CustomError(500, `Error following trader: ${error.message}`);
    }
  }



  async unfollow(followerId: string, traderId: string): Promise<CustomResponse> {
    try {
      await this.userModel.updateOne({ _id: followerId }, { $pull: { following: traderId } });
      await this.userModel.updateOne({ _id: traderId }, { $pull: { followers: followerId } });

      return new CustomResponse(200, 'Unfollowed successfully', { followerId, traderId });

    } catch (error) {
      throw new CustomError(500, `Error unfollowing trader: ${error.message}`);
    }
  }



  async getFollowing(userId: string): Promise<CustomResponse> {
    try {
      const user = await this.userModel
        .findById(userId)
        .populate({
          path: 'following',
          select: 'name email totalPnL role allowCopying accountType',
        });

      if (!user) throw new BadRequestException('User not found');

      return new CustomResponse(200, 'Following list fetched successfully', user.following || []);

    } catch (error) {
      throw new CustomError(500, `Error fetching following list: ${error.message}`);
    }
  }



  async updateCopySettings(userId: string, settings: any): Promise<CustomResponse> {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { $set: { copySettings: { ...settings } } },
        { new: true }
      );

      if (!updatedUser) throw new BadRequestException('User not found');

      return new CustomResponse(200, 'Copy settings updated successfully', updatedUser);

    } catch (error) {
      throw new CustomError(500, `Error updating copy settings: ${error.message}`);
    }
  }

  async getSocialFeed(userId: string): Promise<CustomResponse> {
    try {
      const user = await this.userModel.findById(userId).select('following');
      if (!user) throw new BadRequestException('User not found');

      const followedIds = [...(user.following || []), userId];

      const trades = await this.tradeModel
        .find({
          userId: { $in: followedIds },
          isPublic: true,
          status: 'closed',
        })
        .populate('userId', 'name email')
        .sort({ closedAt: -1 })
        .limit(50);

      return new CustomResponse(200, 'Social feed fetched successfully', trades);

    } catch (error) {
      throw new CustomError(500, `Error fetching social feed: ${error.message}`);
    }
  }
  
  async shareTrade(userId: string, tradeId: string, message?: string): Promise<CustomResponse> {
    try {
      const trade = await this.tradeModel.findById(tradeId);
      if (!trade || trade.userId.toString() !== userId)
        throw new BadRequestException('Invalid trade');

      trade.isPublic = true;
      await trade.save();

      const socialPost = await this.socialModel.create({ userId, tradeId, message });

      const user = await this.userModel.findById(userId).select('followers');
      if (!user || !user.followers)
        return new CustomResponse(200, 'Trade shared successfully', socialPost);

      for (const follower of user.followers) {
        await this.notificationService.emitTradeUpdate(follower.toString(), {
          type: 'sharedTrade',
          trade: tradeId,
        });
      }

      return new CustomResponse(200, 'Trade shared successfully', socialPost);

    } catch (error) {
      throw new CustomError(500, `Error sharing trade: ${error.message}`);
    }
  }

  async autoCopyTrade(originalTrade: Trade, traderId: string): Promise<CustomResponse> {
    try {
      const followersDoc = await this.userModel.findById(traderId).select('followers');
      if (!followersDoc) throw new BadRequestException('Trader not found');

      const followers = followersDoc.followers || [];

      for (const followerId of followers) {
        const follower = await this.userModel.findById(followerId).select('copySettings accountType');
        if (!follower) continue;
        if (!follower.copySettings?.autoCopy) continue;

        const scaledQty =
          originalTrade.quantity * ((follower.copySettings.riskPercent || 0) / 100);

        const copyDto = {
          ...originalTrade.toObject(),
          quantity: scaledQty,
          userId: followerId,
        };

        await this.tradeService.createTrade(copyDto, originalTrade.type as any, followerId);

        await this.notificationService.sendEmail(
          followerId.toString(),
          'Trade Copied',
          `Copied ${originalTrade.symbol} from ${traderId}`,
        );
      }

      return new CustomResponse(200, 'Auto copy trade executed successfully', { traderId });

    } catch (error) {
      throw new CustomError(500, `Error auto-copying trade: ${error.message}`);
    }
  }
}
