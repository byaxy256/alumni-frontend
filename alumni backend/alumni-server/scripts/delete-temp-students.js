// scripts/delete-temp-students.js
// Deletes temporary test students
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni';

// Schema definitions
const UserSchema = new mongoose.Schema({
  uid: String,
  full_name: String,
  email: String,
  role: String,
  meta: Object,
}, { collection: 'users' });

const MentorAssignmentSchema = new mongoose.Schema({
  student_uid: String,
  mentor_uid: String,
  field: String,
  status: String,
}, { collection: 'mentorassignments' });

const User = mongoose.model('User', UserSchema);
const MentorAssignment = mongoose.model('MentorAssignment', MentorAssignmentSchema);

async function deleteTempStudents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!\n');

    // Find all temporary/test students
    const tempStudents = await User.find({
      role: 'student',
      full_name: { $regex: /^(Tmp|Test|temp|test)/i }
    });

    if (tempStudents.length === 0) {
      console.log('✅ No temporary students found');
      return;
    }

    console.log(`Found ${tempStudents.length} temporary students:\n`);
    tempStudents.forEach(s => {
      console.log(`  - ${s.full_name} (${s.uid}) - ${s.email}`);
    });

    console.log('\n=== Deleting temporary students ===\n');

    let deletedUsers = 0;
    let deletedAssignments = 0;

    for (const student of tempStudents) {
      // Delete mentor assignments
      const assignments = await MentorAssignment.deleteMany({
        $or: [
          { student_uid: student.uid },
          { mentor_uid: student.uid }
        ]
      });
      deletedAssignments += assignments.deletedCount;

      // Delete user
      await User.deleteOne({ uid: student.uid });
      deletedUsers++;

      console.log(`✅ Deleted: ${student.full_name} (${student.uid})`);
      if (assignments.deletedCount > 0) {
        console.log(`   └─ Removed ${assignments.deletedCount} mentor assignment(s)`);
      }
    }

    console.log(`\n✨ Cleanup complete!`);
    console.log(`   Deleted ${deletedUsers} users`);
    console.log(`   Deleted ${deletedAssignments} mentor assignments`);

    // Show remaining students
    const remainingStudents = await User.countDocuments({ role: 'student' });
    console.log(`\n📊 Remaining students: ${remainingStudents}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

deleteTempStudents();
