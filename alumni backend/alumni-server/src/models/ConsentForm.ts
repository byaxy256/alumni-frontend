// src/models/ConsentForm.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IConsentForm extends Document {
  student_uid: string;
  student_name: string;
  student_id?: string;
  form_type: 'chop_consent' | 'loan_agreement' | 'data_privacy' | 'terms_conditions';
  content: string;
  signed: boolean;
  signed_at?: Date;
  ip_address?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

const ConsentFormSchema = new Schema<IConsentForm>({
  student_uid: { type: String, required: true, index: true },
  student_name: { type: String, required: true },
  student_id: { type: String },
  form_type: { 
    type: String, 
    required: true, 
    enum: ['chop_consent', 'loan_agreement', 'data_privacy', 'terms_conditions'] 
  },
  content: { type: String, required: true },
  signed: { type: Boolean, default: false },
  signed_at: { type: Date },
  ip_address: { type: String },
  metadata: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index for querying by student and form type
ConsentFormSchema.index({ student_uid: 1, form_type: 1 });

export const ConsentForm = mongoose.model<IConsentForm>('ConsentForm', ConsentFormSchema);
