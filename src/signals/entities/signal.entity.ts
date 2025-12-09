import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Signals extends Document {
  @Prop() symbol: string;
  @Prop() signalType: 'buy' | 'sell';
  @Prop() targetPrice: number;
  @Prop() stopLoss: number;
  @Prop() createdAt: Date;
  @Prop({ type: [String] }) subscribers: string[];
}

export const SignalsSchema = SchemaFactory.createForClass(Signals);
