import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Trade extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  symbol: string;

  @Prop({ enum: ['buy', 'sell'], required: true })
  type: 'buy' | 'sell';

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  entryPrice: number;

  @Prop()
  exitPrice?: number;

  @Prop({ enum: ['open', 'closed'], default: 'open' })
  status: 'open' | 'closed';


  @Prop({ required: true })
  durationValue: number;

  @Prop({ enum: ['seconds', 'minutes', 'hours', 'days'], required: true })
  durationUnit: 'seconds' | 'minutes' | 'hours' | 'days';

  @Prop({ required: true })
  expiryTime: Date;

  @Prop({ default: 0 })
  profitLoss: number;

  @Prop({ enum: ['profit', 'loss'], default: null })
  result?: 'profit' | 'loss';

  @Prop()
  closedAt?: Date;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
