const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

// MongoDB Connection
const mongoURI = "mongodb+srv://harshakumara1998030944:reqlHarsha321@cluster0.pxpmmp5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Sample order statuses
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentMethods = ['credit_card', 'paypal', 'bank_transfer'];

async function seedOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding orders');

    // Find all users
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }

    // Find all books
    const books = await Book.find({});
    if (books.length === 0) {
      console.log('No books found. Please seed books first.');
      return;
    }

    // Delete existing orders
    await Order.deleteMany({});
    console.log('Cleared existing orders');

    const orders = [];

    // Generate orders for each user
    for (const user of users) {
      // Create 3-5 orders per user
      const orderCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < orderCount; i++) {
        // Select 1-4 random books for this order
        const itemCount = Math.floor(Math.random() * 4) + 1;
        const orderItems = [];
        let totalAmount = 0;

        for (let j = 0; j < itemCount; j++) {
          const randomBook = books[Math.floor(Math.random() * books.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const price = randomBook.price;
          
          orderItems.push({
            book: randomBook._id,
            title: randomBook.title,
            quantity: quantity,
            price: price
          });
          
          totalAmount += price * quantity;
        }

        // Create random dates within the last 3 months
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime()));
        
        // Determine status based on date (older orders more likely to be delivered)
        const daysSinceOrder = Math.floor((now - randomDate) / (1000 * 60 * 60 * 24));
        let status;
        
        if (daysSinceOrder > 14) {
          // 80% chance of delivered for orders older than 2 weeks
          status = Math.random() < 0.8 ? 'delivered' : orderStatuses[Math.floor(Math.random() * 4)];
        } else if (daysSinceOrder > 7) {
          // More likely to be shipped or delivered if more than 1 week old
          const statusOptions = ['processing', 'shipped', 'delivered'];
          status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        } else {
          // Recent orders more likely to be pending or processing
          const statusOptions = ['pending', 'processing', 'shipped'];
          status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        }

        // 5% chance of any order being cancelled
        if (Math.random() < 0.05) {
          status = 'cancelled';
        }

        // Generate shipping info
        const shipping = {
          name: `${user.firstName || 'User'} ${user.lastName || user.username}`,
          address: {
            street: `${Math.floor(Math.random() * 1000) + 1} ${['Main', 'Oak', 'Maple', 'Park', 'Lake'][Math.floor(Math.random() * 5)]} Street`,
            city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'][Math.floor(Math.random() * 8)],
            state: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH'][Math.floor(Math.random() * 8)],
            postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
            country: 'United States'
          },
          phone: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        };

        // Generate payment info
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const payment = {
          method: paymentMethod,
          transactionId: `TXN-${Math.floor(Math.random() * 10000000)}`,
          status: status === 'cancelled' ? 'failed' : 'completed',
          amount: totalAmount,
          paymentDate: randomDate
        };

        // Create the order
        const order = new Order({
          user: user._id,
          items: orderItems,
          totalAmount: totalAmount,
          shipping: shipping,
          payment: payment,
          status: status,
          createdAt: randomDate,
          updatedAt: new Date(randomDate.getTime() + Math.random() * (now.getTime() - randomDate.getTime()))
        });

        orders.push(order);
      }
    }

    // Save all orders
    await Order.insertMany(orders);
    console.log(`Successfully seeded ${orders.length} orders`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding orders:', error);
  }
}

// Run the seed function
seedOrders(); 