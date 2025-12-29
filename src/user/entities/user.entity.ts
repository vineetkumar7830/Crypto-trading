import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 0 })
  totalPnL: number;

  @Prop({ unique: true })
  affiliateCode: string;

  @Prop({ default: null })
  parentAffiliate?: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: 0 })
  commissionRate: number;

  @Prop({ type: [String], default: [] })
  followers: string[];

  @Prop({ type: [String], default: [] })
  following: string[];

  @Prop({ default: true })
  allowCopying: boolean;

  @Prop({
    type: {
      autoCopy: { type: Boolean, default: false },
      riskPercent: { type: Number, default: 100 },
      maxTrades: { type: Number, default: 10 },
    },
    default: () => ({ autoCopy: false, riskPercent: 100, maxTrades: 10 }),
  })
  copySettings: {
    autoCopy: boolean;
    riskPercent: number;
    maxTrades: number;
  };

  @Prop()
  twoFactorSecret?: string;

  @Prop({ type: Object })
  kyc?: { status: string; docs: string };

  @Prop({
    type: [{ code: String, discount: Number }],
    default: [],
  })
  promoCodes: { code: string; discount: number }[];
}

export const UserSchema = SchemaFactory.createForClass(User);
