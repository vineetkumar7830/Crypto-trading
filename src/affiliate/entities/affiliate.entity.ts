import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Affiliate extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
    default: () =>
      'AFF_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
  })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'Affiliate', default: null })
  parentAffiliateId: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  referredUsers: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Affiliate', default: [] })
  subAffiliates: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  totalCommission: number;

  @Prop({ type: Number, default: 0 })
  withdrawable: number;

  @Prop({
    type: [
      {
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        source: { type: String, required: true },
        description: { type: String, default: '' },
        date: { type: Date, default: Date.now },
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
  }[];
}

export const AffiliateSchema = SchemaFactory.createForClass(Affiliate);

// IMPORTANT: if you previously had an index on 'referralCode' that allowed nulls and caused E11000,
// either remove that index in DB or create a partial index that enforces uniqueness only when the field is a string.
AffiliateSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: 'string' } } },
);

// If you have legacy 'referralCode' field/index in DB, drop it or recreate with:
// db.affiliates.dropIndex('referralCode_1')
// then optionally create a partial unique index for referralCode if you still need it:
// db.affiliates.createIndex({ referralCode: 1 }, { unique: true, partialFilterExpression: { referralCode: { $type: 'string' } } })
