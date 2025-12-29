import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SignalDocument = Signal & Document;

@Schema({ timestamps: true })
export class Signal {
  @Prop({ required: true })
  asset: string;

  @Prop({ enum: ['BUY', 'SELL'], required: true })
  direction: 'BUY' | 'SELL';

  @Prop({ required: true })
  expiry: number;

  @Prop({ required: true })
  entryPrice: number;

  @Prop()
  closePrice?: number;

  @Prop()
  closeTime?: Date;

  @Prop({ default: false })
  executed: boolean;

  @Prop({
    enum: ['RUNNING', 'PROFIT', 'LOSS'],
    default: 'RUNNING',
  })
  result: 'RUNNING' | 'PROFIT' | 'LOSS';
}

export const SignalSchema = SchemaFactory.createForClass(Signal);
