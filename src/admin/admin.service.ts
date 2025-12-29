import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { Trade } from 'src/trade/entities/trade.entity';
import { AffiliateService } from '../affiliate/affiliate.service';
import { KycService } from '../kyc/kyc.service';
import CustomResponse from 'providers/custom-response.service';
import { throwException } from 'util/errorhandling';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    private affiliateService: AffiliateService,
    private kycService: KycService,
  ) {}

  async getAllUsers() {
    try {
      const users = await this.userModel.find().exec();
      return new CustomResponse(200, 'All users fetched successfully', users);
    } catch (error) {
      throwException(error);
    }
  }

  async getAllTrades() {
    try {
      const trades = await this.tradeModel.find().exec();
      return new CustomResponse(200, 'All trades fetched successfully', trades);
    } catch (error) {
      throwException(error);
    }
  }

  async getCommissionsSummary() {
    try {
      const result = await this.tradeModel.aggregate([
        { $group: { _id: null, totalCommission: { $sum: '$commission' } } },
      ]);
      const summary = { totalCommission: result[0]?.totalCommission || 0 };
      return new CustomResponse(200, 'Commission summary fetched successfully', summary);
    } catch (error) {
      throwException(error);
    }
  }

  async approveKyc(userId: string, data: { status: string; reason?: string }) {
    try {
      const approved = await this.kycService.approve(userId, data);
      return approved;
    } catch (error) {
      throwException(error);
    }
  }

  async getAllAffiliates() {
    try {
      const affiliates = await this.userModel.find({ role: { $in: ['affiliate', 'sub_affiliate'] } }).exec();
      return new CustomResponse(200, 'All affiliates fetched successfully', affiliates);
    } catch (error) {
      throwException(error);
    }
  }

  async getTotalBonuses() {
    try {
      const result = await this.userModel.aggregate([{ $group: { _id: null, totalBonus: { $sum: '$bonusBalance' } } }]);
      const totalBonus = { totalBonus: result[0]?.totalBonus || 0 };
      return new CustomResponse(200, 'Total bonuses fetched successfully', totalBonus);
    } catch (error) {
      throwException(error);
    }
  }

  async approveAffiliate(userId: string) {
    try {
      const resp = await this.affiliateService.approveAffiliate(userId);
      return resp;
    } catch (error) {
      throwException(error);
    }
  }
}
