// src/models/Donation.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IDonation extends Document {
  donor_uid: string;
  amount: number;
  currency: string;
  cause: string;
  transaction_ref: string;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method?: string;
  payment_metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

const DonationSchema = new Schema<IDonation>({
  donor_uid: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'UGX' },
  cause: { type: String, required: true },
  transaction_ref: { type: String, required: true, unique: true },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  payment_method: { type: String },
  payment_metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

DonationSchema.index({ donor_uid: 1, created_at: -1 });
DonationSchema.index({ transaction_ref: 1 });

export const Donation = mongoose.model<IDonation>('Donation', DonationSchema);
