import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type UserTournamentWalletDocument = UserTournamentWallet & Document;

@Schema({ timestamps: true })
export class UserTournamentWallet {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  tournamentId: Types.ObjectId;

  @Prop({ required: true })
  investedAmount: number;

  @Prop({ default: 0 })
  currentBalance: number;

  @Prop({ default: 0 })
  profitLoss: number;

  @Prop()
  closedAt?: Date; // optional, trade closed timestamp
}

export const UserTournamentWalletSchema =
  SchemaFactory.createForClass(UserTournamentWallet);
