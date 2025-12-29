import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { UserWallet } from './entities/user-wallet.schema';
import { Tournament } from './entities/tournament.entity';
import { TournamentWallet } from './entities/tournament-wallet.schema';
import { UserTournamentWallet } from './entities/user-tournament-wallet.schema';

export type DurationUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export interface IUserWallet extends Document {
  userId: Types.ObjectId;
  balance: number;
}

@Injectable()
export class TournamentService {
  constructor(
    @InjectModel(UserWallet.name) private userWalletModel: Model<IUserWallet>,
    @InjectModel(Tournament.name) private tournamentModel: Model<Tournament>,
    @InjectModel(TournamentWallet.name) private tournamentWalletModel: Model<TournamentWallet>,
    @InjectModel(UserTournamentWallet.name)
    private userTournamentWalletModel: Model<UserTournamentWallet>,
  ) {}

  // ================= GET USER WALLET =================
  async getUserWallet(userId: string): Promise<IUserWallet> {
    const uId = new Types.ObjectId(userId);
    let wallet = await this.userWalletModel.findOne({ userId: uId });
    if (!wallet) {
      wallet = await this.userWalletModel.create({ userId: uId, balance: 10000 });
    }
    return wallet;
  }

  // ================= CREATE TOURNAMENT =================
  async createTournament(data: {
    name: string;
    entryAmount: number;
    duration: number;
    durationUnit: DurationUnit;
  }) {
    const tournament = await this.tournamentModel.create({
      ...data,
      status: 'upcoming',
    });
    return { status: 201, message: 'Tournament created', result: tournament };
  }

  // ================= JOIN TOURNAMENT =================
  async joinTournament(userId: string, tournamentId: string) {
    const tId = new Types.ObjectId(tournamentId);
    const uId = new Types.ObjectId(userId);

    const tournament = await this.tournamentModel.findById(tId);
    if (!tournament) throw new BadRequestException('Tournament not found');
    if (tournament.status !== 'upcoming') throw new BadRequestException('Tournament already started');

    const alreadyJoined = await this.userTournamentWalletModel.findOne({ userId: uId, tournamentId: tId });
    if (alreadyJoined) throw new BadRequestException('Already joined tournament');

    const userWallet = await this.getUserWallet(userId);
    if (userWallet.balance < tournament.entryAmount) throw new BadRequestException('Insufficient balance');

    userWallet.balance -= tournament.entryAmount;
    await userWallet.save();

    let tournamentWallet = await this.tournamentWalletModel.findOne({ tournamentId: tId });
    if (!tournamentWallet) {
      tournamentWallet = await this.tournamentWalletModel.create({
        tournamentId: tId,
        balance: tournament.entryAmount,
      });
    } else {
      tournamentWallet.balance += tournament.entryAmount;
      await tournamentWallet.save();
    }

    const userTournamentWallet = await this.userTournamentWalletModel.create({
      userId: uId,
      tournamentId: tId,
      investedAmount: tournament.entryAmount,
      currentBalance: tournament.entryAmount,
      profitLoss: 0,
    });

    return { status: 200, message: 'Joined tournament successfully', result: userTournamentWallet };
  }

  // ================= START TOURNAMENT =================
  async startTournament(tournamentId: string) {
    const tId = new Types.ObjectId(tournamentId);
    const tournament = await this.tournamentModel.findById(tId);
    if (!tournament) throw new BadRequestException('Tournament not found');
    if (tournament.status !== 'upcoming') throw new BadRequestException('Tournament already started');

    const now = new Date();
    tournament.startTime = now;
    tournament.endTime = new Date(now.getTime() + this.getDurationMs(tournament['duration'], tournament['durationUnit']));
    tournament.status = 'running';
    await tournament.save();

    this.autoEndTournament(tournament._id.toString(), tournament.endTime);

    return {
      status: 200,
      message: 'Tournament started',
      startTime: tournament.startTime,
      endTime: tournament.endTime,
      statusText: tournament.status,
    };
  }

