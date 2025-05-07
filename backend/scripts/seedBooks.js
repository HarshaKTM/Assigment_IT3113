const mongoose = require('mongoose');
const Book = require('../models/Book');

// MongoDB Connection
const mongoURI = "mongodb+srv://harshakumara1998030944:reqlHarsha321@cluster0.pxpmmp5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const sampleBooks = [
  {
    googleBookId: "F1iLDwAAQBAJ",
    title: "The Great Gatsby",
    authors: ["F. Scott Fitzgerald"],
    description: "A novel of the Jazz Age, the story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
    price: 12.99,
    stock: 50,
    categories: ["Fiction"],
    imageLinks: {
      thumbnail: "https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    googleBookId: "PGR2AwAAQBAJ",
    title: "To Kill a Mockingbird",
    authors: ["Harper Lee"],
    description: "The story of racial injustice and the destruction of innocence in the American South during the 1930s.",
    price: 14.99,
    stock: 35,
    categories: ["Fiction"],
    imageLinks: {
      thumbnail: "https://upload.wikimedia.org/wikipedia/commons/4/4f/To_Kill_a_Mockingbird_%28first_edition_cover%29.jpg"
    }
  },
  {
    googleBookId: "kotPYEqx7kMC",
    title: "1984",
    authors: ["George Orwell"],
    description: "A dystopian novel set in a totalitarian society where critical thought is suppressed under a surveillance state.",
    price: 11.99,
    stock: 40,
    categories: ["Fiction"],
    imageLinks: {
      thumbnail: "https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    googleBookId: "OlCHDDx1WUwC",
    title: "The Hobbit",
    authors: ["J.R.R. Tolkien"],
    description: "The adventure of Bilbo Baggins, a hobbit who embarks on a journey to help a group of dwarves reclaim their homeland.",
    price: 15.99,
    stock: 25,
    categories: ["Fantasy"],
    imageLinks: {
      thumbnail: "https://m.media-amazon.com/images/I/710+HcoP38L._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    googleBookId: "s1gVAAAAYAAJ",
    title: "Pride and Prejudice",
    authors: ["Jane Austen"],
    description: "A romantic novel that follows the emotional development of Elizabeth Bennet who learns about the repercussions of hasty judgments.",
    price: 9.99,
    stock: 30,
    categories: ["Romance"],
    imageLinks: {
      thumbnail: "https://m.media-amazon.com/images/I/71Q1tPupKjL._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    googleBookId: "YRZPEp_tOv0C",
    title: "The Catcher in the Rye",
    authors: ["J.D. Salinger"],
    description: "The story of Holden Caulfield, a teenage boy dealing with alienation and loss in 1950s New York City.",
    price: 10.99,
    stock: 20,
    categories: ["Fiction"],
    imageLinks: {
      thumbnail: "https://upload.wikimedia.org/wikipedia/commons/8/89/The_Catcher_in_the_Rye_%281951%2C_first_edition_cover%29.jpg"
    }
  },
  {
    googleBookId: "f280CwAAQBAJ",
    title: "Harry Potter and the Philosopher's Stone",
    authors: ["J.K. Rowling"],
    description: "The first novel in the Harry Potter series, following a young wizard's journey at Hogwarts School of Witchcraft and Wizardry.",
    price: 16.99,
    stock: 45,
    categories: ["Fantasy"],
    imageLinks: {
      thumbnail: "https://m.media-amazon.com/images/I/71RVt35ZAbL._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    googleBookId: "yl4dILkcqm4C",
    title: "The Lord of the Rings",
    authors: ["J.R.R. Tolkien"],
    description: "An epic high-fantasy novel that follows hobbit Frodo Baggins as he and the Fellowship embark on a quest to destroy the One Ring.",
    price: 24.99,
    stock: 15,
    categories: ["Fantasy"],
    imageLinks: {
      thumbnail: "https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    googleBookId: "5oRsJXDy-K8C",
    title: "The Da Vinci Code",
    authors: ["Dan Brown"],
    description: "A mystery thriller novel that follows symbologist Robert Langdon as he investigates a murder in the Louvre Museum.",
    price: 13.99,
    stock: 28,
    categories: ["Mystery"],
    imageLinks: {
      thumbnail: "https://m.media-amazon.com/images/I/91Q5dCR6cFL._AC_UF1000,1000_QL80_.jpg"
    }
  },
  {
    googleBookId: "i6iZCwAAQBAJ",
    title: "The Alchemist",
    authors: ["Paulo Coelho"],
    description: "A novel about a young Andalusian shepherd named Santiago who dreams of finding a worldly treasure and embarks on a journey of self-discovery.",
    price: 11.99,
    stock: 32,
    categories: ["Fiction"],
    imageLinks: {
      thumbnail: "https://m.media-amazon.com/images/I/51Z0nLAfLmL.jpg"
    }
  }
];

async function seedBooks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding books');

    // Check if there are already books
    const existingBookCount = await Book.countDocuments();
    if (existingBookCount > 0) {
      console.log(`${existingBookCount} books already exist. Skipping book seeding.`);
      await mongoose.disconnect();
      return;
    }

    // Insert all books
    await Book.insertMany(sampleBooks);
    console.log(`Successfully seeded ${sampleBooks.length} books`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding books:', error);
  }
}

seedBooks(); 