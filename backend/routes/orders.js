const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { auth, admin } = require('../middleware/auth');

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.book',
        select: 'title authors imageLinks'
      });
    
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'items.book',
        select: 'title authors imageLinks'
      });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user owns this order or is admin
    if (order.user.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create order from cart
router.post('/checkout', auth, async (req, res) => {
  try {
    const { 
      shipping, 
      payment 
    } = req.body;
    
    // Validation
    if (!shipping || !payment) {
      return res.status(400).json({ 
        message: 'Shipping and payment information are required' 
      });
    }
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.book');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }
    
    // Create order items from cart items
    const orderItems = [];
    
    // Verify stock and prepare order items
    for (const item of cart.items) {
      const book = await Book.findById(item.book._id);
      
      if (!book) {
        return res.status(400).json({ 
          message: `Book "${item.book.title}" no longer exists`
        });
      }
      
      if (book.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Not enough stock for "${book.title}". Available: ${book.stock}`
        });
      }
      
      orderItems.push({
        book: book._id,
        title: book.title,
        quantity: item.quantity,
        price: book.price
      });
      
      // Decrease book stock
      book.stock -= item.quantity;
      await book.save();
    }
    
    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: cart.totalAmount,
      shipping,
      payment: {
        ...payment,
        amount: cart.totalAmount
      },
      status: 'pending'
    });
    
    await order.save();
    
    // Clear cart after successful order
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
    
    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status (admin only)
router.put('/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Handle cancellation (restore stock)
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        const book = await Book.findById(item.book);
        if (book) {
          book.stock += item.quantity;
          await book.save();
        }
      }
    }
    
    // Update order status
    order.status = status;
    order.updatedAt = Date.now();
    await order.save();
    
    res.json({
      message: 'Order status updated',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment status (can be triggered by webhook or admin)
router.put('/:id/payment', auth, async (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;
    
    if (!['completed', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user owns this order or is admin
    if (order.user.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update payment details
    order.payment.status = paymentStatus;
    if (transactionId) {
      order.payment.transactionId = transactionId;
    }
    
    order.payment.paymentDate = Date.now();
    order.updatedAt = Date.now();
    
    // If payment is completed, update order status to processing
    if (paymentStatus === 'completed' && order.status === 'pending') {
      order.status = 'processing';
    }
    
    // If payment failed, cancel order and restore stock
    if (paymentStatus === 'failed') {
      order.status = 'cancelled';
      
      // Restore book stock
      for (const item of order.items) {
        const book = await Book.findById(item.book);
        if (book) {
          book.stock += item.quantity;
          await book.save();
        }
      }
    }
    
    await order.save();
    
    res.json({
      message: 'Payment status updated',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders (admin only)
router.get('/admin/all', auth, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email')
      .populate({
        path: 'items.book',
        select: 'title authors'
      });
    
    const total = await Order.countDocuments();
    
    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 