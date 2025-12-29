import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Affiliate extends Document {
  // User who owns this affiliate account
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // Unique affiliate code
  @Prop({
    type: String,
    required: true,
    unique: true,
    default: () =>
      'AFF_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  })
  code: string;

  // Parent Affiliate (Level 1)
  @Prop({ type: Types.ObjectId, ref: 'Affiliate', default: null })
  parentAffiliateId: Types.ObjectId | null;

  // All users referred by this affiliate
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  referredUsers: Types.ObjectId[];

  // All sub-affiliate accounts created under this affiliate
  @Prop({ type: [Types.ObjectId], ref: 'Affiliate', default: [] })
  subAffiliates: Types.ObjectId[];

  // Total commission earned by this affiliate
  @Prop({ type: Number, default: 0 })
  totalCommission: number;

  @Prop({ type: Number, default: 0 })
  withdrawable: number;

  // Commission history
  @Prop({
    type: [
      {
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        source: { type: String, required: true },
        description: { type: String, default: '' },
        date: { type: Date, default: Date.now },
        fromUserId: { type: Types.ObjectId, ref: 'User', default: null },
      },
    ],
    default: [],
  })
  commissionHistory: {
    amount: number;
    type: string;
    source: string;
    description: string;
    date: Date;
    fromUserId: Types.ObjectId | null;
  }[];
}

export const AffiliateSchema = SchemaFactory.createForClass(Affiliate);

// Unique code index with partial filter (avoid duplicate nulls)
AffiliateSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: 'string' } } },
);

AffiliateSchema.index({ userId: 1 });
AffiliateSchema.index({ parentAffiliateId: 1 });
AffiliateSchema.index({ referredUsers: 1 });
AffiliateSchema.index({ subAffiliates: 1 });
