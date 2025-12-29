import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type UserWalletDocument = UserWallet & Document;

@Schema({ timestamps: true })
export class UserWallet {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  balance: number;
}

export const UserWalletSchema = SchemaFactory.createForClass(UserWallet);
