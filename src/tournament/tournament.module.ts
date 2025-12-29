import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';

import {
  UserWallet,
  UserWalletSchema,
} from './entities/user-wallet.schema';
import {
  Tournament,
  TournamentSchema,
} from './entities/tournament.entity';
import {
  TournamentWallet,
  TournamentWalletSchema,
} from './entities/tournament-wallet.schema';
import {
  UserTournamentWallet,
  UserTournamentWalletSchema,
} from './entities/user-tournament-wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserWallet.name, schema: UserWalletSchema },
      { name: Tournament.name, schema: TournamentSchema },
      {
        name: TournamentWallet.name,
        schema: TournamentWalletSchema,
      },
      {
        name: UserTournamentWallet.name,
        schema: UserTournamentWalletSchema,
      },
    ]),
  ],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}
