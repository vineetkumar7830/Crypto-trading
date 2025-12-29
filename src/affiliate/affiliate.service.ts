import {
  Injectable,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Affiliate } from './entities/affiliate.entity';
import { UserService } from '../user/user.service';
import { TradeService } from '../trade/trade.service';
import { WalletService } from '../wallet/wallet.service';
import CustomResponse from 'providers/custom-response.service';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectModel(Affiliate.name)
    private affiliateModel: Model<Affiliate>,

    private userService: UserService,

    @Inject(forwardRef(() => TradeService))
    private tradeService: TradeService,

    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  // ---------------------- CREATE OR FETCH AFFILIATE ---------------------
  async ensureAffiliate(userId: string) {
    const objId = new Types.ObjectId(userId);
    let aff = await this.affiliateModel.findOne({ userId: objId }).exec();

    if (!aff) {
      let code = '';
      let isUnique = false;

      while (!isUnique) {
        code = `AFF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const exists = await this.affiliateModel.findOne({ code }).exec();
        if (!exists) isUnique = true;
      }

      aff = await this.affiliateModel.create({
        userId: objId,
        code: code, // ✅ make sure code is always set
        parentAffiliateId: null,
        referredUsers: [],
        subAffiliates: [],
        totalCommission: 0,
        withdrawable: 0,
        commissionHistory: [],
        createdAt: new Date(),
      });
    }

    return aff;
  }

  // ---------------------------- DASHBOARD ------------------------------
  async getDashboard(userId: string) {
    const aff = await this.ensureAffiliate(userId);

    return new CustomResponse(200, 'Affiliate Dashboard', {
      totalCommission: aff.totalCommission,
      withdrawable: aff.withdrawable,
      referredUsersCount: aff.referredUsers?.length || 0,
      subAffiliatesCount: aff.subAffiliates?.length || 0,
      commissionHistory: aff.commissionHistory,
      code: aff.code,
    });
  }

  // ---------------------------- APPROVE AFFILIATE ----------------------
  async approveAffiliate(userId: string): Promise<CustomResponse> {
    const userResp: any = await this.userService.findById(userId);
    const user = userResp?.result;
    if (!user) throw new BadRequestException('User not found');

    if (user.isAffiliateApproved) {
      return new CustomResponse(400, 'Already approved', null);
    }

    await this.userService.update(userId, {
      isAffiliateApproved: true,
      role: 'affiliate',
    } as any);

    const aff = await this.ensureAffiliate(userId);

    return new CustomResponse(200, 'Affiliate approved successfully', aff);
  }

  // ---------------------------- GENERATE REFERRAL LINK -----------------
  async generateReferralLink(userId: string): Promise<CustomResponse> {
    const aff = await this.ensureAffiliate(userId);

    return new CustomResponse(200, 'Referral link generated', {
      code: aff.code,
      link: `${process.env.FRONTEND_URL || 'https://example.com'}/register?ref=${aff.code}`,
    });
  }

  // ---------------------------- JOIN AFFILIATE -------------------------
  async join(userId: string, code: string): Promise<CustomResponse> {
    if (!code) {
      return new CustomResponse(400, 'Referral code required');
    }

    const parentUserResp = await this.userService.findByAffiliateCode(code);
    const parentUser = (parentUserResp as any)?.result;

    if (!parentUser) throw new BadRequestException('Invalid referral code');
    if (String(parentUser._id) === userId) {
      throw new BadRequestException('Cannot use your own code');
    }

    const parentId = String(parentUser._id);

    await this.userService.update(userId, {
      parentAffiliate: parentId,
    } as any);

    const parentAff: any = await this.ensureAffiliate(parentId);
    const childAff: any = await this.ensureAffiliate(userId);

    if (!parentAff.referredUsers.includes(childAff.userId)) {
      parentAff.referredUsers.push(childAff.userId);
    }

    if (!parentAff.subAffiliates.includes(childAff._id)) {
      parentAff.subAffiliates.push(childAff._id);
    }

    childAff.parentAffiliateId = parentAff._id;

    await parentAff.save();
    await childAff.save();

    return new CustomResponse(200, 'Affiliate joined successfully', parentAff);
  }

  // ---------------------------- CALCULATE COMMISSION ------------------
  async calculateCommission(userId: string, amount: number): Promise<void> {
    const userResp = await this.userService.findById(userId);
    const user = (userResp as any)?.result;
    if (!user) return;

    // ================= LEVEL 1 =================
    const parentId = user.parentAffiliate;
    if (!parentId) return;

    const lvl1 = amount * 0.05;

    await this.walletService.deposit({
      userId: parentId,
      amount: lvl1,
      crypto: 'USDT',
    });

    await this.affiliateModel.updateOne(
      { userId: new Types.ObjectId(parentId) },
      {
        $inc: { totalCommission: lvl1, withdrawable: lvl1 },
        $push: {
          commissionHistory: {
            amount: lvl1,
            type: 'level1',
            source: 'trade',
            description: '5% Level1 commission',
            fromUserId: userId,
            date: new Date(),
          },
        },
      },
    );

    // ================= LEVEL 2 =================
    const parentResp = await this.userService.findById(parentId);
    const parentUser = (parentResp as any)?.result;
    const level2Id = parentUser?.parentAffiliate;
    if (!level2Id) return;

    const lvl2 = amount * 0.02;

    await this.walletService.deposit({
      userId: level2Id,
      amount: lvl2,
      crypto: 'USDT',
    });

    await this.affiliateModel.updateOne(
      { userId: new Types.ObjectId(level2Id) },
      {
        $inc: { totalCommission: lvl2, withdrawable: lvl2 },
        $push: {
          commissionHistory: {
            amount: lvl2,
            type: 'level2',
            source: 'trade',
            description: '2% Level2 commission',
            fromUserId: userId,
            date: new Date(),
          },
        },
      },
    );
  }
}