  // ================= CONVERT DURATION TO MS =================
  private getDurationMs(duration: number, unit: DurationUnit): number {
    switch (unit) {
      case 'seconds': return duration * 1000;
      case 'minutes': return duration * 60 * 1000;
      case 'hours': return duration * 60 * 60 * 1000;
      case 'days': return duration * 24 * 60 * 60 * 1000;
      default: return duration * 60 * 1000;
    }
  }

  // ================= AUTO END TOURNAMENT =================
  private autoEndTournament(tournamentId: string, endTime: Date) {
    const delay = endTime.getTime() - Date.now();
    if (delay <= 0) return;

    setTimeout(async () => {
      const tournament = await this.tournamentModel.findById(tournamentId);
      if (!tournament || tournament.status !== 'running') return;
      await this.endTournament(tournamentId);
    }, delay);
  }

  // ================= END TOURNAMENT =================
  async endTournament(tournamentId: string) {
    const tId = new Types.ObjectId(tournamentId);
    const tournament = await this.tournamentModel.findById(tId);
    if (!tournament || tournament.status === 'ended') return;

    const users = await this.userTournamentWalletModel.find({ tournamentId: tId });

    let tournamentWallet = await this.tournamentWalletModel.findOne({ tournamentId: tId });
    if (!tournamentWallet) {
      tournamentWallet = await this.tournamentWalletModel.create({ tournamentId: tId, balance: 0 });
    }

    const totalPool = tournamentWallet.balance;
    const rewardPercents = [30, 20, 15, 10, 8, 6, 4, 3, 2, 2];

    users.sort((a, b) => b.profitLoss - a.profitLoss);

    for (let i = 0; i < users.length; i++) {
      const userWallet = await this.getUserWallet(users[i].userId.toString());
      if (!userWallet) continue;

      if (i < rewardPercents.length) {
        userWallet.balance += (totalPool * rewardPercents[i]) / 100;
      } else {
        userWallet.balance += users[i].currentBalance;
      }
      await userWallet.save();
    }

    tournamentWallet.balance = 0;
    await tournamentWallet.save();

    tournament.status = 'ended';
    await tournament.save();

    return { status: 200, message: 'Tournament ended & settled successfully' };
  }

  // ================= GET TOURNAMENT STATUS BY ID =================
  async getTournamentStatus(tournamentId: string) {
    const tId = new Types.ObjectId(tournamentId);
    const tournament = await this.tournamentModel.findById(tId);
    if (!tournament) throw new BadRequestException('Tournament not found');

    const now = new Date();

    if (tournament.endTime && tournament.endTime <= now) {
      if (tournament.status !== 'ended') {
        tournament.status = 'ended';
        await tournament.save();
      }
    } else if (tournament.startTime && tournament.startTime <= now) {
      if (tournament.status !== 'running') {
        tournament.status = 'running';
        await tournament.save();
      }
    } else {
      if (tournament.status !== 'upcoming') {
        tournament.status = 'upcoming';
        await tournament.save();
      }
    }

    // Return full tournament info
    return {
      tournamentId: tournament._id,
      name: tournament.name,
      status: tournament.status,
      entryAmount: tournament.entryAmount,
      duration: tournament.duration,
      durationUnit: tournament.durationUnit,
      startTime: tournament.startTime,
      endTime: tournament.endTime,
    };
  }

  // ================= GET ACTIVE TOURNAMENT =================
  async getActive(): Promise<Tournament & { _id: Types.ObjectId } | null> {
    return this.tournamentModel.findOne({ status: 'running' }) as any;
  }

  // ================= GET ALL TOURNAMENTS =================
  async getAllTournaments() {
    const tournaments = await this.tournamentModel.find().sort({ createdAt: -1 });
    return { status: 200, message: 'All tournaments', result: tournaments };
  }
}
