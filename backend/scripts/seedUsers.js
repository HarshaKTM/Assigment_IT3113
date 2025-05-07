const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// MongoDB Connection
const mongoURI = "mongodb+srv://harshakumara1998030944:reqlHarsha321@cluster0.pxpmmp5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const sampleUsers = [
  {
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user'
  },
  {
    username: 'janedoe',
    email: 'jane@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'user'
  },
  {
    username: 'admin',
    email: 'admin@bookstore.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding users');

    // Check if there are already users
    const existingUserCount = await User.countDocuments();
    if (existingUserCount > 0) {
      console.log(`${existingUserCount} users already exist. Skipping user seeding.`);
      await mongoose.disconnect();
      return;
    }

    // Hash passwords and create users
    const users = [];
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      users.push(new User({
        ...userData,
        password: hashedPassword
      }));
    }

    // Save all users
    await User.insertMany(users);
    console.log(`Successfully seeded ${users.length} users`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

seedUsers(); 