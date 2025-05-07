const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { auth } = require('../middleware/auth');

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.book',
      select: 'title authors imageLinks price stock'
    });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
      await cart.save();
    }
    
    res.json({ cart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body;
    
    // Validate book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check stock availability
    if (book.stock < quantity) {
      return res.status(400).json({ 
        message: 'Not enough stock available',
        availableStock: book.stock
      });
    }
    
    // Get or create user's cart
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
    }
    
    // Check if item already in cart
    const itemIndex = cart.items.findIndex(item => 
      item.book.toString() === bookId
    );
    
    if (itemIndex > -1) {
      // If item exists, update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        book: bookId,
        quantity,
        price: book.price
      });
    }
    
    // Calculate total
    cart.calculateTotal();
    await cart.save();
    
    // Return populated cart
    cart = await Cart.findById(cart._id).populate({
      path: 'items.book',
      select: 'title authors imageLinks price stock'
    });
    
    res.json({
      message: 'Item added to cart',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item quantity
router.put('/update/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }
    
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(item => 
      item._id.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    // Check stock availability
    const book = await Book.findById(cart.items[itemIndex].book);
    if (book.stock < quantity) {
      return res.status(400).json({ 
        message: 'Not enough stock available',
        availableStock: book.stock
      });
    }
    
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    
    // Recalculate total
    cart.calculateTotal();
    await cart.save();
    
    // Return populated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.book',
      select: 'title authors imageLinks price stock'
    });
    
    res.json({
      message: 'Cart updated',
      cart: updatedCart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Remove item from cart
    cart.items = cart.items.filter(item => 
      item._id.toString() !== itemId
    );
    
    // Recalculate total
    cart.calculateTotal();
    await cart.save();
    
    // Return populated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.book',
      select: 'title authors imageLinks price stock'
    });
    
    res.json({
      message: 'Item removed from cart',
      cart: updatedCart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
    
    res.json({
      message: 'Cart cleared',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 