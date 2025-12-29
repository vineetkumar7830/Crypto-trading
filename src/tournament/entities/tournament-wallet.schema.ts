import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type TournamentWalletDocument = TournamentWallet & Document;

@Schema({ timestamps: true })
export class TournamentWallet {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  tournamentId: Types.ObjectId;

  @Prop({ default: 0 })
  balance: number;
}

export const TournamentWalletSchema =
  SchemaFactory.createForClass(TournamentWallet);
