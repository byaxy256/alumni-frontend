import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectMongoDB } from '../src/mongodb.js';
import { User } from '../src/models/User.js';

dotenv.config();

function generatePassword(length = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function main() {
  const connected = await connectMongoDB();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB');
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@alumnicircle.local').trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || generatePassword()).trim();
  const fullName = (process.env.ADMIN_FULL_NAME || 'Admin User').trim();
  const phone = (process.env.ADMIN_PHONE || '').trim();

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD are required');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.full_name = fullName || existing.full_name;
    if (phone) existing.phone = phone;
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
      phone,
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
  console.log('If you did not set ADMIN_PASSWORD, a random one was generated above.');
}

main().catch((err) => {
  console.error('❌ create-admin failed:', err);
  process.exit(1);
});
