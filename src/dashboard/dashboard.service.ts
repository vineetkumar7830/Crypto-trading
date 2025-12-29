import { Injectable, Logger } from '@nestjs/common';
import { TradeService } from '../trade/trade.service';
import { WalletService } from '../wallet/wallet.service';
import { UserService } from '../user/user.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import CustomResponse from 'providers/custom-response.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger('DashboardService');

  constructor(
    private readonly trades: TradeService,
    private readonly wallets: WalletService,
    private readonly users: UserService,
    private readonly affiliates: AffiliateService,
  ) {}

  private unwrap(resp: any) {
    if (!resp) return null;
    if (resp instanceof CustomResponse) return resp.result;
    if (resp?.result !== undefined) return resp.result;
    return resp;
  }

  async getFullDashboard(userId: string) {
    try {
      const userResp = await this.users.findById(userId);
      const user = this.unwrap(userResp);
      if (!user) throw new Error('User not found');

      const walletResp = await this.wallets.getBalance(userId);
      const wallet = this.unwrap(walletResp) || {};

      const totalBalance = wallet.totalBalance || 0;

      // Fetch trades
      const openTradesResp = await this.trades.getOpenTrades(userId);
      const closedTradesResp = await this.trades.getClosedTrades(userId);

      const trades = [
        ...(this.unwrap(openTradesResp) || []),
        ...(this.unwrap(closedTradesResp) || []),
      ];

      const profitLoss = trades.reduce((acc, t: any) => acc + (t.profitLoss || 0), 0);

      return new CustomResponse(200, 'Dashboard fetched successfully', {
        userId,
        userInfo: user,
        portfolio: {
          totalBalance,
          profitLoss,
        },
        trades,
      });
    } catch (err: any) {
      this.logger.error('DASHBOARD ERROR', err.stack ?? err.message ?? err);
      throw err;
    }
  }

  async getAffiliateDashboard(userId: string) {
    const affiliateResp = await this.affiliates.ensureAffiliate(userId);
    const affiliate = this.unwrap(affiliateResp) ?? affiliateResp;

    return new CustomResponse(200, 'Affiliate dashboard fetched', {
      referralsCount: affiliate.referredUsers?.length || 0,
      totalCommission: affiliate.totalCommission || 0,
      withdrawable: affiliate.withdrawable || 0,
      commissionDetails: affiliate.commissionHistory || [],
    });
  }
}
  