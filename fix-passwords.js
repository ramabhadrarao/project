// fix-passwords.js - Run this to fix the password issue
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const fixPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('✅ Connected to MongoDB');

    // Test the current stored password hash
    const adminUser = await User.findOne({ email: 'admin@hospital.com' });
    console.log('Current stored hash:', adminUser.password);
    
    // Test bcrypt comparison directly
    const directTest = await bcrypt.compare('admin123', adminUser.password);
    console.log('Direct bcrypt test result:', directTest);
    
    // Check if the comparePassword method exists and works
    console.log('User comparePassword method exists:', typeof adminUser.comparePassword === 'function');
    
    if (typeof adminUser.comparePassword === 'function') {
      try {
        const methodTest = await adminUser.comparePassword('admin123');
        console.log('comparePassword method result:', methodTest);
      } catch (error) {
        console.log('comparePassword method error:', error.message);
      }
    }

    // Fix: Re-hash all passwords properly
    console.log('\n🔧 Fixing all user passwords...');
    
    const defaultPasswords = {
      'admin': 'admin123',
      'doctor': 'doctor123', 
      'patient': 'patient123'
    };

    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users to fix`);

    for (const user of allUsers) {
      let newPassword;
      
      if (user.role === 'admin') {
        newPassword = 'admin123';
      } else if (user.role === 'doctor') {
        newPassword = 'doctor123';
      } else if (user.role === 'patient') {
        newPassword = 'patient123';
      }

      if (newPassword) {
        // Hash password manually with bcrypt
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update user with the new hashed password (bypass mongoose middleware)
        await User.updateOne(
          { _id: user._id }, 
          { password: hashedPassword }
        );
        
        console.log(`✅ Fixed password for ${user.email} (${user.role})`);
        
        // Test the new password immediately
        const testUser = await User.findById(user._id);
        const testResult = await bcrypt.compare(newPassword, hashedPassword);
        console.log(`   Password test for ${user.email}: ${testResult}`);
      }
    }

    // Final verification
    console.log('\n🧪 Final verification...');
    const verifyAdmin = await User.findOne({ email: 'admin@hospital.com' });
    const finalTest = await bcrypt.compare('admin123', verifyAdmin.password);
    console.log(`Admin password verification: ${finalTest}`);

    if (finalTest) {
      console.log('✅ All passwords fixed successfully!');
    } else {
      console.log('❌ Password fix failed');
    }

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
};

fixPasswords();