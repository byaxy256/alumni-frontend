import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MongoDB URI not found in environment');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');

try {
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const userSchema = new mongoose.Schema({
    uid: String,
    full_name: String,
    email: { type: String, unique: true, sparse: true },
    password: String,
    phone: String,
    role: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    meta: mongoose.Schema.Types.Mixed
  });

  const User = mongoose.model('users', userSchema);

  // Admin credentials
  const adminEmail = 'admin@alumnicircle.local';
  const adminPassword = 'Admin@2026!Secure';
  const adminName = 'System Administrator';

  console.log('\n📝 Creating/Updating Admin User...');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Name: ${adminName}`);

  const hashed = await bcrypt.hash(adminPassword, 10);

  const result = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      uid: `admin_${Date.now()}`,
      full_name: adminName,
      email: adminEmail,
      password: hashed,
      phone: '256700000000',
      role: 'admin',
      meta: { approved: true },
      updated_at: new Date()
    },
    { upsert: true, new: true }
  );

  console.log('\n✅ Admin user created/updated successfully!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('LOGIN CREDENTIALS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📧 Email:    ${adminEmail}`);
  console.log(`🔐 Password: ${adminPassword}`);
  console.log('═══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
