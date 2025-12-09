import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Price extends Document {
  @Prop() symbol: string;
  @Prop() customPrice: number;

  @Prop() basePrice?: number;      
  @Prop() currentPrice?: number;    
  @Prop() updatedAt?: Date;
}

export const PriceSchema = SchemaFactory.createForClass(Price);
