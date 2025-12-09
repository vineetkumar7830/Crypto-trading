import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Notification extends Document {
  @Prop() userId: string;
  @Prop({ enum: ['email', 'sms', 'websocket'] }) type: string;
  @Prop() title: string;
  @Prop() message: string;
  @Prop({ default: false }) read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);