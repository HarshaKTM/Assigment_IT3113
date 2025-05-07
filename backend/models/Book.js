const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  googleBookId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  authors: [{ 
    type: String, 
    required: true 
  }],
  publisher: { 
    type: String, 
    trim: true 
  },
  publishedDate: { 
    type: String 
  },
  description: { 
    type: String 
  },
  pageCount: { 
    type: Number 
  },
  categories: [{ 
    type: String 
  }],
  imageLinks: { 
    thumbnail: String, 
    smallThumbnail: String 
  },
  language: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true 
  },
  stock: { 
    type: Number, 
    default: 10 
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 0 
  },
  ratingsCount: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for text search
bookSchema.index({ title: 'text', authors: 'text', categories: 'text' });

module.exports = mongoose.model('Book', bookSchema); 