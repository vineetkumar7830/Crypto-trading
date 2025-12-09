import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Social extends Document {
  @Prop() userId: string;
  @Prop() tradeId: string; 
  @Prop() message: string;  
  @Prop({ default: 0 }) likes: number;
  @Prop({ type: [{ type: String }] }) comments: { userId: string; text: string }[];
}
export const SocialSchema = SchemaFactory.createForClass(Social);