import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet } from './entities/wallet.entity';
import { UserService } from '../user/user.service';
import CustomResponse from 'providers/custom-response.service';
import CustomError from 'providers/customer-error.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    private userService: UserService,
  ) {}

  async deposit(data: { userId: string; amount: number; crypto: string }) {
    try {
      const fakeAddress = `fake-${data.crypto}-${Date.now()}`;

      // always store cryptoType as UPPERCASE to keep consistency
      const cryptoType = (data.crypto || '').toUpperCase();

      const userIdObj = Types.ObjectId.isValid(data.userId)
        ? new Types.ObjectId(data.userId)
        : data.userId;

      const wallet = new this.walletModel({
        userId: userIdObj,
        cryptoType,
        amount: data.amount,
        address: fakeAddress,
        type: 'deposit',
        status: 'completed',
      });

      await wallet.save();

      // update main numeric balance (USDT-based)
      await this.updateBalance(data.userId, data.amount);

      return new CustomResponse(200, 'Deposit successful', wallet);
    } catch (error: any) {
      return new CustomError(500, error.message);
    }
  }

  async withdraw(
    userId: string,
    data: { crypto: string; amount: number; address: string },
  ) {
    try {
      const balanceResp: any = await this.getBalance(userId);
      const balance = balanceResp?.result ?? {};

      const cryptoType = (data.crypto || '').toUpperCase();

      // allow 0 and negative checks correctly
      const available = typeof balance[cryptoType] === 'number' ? balance[cryptoType] : 0;

      if (!available || available < data.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const fakeTx = `tx-${Date.now()}`;

      const userIdObj = Types.ObjectId.isValid(userId)
        ? new Types.ObjectId(userId)
        : userId;

      await this.walletModel.create({
        userId: userIdObj,
        cryptoType,
        amount: -data.amount,
        address: data.address,
        txHash: fakeTx,
        type: 'withdraw',
        status: 'pending',
      });

      // update main balance (USDT-based)
      await this.updateBalance(userId, -data.amount);

      return new CustomResponse(200, 'Withdrawal initiated', { txHash: fakeTx });
    } catch (error: any) {
      return new CustomError(500, error.message);
    }
  }

  async getBalance(userId: string) {
    try {
      const userIdObj = Types.ObjectId.isValid(userId)
        ? new Types.ObjectId(userId)
        : userId;

      const result = await this.walletModel.aggregate([
        { $match: { userId: userIdObj } },
        { $group: { _id: '$cryptoType', total: { $sum: '$amount' } } },
      ]);

      const balance: Record<string, number> = {};

      // Normalize results: keys expected UPPERCASE
      result.forEach((r: any) => {
        const key = (r._id || '').toString().toUpperCase();
        balance[key] = Number(r.total) || 0;
      });

      // Ensure defaults (explicitly set 0 if missing)
      ['USDT', 'BTC', 'ETH', 'BNB'].forEach((c) => {
        if (typeof balance[c] !== 'number') balance[c] = 0;
      });

      return new CustomResponse(200, 'Balance fetched', balance);
    } catch (error: any) {
      return new CustomError(500, error.message);
    }
  }

  async updateBalance(userId: string, delta: number) {
    try {
      const userResp: any = await this.userService.findById(userId);
      const user = userResp?.result;

      if (!user) throw new BadRequestException('User not found');

      user.balance = (user.balance || 0) + delta;
      await user.save();

      return new CustomResponse(200, 'Balance updated', {
        balance: user.balance,
      });
    } catch (error: any) {
      return new CustomError(500, error.message);
    }
  }

  async updatePnL(userId: string, pnl: number) {
    try {
      const userResp: any = await this.userService.findById(userId);
      const user = userResp?.result;

      if (!user) throw new BadRequestException('User not found');

      user.totalPnL = (user.totalPnL || 0) + pnl;
      await user.save();

      return new CustomResponse(200, 'PnL updated', {
        totalPnL: user.totalPnL,
      });
    } catch (error: any) {
      return new CustomError(500, error.message);
    }
  }
}
