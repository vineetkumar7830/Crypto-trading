import {
  Inject,
  Injectable,
  BadRequestException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Affiliate } from './entities/affiliate.entity';

import { UserService } from '../user/user.service';
import { TradeService } from '../trade/trade.service';
import { WalletService } from '../wallet/wallet.service';

import CustomResponse from 'providers/custom-response.service';
import CustomError from 'providers/customer-error.service';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectModel(Affiliate.name) private affiliateModel: Model<any>,

    private userService: UserService,

    @Inject(forwardRef(() => TradeService))
    private tradeService: TradeService,

    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  // ensure affiliate document exists for a userId
  async ensureAffiliate(userId: string) {
    try {
      const objId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

      // find by object id correctly
      let aff = await this.affiliateModel.findOne({ userId: objId }).exec();

      if (!aff) {
        const code = `AFF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        aff = await this.affiliateModel.create({
          userId: objId,
          code,
          parentAffiliateId: null,
          referredUsers: [],
          subAffiliates: [],
          totalCommission: 0,
          withdrawable: 0,
          commissionHistory: [],
        });
      }
      return aff;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to ensure affiliate');
    }
  }

  // JOIN: attach a user to an affiliate (parent) by referral code
  async join(userId: string, code: string) {
    try {
      if (!code) return new CustomResponse(400, 'No referral code provided');

      const parentUserResp = await this.userService.findByAffiliateCode(code);
      if (!parentUserResp?.result) throw new BadRequestException('Invalid referral code');

      const parentId = String(parentUserResp.result._id);

      // update user's parentAffiliate field
      await this.userService.update(userId, { parentAffiliate: parentId } as any);

      const parentAff = await this.ensureAffiliate(parentId);
      const childAff = await this.ensureAffiliate(userId);

      const childOid = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

      parentAff.referredUsers = parentAff.referredUsers || [];
      if (!parentAff.referredUsers.some((r: any) => String(r) === String(childOid))) {
        parentAff.referredUsers.push(childOid);
      }

      parentAff.subAffiliates = parentAff.subAffiliates || [];
      if (!parentAff.subAffiliates.some((s: any) => String(s) === String(childAff._id))) {
        parentAff.subAffiliates.push(childAff._id);
      }

      await parentAff.save();
      await childAff.save();

      return new CustomResponse(200, 'Affiliate joined successfully', parentAff);
    } catch (err: any) {
      return new CustomError(500, err.message || 'Failed to join affiliate');
    }
  }

  // calculate commissions for level1 and level2 (called from trade flow)
  async calculateCommission(userId: string, tradeAmount: number) {
    try {
      const userResp = await this.userService.findById(userId);
      if (!userResp?.result) throw new BadRequestException('User not found');

      const user = userResp.result;
      const level1Id = user.parentAffiliate || user.parentAffiliateId;
      if (!level1Id) return new CustomResponse(200, 'No parent → No commission');

      const level1Commission = Number(tradeAmount) * 0.05;

      // credit wallet (updateBalance expects userId string)
      await this.walletService.updateBalance(String(level1Id), level1Commission);

      // update affiliate doc for level1
      await this.affiliateModel.updateOne(
        { userId: new Types.ObjectId(String(level1Id)) },
        {
          $inc: { totalCommission: level1Commission, withdrawable: level1Commission },
          $push: {
            commissionHistory: {
              amount: level1Commission,
              type: 'level1',
              source: 'trade',
              description: `5% commission from trade by ${userId}`,
              date: new Date(),
            },
          },
        },
        { upsert: true },
      );

      // level 2
      const level1UserResp = await this.userService.findById(String(level1Id));
      const level1User = level1UserResp?.result;
      const level2Id = level1User?.parentAffiliate || level1User?.parentAffiliateId;
      if (level2Id) {
        const level2Commission = Number(tradeAmount) * 0.02;
        await this.walletService.updateBalance(String(level2Id), level2Commission);

        await this.affiliateModel.updateOne(
          { userId: new Types.ObjectId(String(level2Id)) },
          {
            $inc: { totalCommission: level2Commission, withdrawable: level2Commission },
            $push: {
              commissionHistory: {
                amount: level2Commission,
                type: 'level2',
                source: 'trade',
                description: `2% commission (level2) from trade by ${userId}`,
                date: new Date(),
              },
            },
          },
          { upsert: true },
        );
      }

      return new CustomResponse(200, 'Commission calculated successfully');
    } catch (err: any) {
      return new CustomError(500, err.message || 'Failed to calculate commission');
    }
  }

  // Admin: add manual commission to an affiliate doc and credit wallet
  async addCommission(affiliateId: string, amount: number) {
    try {
      const aff = await this.affiliateModel.findById(affiliateId).exec();
      if (!aff) throw new BadRequestException('Affiliate not found');

      const userId = aff.userId?.toString ? aff.userId.toString() : aff.userId;

      await this.walletService.updateBalance(String(userId), amount);

      aff.totalCommission = (aff.totalCommission || 0) + amount;
      aff.withdrawable = (aff.withdrawable || 0) + amount;

      aff.commissionHistory = aff.commissionHistory || [];
      aff.commissionHistory.push({
        amount,
        type: 'manual',
        source: 'admin',
        description: 'Admin added commission',
        date: new Date(),
      });

      await aff.save();

      return new CustomResponse(200, 'Commission added successfully', aff);
    } catch (err: any) {
      return new CustomError(500, err.message || 'Failed to add commission');
    }
  }

  async getDashboard(userId: string) {
    try {
      const aff = await this.ensureAffiliate(userId);
      const trades = await this.tradeService.getChildTrades(userId);

      const createdAt = (aff as any).createdAt || null;

      return new CustomResponse(200, 'Affiliate dashboard fetched', {
        affiliateId: aff._id,
        userId: aff.userId,
        referralCode: aff.code,
        parentAffiliateId: aff.parentAffiliateId || null,
        totalReferrals: (aff.referredUsers || []).length,
        referredUsers: aff.referredUsers || [],
        subAffiliates: aff.subAffiliates || [],
        totalTrades: trades ? trades.length : 0,
        totalCommission: aff.totalCommission || 0,
        withdrawable: aff.withdrawable || 0,
        commissionHistory: aff.commissionHistory || [],
        createdAt,
      });
    } catch (err: any) {
      return new CustomError(500, err.message || 'Failed to fetch dashboard');
    }
  }

  async getReferrals(userId: string) {
    try {
      const aff = await this.ensureAffiliate(userId);
      const ids = aff.referredUsers || [];

      const users = (this.userService as any).findManyByIds
        ? await (this.userService as any).findManyByIds(ids)
        : null;

      if (users && users.result) return new CustomResponse(200, 'Referrals fetched', users.result);

      return new CustomResponse(200, 'Referrals fetched', { referrals: ids });
    } catch (err: any) {
      return new CustomError(500, err.message || 'Failed to fetch referrals');
    }
  }

  async getCommissionsByReferral(userId: string) {
    try {
      const aff = await this.ensureAffiliate(userId);
      const result: any[] = [];

      for (const ref of (aff.referredUsers || [])) {
        const refId = ref.toString ? ref.toString() : ref;
        const trades = await this.tradeService.getChildTrades(refId);
        const totalCommission = (trades || []).reduce((s: number, t: any) => s + ((t.amount || 0) * 0.05), 0);

        result.push({
          userId: refId,
          trades,
          totalCommission,
        });
      }

      return new CustomResponse(200, 'Referral commissions fetched', result);
    } catch (err: any) {
      return new CustomError(500, err.message || 'Failed to fetch commissions per referral');
    }
  }

  async generateReferralLink(userId: string) {
    try {
      const aff = await this.ensureAffiliate(userId);
      return new CustomResponse(200, 'Referral link generated', {
        code: aff.code,
        link: `${process.env.FRONTEND_URL || 'https://yourfrontend.com'}/register?ref=${aff.code}`,
      });
    } catch (err: any) {
      return new CustomError(500, err.message || 'Failed to generate referral link');
    }
  }

  async getTotalCommissionStats(userId: string) {
    try {
      const aff = await this.ensureAffiliate(userId);
      return {
        totalCommission: aff?.totalCommission ?? 0,
        withdrawable: aff?.withdrawable ?? 0,
      };
    } catch (err: any) {
      return { totalCommission: 0, withdrawable: 0 };
    }
  }
}
