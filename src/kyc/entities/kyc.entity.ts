import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Kyc extends Document {
  @Prop() userId: string;
  @Prop() status: string;
  @Prop() docs: string; 
  @Prop() reason?: string;
}

export const KycSchema = SchemaFactory.createForClass(Kyc);