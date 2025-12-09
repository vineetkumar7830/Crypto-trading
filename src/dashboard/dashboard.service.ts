import { Injectable, Logger } from '@nestjs/common';
import { TradeService } from 'src/trade/trade.service';
import { WalletService } from 'src/wallet/wallet.service';
import { AffiliateService } from 'src/affiliate/affiliate.service';
import { UserService } from 'src/user/user.service';
import CustomResponse from 'providers/custom-response.service';
import { throwException } from 'util/errorhandling';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger('DashboardService');

  constructor(
    private readonly trades: TradeService,
    private readonly wallets: WalletService,
    private readonly affiliates: AffiliateService,
    private readonly users: UserService,
  ) {}

  // -------------------------
  // USER INFO
  // -------------------------
  async getUserInfo(userId: string) {
    try {
      const userResp = await this.users.findById(userId);

      if (!userResp || !userResp.result) return null;
      const user = userResp.result;

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        referralCode: user.affiliateCode,
        createdAt: user.createdAt,
      };
    } catch (err) {
      this.logger.error('User Info Error', err);
      return null;
    }
  }

  // -------------------------
  // PORTFOLIO
  // -------------------------
  async getPortfolio(userId: string) {
    try {
      const walletResp = await this.wallets.getBalance(userId);
      const balances = walletResp instanceof CustomResponse ? walletResp.result : {};

      const cryptos = ['USDT', 'BTC', 'ETH', 'BNB'];

      const balanceArray = cryptos.map((c) => ({
        crypto: c,
        available: balances[c] || 0,
        locked: 0,
      }));

      const totalValue = balanceArray.reduce(
        (sum, b) => sum + (b.available || 0),
        0,
      );

      return { totalValue, balances: balanceArray };
    } catch (err) {
      this.logger.error('Portfolio Error', err);
      return { totalValue: 0, balances: [] };
    }
  }

  // -------------------------
  // PNL CALCULATION
  // -------------------------
  async getPnL(userId: string) {
    try {
      const trades = await this.trades.getUserTrades(userId) || [];

      let totalBuy = 0;
      let totalSell = 0;

      for (const t of trades) {
        const amt = (t.entryPrice || 0) * (t.quantity || 0);
        if (t.type === 'buy') totalBuy += amt;
        if (t.type === 'sell') totalSell += amt;
      }

      return {
        totalBuy,
        totalSell,
        pnl: totalSell - totalBuy,
      };
    } catch (err) {
      this.logger.error('PnL Error', err);
      return { totalBuy: 0, totalSell: 0, pnl: 0 };
    }
  }

  // -------------------------
  // FEES
  // -------------------------
  async getFeeSummary(userId: string) {
    try {
      const trades = await this.trades.getUserTrades(userId) || [];
      let totalFees = 0;

      trades.forEach((t) => {
        totalFees += (t.makerFee || 0) + (t.takerFee || 0);
      });

      return { totalFees };
    } catch (err) {
      this.logger.error('Fee Error', err);
      return { totalFees: 0 };
    }
  }

  // -------------------------
  // AFFILIATE EARNINGS
  // -------------------------
  async getAffiliateEarnings(userId: string) {
    try {
      const stats = await this.affiliates.getTotalCommissionStats(userId) || {};
      const refResp = await this.affiliates.getReferrals(userId);
      const breakdown = await this.affiliates.getCommissionsByReferral(userId);

      return {
        totalCommission: stats.totalCommission || 0,
        withdrawable: stats.withdrawable || 0,
        referrals:
          refResp instanceof CustomResponse
            ? refResp.result?.referrals || []
            : [],
        commissionDetails:
          breakdown instanceof CustomResponse ? breakdown.result || [] : [],
      };
    } catch (err) {
      this.logger.error('Affiliate Error', err);
      return {
        totalCommission: 0,
        withdrawable: 0,
        referrals: [],
        commissionDetails: [],
      };
    }
  }

  // -------------------------
  // MAIN DASHBOARD
  // -------------------------
  async getFullDashboard(userId: string) {
    try {
      const [userInfo, portfolio, pnl, fees, affiliate] = await Promise.all([
        this.getUserInfo(userId),
        this.getPortfolio(userId),
        this.getPnL(userId),
        this.getFeeSummary(userId),
        this.getAffiliateEarnings(userId),
      ]);

      return new CustomResponse(200, 'Dashboard fetched successfully', {
        userId,
        userInfo,
        portfolio,
        pnl,
        fees,
        affiliate,
      });
    } catch (err) {
      this.logger.error('Full Dashboard Error', err);
      throwException(err);
    }
  }
}
