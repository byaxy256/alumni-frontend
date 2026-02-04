#!/usr/bin/env node
// Seed admin user - no TypeScript, no env var quoting issues
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGODB_URI) {
  console.error('❌ No MONGODB_URI or MONGO_URI found in .env');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  uid: String,
  full_name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: String,
  meta: Object,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
  });
  console.log('✅ Connected to MongoDB');

  const email = 'admin@alumnicircle.com';
  const password = 'Admin@2026!';
  const fullName = 'Alumni Circle Admin';

  const hashed = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.full_name = fullName;
    existing.password = hashed;
    existing.role = 'admin';
    await existing.save();
    console.log('✅ Updated existing admin user');
  } else {
    const uid = `admin_${Date.now()}`;
    await User.create({
      uid,
      full_name: fullName,
      email,
      phone: '',
      password: hashed,
      role: 'admin',
      meta: {},
    });
    console.log('✅ Created new admin user');
  }

  console.log('--- Admin login credentials ---');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Role: admin');
  console.log('--------------------------------');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
