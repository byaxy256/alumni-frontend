import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MongoDB URI not found');
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  
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

  // Your original credentials
  const adminEmail = 'admin@alumnicircle.com';
  const adminPassword = 'Admin@2026';

  const hashed = await bcrypt.hash(adminPassword, 10);

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      uid: `admin_${Date.now()}`,
      full_name: 'System Administrator',
      email: adminEmail,
      password: hashed,
      phone: '256700000000',
      role: 'admin',
      meta: { approved: true },
      updated_at: new Date()
    },
    { upsert: true, new: true }
  );

  console.log('✅ Admin credentials updated in database\n');
  console.log('📧 Email:    ' + adminEmail);
  console.log('🔐 Password: ' + adminPassword);
  console.log('\n✅ Ready to login!\n');

  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
