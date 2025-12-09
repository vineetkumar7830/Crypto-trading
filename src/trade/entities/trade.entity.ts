import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Trade extends Document {
  
  @Prop() userId: string;
  @Prop({ enum: ['buy', 'sell'] }) type: string;
  @Prop() symbol: string;
  @Prop() quantity: number;
  @Prop() price: number;
  @Prop() entryPrice: number;
  @Prop() expiryTime?: Date;
  @Prop({ enum: ['open', 'closed'] }) status: string;
  @Prop() profitLoss?: number;
  @Prop() stopLoss?: number;
  @Prop() takeProfit?: number;
  @Prop() txHash?: string;
  @Prop() exitPrice?: number;
  @Prop()closeReason?: string;
  
  @Prop({ default: false }) isPublic: boolean; 
}

export const TradeSchema = SchemaFactory.createForClass(Trade);