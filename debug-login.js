// Debug script to check user and password issues
// Save this as debug-login.js and run: node debug-login.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectAndDebug = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('./models/User');

    // Check if admin user exists
    console.log('\n🔍 Checking admin user...');
    const adminUser = await User.findOne({ email: 'admin@hospital.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('Available users:');
      const allUsers = await User.find({}, 'email fullName role');
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - ${user.fullName}`);
      });
    } else {
      console.log('✅ Admin user found:');
      console.log(`- Email: ${adminUser.email}`);
      console.log(`- Name: ${adminUser.fullName}`);
      console.log(`- Role: ${adminUser.role}`);
      console.log(`- Active: ${adminUser.isActive}`);
      
      // Test password comparison
      console.log('\n🔐 Testing password...');
      const isPasswordValid = await adminUser.comparePassword('admin123');
      console.log(`Password 'admin123' is valid: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log('❌ Password comparison failed!');
        console.log('Stored password hash:', adminUser.password);
        
        // Test bcrypt directly
        const testHash = await bcrypt.hash('admin123', 12);
        const directTest = await bcrypt.compare('admin123', adminUser.password);
        console.log(`Direct bcrypt test: ${directTest}`);
        
        // Check if password was properly hashed during seeding
        const rehashed = await bcrypt.hash('admin123', 12);
        console.log('New hash for comparison:', rehashed);
      } else {
        console.log('✅ Password is correct!');
      }
    }

    // Test the actual login logic
    console.log('\n🧪 Testing login logic...');
    const testUser = await User.findOne({ email: 'admin@hospital.com' }).select('+password');
    if (testUser && await testUser.comparePassword('admin123')) {
      console.log('✅ Login logic should work');
    } else {
      console.log('❌ Login logic is failing');
      
      if (!testUser) {
        console.log('User not found with password field selected');
      } else {
        console.log('Password comparison failed in login test');
      }
    }

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

connectAndDebug();