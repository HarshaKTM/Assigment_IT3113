const express = require('express');
const router = express.Router();
const axios = require('axios');
const Book = require('../models/Book');
const { auth, admin } = require('../middleware/auth');

// Get all books (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    let query = {};
    
    if (search) {
      query = { $text: { $search: search } };
    }
    
    const books = await Book.find(query).skip(skip).limit(limit);
    const total = await Book.countDocuments(query);
    
    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({ book });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search Google Books API
router.get('/google/search', async (req, res) => {
  try {
    const { q, startIndex, maxResults, filter } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const response = await axios.get(
      'https://www.googleapis.com/books/v1/volumes',
      {
        params: {
          q,
          startIndex: startIndex || 0,
          maxResults: maxResults || 10,
          filter: filter || 'partial', // Default to 'partial', but allow 'free-ebooks'
          key: process.env.GOOGLE_BOOKS_API_KEY,
        },
      }
    );
    
    res.json({
      books: response.data.items || [],
      totalItems: response.data.totalItems || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import a book from Google Books API (admin only)
router.post('/import/:googleBookId', auth, admin, async (req, res) => {
  try {
    const { googleBookId } = req.params;
    const { price, stock } = req.body;
    
    // Check if book already exists
    const existingBook = await Book.findOne({ googleBookId });
    
    if (existingBook) {
      return res.status(400).json({ 
        message: 'Book already exists in the database',
        book: existingBook,
      });
    }
    
    // Fetch book details from Google Books API
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${googleBookId}`,
      {
        params: {
          key: process.env.GOOGLE_BOOKS_API_KEY,
        },
      }
    );
    
    const bookData = response.data;
    
    // Create new book
    const book = new Book({
      googleBookId: bookData.id,
      title: bookData.volumeInfo.title,
      authors: bookData.volumeInfo.authors || ['Unknown Author'],
      publisher: bookData.volumeInfo.publisher,
      publishedDate: bookData.volumeInfo.publishedDate,
      description: bookData.volumeInfo.description,
      pageCount: bookData.volumeInfo.pageCount,
      categories: bookData.volumeInfo.categories || [],
      imageLinks: bookData.volumeInfo.imageLinks || {
        thumbnail: 'https://via.placeholder.com/128x192.png?text=No+Cover',
        smallThumbnail: 'https://via.placeholder.com/64x96.png?text=No+Cover',
      },
      language: bookData.volumeInfo.language,
      price: price || parseFloat((Math.random() * 30 + 5).toFixed(2)),
      stock: stock || 10,
    });
    
    await book.save();
    
    res.status(201).json({
      message: 'Book imported successfully',
      book,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update book (admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const bookId = req.params.id;
    const updates = req.body;
    
    // Restrict fields that can be updated
    const allowedUpdates = [
      'price', 'stock', 'description', 'categories'
    ];
    
    const updateData = {};
    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    }
    
    const book = await Book.findByIdAndUpdate(
      bookId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({
      message: 'Book updated successfully',
      book,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete book (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 