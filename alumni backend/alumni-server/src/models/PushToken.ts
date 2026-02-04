// src/models/PushToken.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPushToken extends Document {
  user_uid: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  topics: string[];
  created_at: Date;
  updated_at: Date;
}

const PushTokenSchema = new Schema<IPushToken>({
  user_uid: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  platform: { type: String, default: 'web', enum: ['web', 'ios', 'android'] },
  topics: { type: [String], default: [] },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

PushTokenSchema.index({ user_uid: 1, platform: 1 });

export const PushToken = mongoose.model<IPushToken>('PushToken', PushTokenSchema);
