import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet } from './entities/wallet.entity';
import { UserService } from '../user/user.service';
import CustomResponse from 'providers/custom-response.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  // ================= CREATE WALLET =================
  async createWallet(userId: string) {
    const exist = await this.walletModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (exist) return exist;

    return this.walletModel.create({
      userId: new Types.ObjectId(userId),
      cryptoType: 'USDT',
      amount: 0,
      type: 'deposit',
      status: 'completed',
      address: `wallet-${Date.now()}`,
    });
  }

  // ================= DEPOSIT =================
  async deposit(data: { userId: string; amount: number | string; crypto?: string }) {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Invalid deposit amount');
    }

    const userResp: any = await this.userService.findById(data.userId);
    const user = userResp?.result;
    if (!user) throw new BadRequestException('User not found');

    const beforeBalance = user.balance || 0;
    user.balance = beforeBalance + amount;
    await user.save();

    await this.walletModel.create({
      userId: new Types.ObjectId(data.userId),
      cryptoType: data.crypto || 'USDT',
      amount,
      type: 'deposit',
      status: 'completed',
      address: `deposit-${Date.now()}`,
    });

    return new CustomResponse(200, 'Deposit successful', {
      depositedAmount: amount,
      previousBalance: beforeBalance,
      balance: user.balance,
    });
  }

  // ================= WITHDRAW =================
  async withdraw(
    userId: string,
    data: { amount: number | string; address: string; crypto?: string },
  ) {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Invalid withdraw amount');
    }

    const userResp: any = await this.userService.findById(userId);
    const user = userResp?.result;
    if (!user) throw new BadRequestException('User not found');

    if ((user.balance || 0) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const beforeBalance = user.balance;
    user.balance = beforeBalance - amount;
    await user.save();

    await this.walletModel.create({
      userId: new Types.ObjectId(userId),
      cryptoType: data.crypto || 'USDT',
      amount: -amount,
      type: 'withdraw',
      status: 'completed',
      address: data.address,
    });

    return new CustomResponse(200, 'Withdraw successful', {
      withdrawnAmount: amount,
      previousBalance: beforeBalance,
      balance: user.balance,
    });
  }

  // ================= BALANCE =================
  async getBalance(userId: string) {
    const userResp: any = await this.userService.findById(userId);
    const user = userResp?.result;
    if (!user) throw new BadRequestException('User not found');

    return new CustomResponse(200, 'Balance fetched', {
      balance: user.balance || 0,
      lockedBalance: user.lockedBalance || 0,
      total: (user.balance || 0) + (user.lockedBalance || 0),
    });
  }

  // ================= LOCK BALANCE =================
  async lockBalance(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Invalid lock amount');
    }

    const userResp: any = await this.userService.findById(userId);
    const user = userResp?.result;
    if (!user) throw new BadRequestException('User not found');

    if ((user.balance || 0) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    user.balance -= amount;
    user.lockedBalance = (user.lockedBalance || 0) + amount;
    await user.save();

    await this.walletModel.create({
      userId: new Types.ObjectId(userId),
      cryptoType: 'USDT',
      amount: -amount,
      type: 'lock',
      status: 'completed',
      address: `trade-lock-${Date.now()}`,
    });
  }

  // ================= UNLOCK BALANCE (🔥 REAL FIX HERE) = = = = = = = = = = = = = = = = =
  async unlockBalance(userId: string, stake: number, profitLoss: number) {
    const userResp: any = await this.userService.findById(userId);
    const user = userResp?.result;
    if (!user) throw new BadRequestException('User not found');

    stake = Number(stake);
    profitLoss = Number(profitLoss);

    // ✅ locked balance safely release (return hata diya)
    if ((user.lockedBalance || 0) >= stake) {
      user.lockedBalance -= stake;
    } else {
      user.lockedBalance = 0;
    }

    /**
     * PROFIT:
     *   stake + profitLoss → balance me add
     * LOSS:
     *   creditAmount = 0 → balance same rahega
     */
    const creditAmount = stake + profitLoss;

    if (creditAmount > 0) {
      user.balance = (user.balance || 0) + creditAmount;
    }

    user.totalProfit = (user.totalProfit || 0) + profitLoss;
    await user.save();

    await this.walletModel.create({
      userId: new Types.ObjectId(userId),
      cryptoType: 'USDT',
      amount: creditAmount,
      type: 'unlock',
      status: 'completed',
      address: `trade-unlock-${Date.now()}`,
    });
  }

  // ================= WALLET HISTORY =================
  async getWalletHistory(userId: string) {
    const history = await this.walletModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: 1 });

    const formatted = history.map((item) => ({
      id: item._id,
      type: item.type,
      title:
        item.type === 'deposit'
          ? 'Deposit'
          : item.type === 'withdraw'
          ? 'Withdraw'
          : item.type === 'lock'
          ? 'Trade Locked'
          : 'Trade Unlocked',
      amount: item.amount,
      cryptoType: item.cryptoType,
      status: item.status,
      address: item.address,
      createdAt: item.createdAt,
    }));

    return new CustomResponse(200, 'Wallet history fetched', {
      deposit: formatted.filter((i) => i.type === 'deposit'),
      withdraw: formatted.filter((i) => i.type === 'withdraw'),
      tradeLock: formatted.filter((i) => i.type === 'lock'),
      tradeUnlock: formatted.filter((i) => i.type === 'unlock'),
      all: formatted,
    });
  }
}
