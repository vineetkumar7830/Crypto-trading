import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  cryptoType: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  address: string;
  
  @Prop({
    type: String,
    enum: ['deposit', 'withdraw', 'lock', 'unlock', 'balance-adjust'],
    required: true,
  })
  type: 'deposit' | 'withdraw' | 'lock' | 'unlock' | 'balance-adjust';

  @Prop({
    type: String,
    enum: ['completed', 'pending'],
    default: 'completed',
  })
  status: string;

  @Prop()
  txHash?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
