import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Wallet extends Document {
  @Prop() userId: string;
  @Prop() cryptoType: string;
  @Prop() amount: number;
  @Prop() address: string;
  @Prop() txHash?: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);