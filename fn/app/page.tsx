'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiSearch, FiBookOpen, FiShoppingBag, FiShield, FiShoppingCart, FiArrowRight, FiStar, FiUser, FiPackage, FiSettings, FiClock, FiTag, FiTrendingUp, FiGift } from 'react-icons/fi';
import { booksAPI } from './services/api';
import { useAuth } from './context/AuthContext';

// Temporary placeholder for featured books
const bookPlaceholders = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    price: 12.99,
    category: 'Fiction',
    discount: 15,
    rating: 4.5,
    imageSrc: 'https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    id: '2',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    price: 14.99,
    category: 'Fiction',
    discount: 0,
    rating: 4.8,
    imageSrc: 'https://m.media-amazon.com/images/I/71FxgtFKcQL._AC_UF894,1000_QL80_.jpg'
  },
  {
    id: '3',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    price: 11.99,
    category: 'Classic',
    discount: 10,
    rating: 4.6,
    imageSrc: 'https://m.media-amazon.com/images/I/71Q1tPupKjL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    id: '4',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    price: 15.99,
    category: 'Fantasy',
    discount: 0,
    rating: 4.7,
    imageSrc: 'https://m.media-amazon.com/images/I/710+HcoP38L._AC_UF1000,1000_QL80_.jpg'
  },
  {
    id: '5',
    title: 'Becoming',
    author: 'Michelle Obama',
    price: 18.99,
    category: 'Biography',
    discount: 20,
    rating: 4.9,
    imageSrc: 'https://m.media-amazon.com/images/I/81dDwAzxtrL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    id: '6',
    title: 'Atomic Habits',
    author: 'James Clear',
    price: 16.99,
    category: 'Self-Help',
    discount: 0,
    rating: 4.8,
    imageSrc: 'https://m.media-amazon.com/images/I/81wgcld4wxL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    id: '7',
    title: 'Dune',
    author: 'Frank Herbert',
    price: 13.99,
    category: 'Sci-Fi',
    discount: 5,
    rating: 4.7,
    imageSrc: 'https://m.media-amazon.com/images/I/A1u+2fY5yTL._AC_UF1000,1000_QL80_.jpg'
  },
  {
    id: '8',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    price: 14.99,
    category: 'Finance',
    discount: 0,
    rating: 4.6,
    imageSrc: 'https://m.media-amazon.com/images/I/71TRB-Gu3NL._AC_UF1000,1000_QL80_.jpg'
  }
];

// Popular Categories with icons
const popularCategories = [
  { name: 'Fiction', icon: '📚', color: 'bg-blue-500' },
  { name: 'Non-Fiction', icon: '🧠', color: 'bg-green-500' },
  { name: 'Science', icon: '🔬', color: 'bg-purple-500' },
  { name: 'Fantasy', icon: '🐉', color: 'bg-orange-500' },
  { name: 'Biography', icon: '👤', color: 'bg-red-500' },
  { name: 'History', icon: '🏛️', color: 'bg-yellow-500' },
  { name: 'Self-Help', icon: '🌱', color: 'bg-teal-500' },
  { name: 'Business', icon: '💼', color: 'bg-indigo-500' }
];

// Book display component
const BookCard = ({ book }) => {
  const discountedPrice = book.discount > 0 
    ? (book.price - (book.price * book.discount / 100)).toFixed(2)
    : null;
  
  return (
    <div className="group relative bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px]">
      {book.discount > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {book.discount}% OFF
        </div>
      )}
      
      <div className="relative aspect-[2/3] w-full bg-gray-100 overflow-hidden">
        <img
          src={book.imageSrc}
          alt={`Cover for ${book.title}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <Link 
              href={`/books/${book.id}`}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-full hover:bg-blue-700 transition-colors inline-block mx-auto"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-xs font-medium text-blue-600 mb-1">{book.category}</div>
        <h3 className="text-base font-bold mb-1 text-gray-800 line-clamp-1">{book.title}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-1">by {book.author}</p>
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center">
            {discountedPrice ? (
              <div className="flex flex-col">
                <span className="text-red-600 font-bold">${discountedPrice}</span>
                <span className="text-gray-500 text-xs line-through">${book.price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-blue-600 font-bold">${book.price.toFixed(2)}</span>
            )}
          </div>
          
          <button className="text-white bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors">
            <FiShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { books } = await booksAPI.getBooks(1, 8);
        if (books && books.length > 0) {
          setFeaturedBooks(books);
        } else {
          // Use placeholder data if API returns no books
          setFeaturedBooks(bookPlaceholders);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        // Use placeholder data on error
        setFeaturedBooks(bookPlaceholders);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    // Load profile photo from localStorage if available
    if (typeof window !== 'undefined' && isAuthenticated) {
      const savedPhoto = localStorage.getItem('userProfilePhoto');
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
    }
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/books?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/books-pattern.png')] opacity-10"></div>
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Your Favorite Books, Delivered</h1>
            <p className="text-xl mb-8 text-blue-100">Discover millions of books at unbeatable prices with free shipping nationwide.</p>
            
            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-8">
              <div className="bg-white rounded-full p-1 flex items-center shadow-lg">
                <input 
                  type="text" 
                  placeholder="Search by title, author, ISBN..." 
                  className="w-full px-6 py-3 rounded-full text-gray-800 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  className="bg-blue-600 text-white p-3 rounded-full flex-shrink-0 hover:bg-blue-700 transition-all"
                >
                  <FiSearch className="text-xl" />
                </button>
              </div>
            </form>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/books" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <FiBookOpen className="mr-2" /> Browse Catalog
              </Link>
              <Link 
                href="/books?filter=new-releases" 
                className="bg-blue-600 border border-blue-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <FiClock className="mr-2" /> New Releases
              </Link>
              <Link 
                href="/books?filter=deals" 
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <FiTag className="mr-2" /> Special Offers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Categories Bar */}
      <div className="bg-white shadow-md py-3 sticky top-0 z-20 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between overflow-x-auto hide-scrollbar">
            {popularCategories.map((category) => (
              <Link 
                key={category.name}
                href={`/books?category=${encodeURIComponent(category.name.toLowerCase())}`}
                className="flex flex-col items-center px-4 py-1 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                <span className={`${category.color} text-white p-2 rounded-full w-10 h-10 flex items-center justify-center mb-1`}>
                  {category.icon}
                </span>
                <span className="text-xs font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile Section - Only shown for authenticated users */}
      {isAuthenticated && (
        <section className="py-8 bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-md overflow-hidden border border-blue-100">
              <div className="md:flex items-center">
                <div className="md:flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white flex items-center md:w-1/3">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/40 mr-4">
                    {profilePhoto ? (
                      <img 
                        src={profilePhoto} 
                        alt={user?.username || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser size={24} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Hi, {user?.firstName || user?.username}!</h2>
                    <p className="text-blue-100 text-sm">{user?.email}</p>
                  </div>
                </div>
                
                <div className="p-4 md:p-6 md:w-2/3 flex flex-wrap gap-2 justify-between">
                  <Link href="/profile" className="flex items-center text-blue-700 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                    <FiUser className="mr-2" /> My Account
                  </Link>
                  <Link href="/profile?tab=books" className="flex items-center text-purple-700 hover:text-purple-800 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                    <FiBookOpen className="mr-2" /> My Library
                  </Link>
                  <Link href="/profile?tab=orders" className="flex items-center text-green-700 hover:text-green-800 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors">
                    <FiPackage className="mr-2" /> My Orders
                  </Link>
                  <Link href="/cart" className="flex items-center text-red-700 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                    <FiShoppingCart className="mr-2" /> My Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* New Releases Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FiClock className="mr-2 text-blue-600" /> New Releases
            </h2>
            <Link 
              href="/books?filter=new-releases" 
              className="text-blue-600 hover:text-blue-800 transition-colors flex items-center font-medium"
            >
              View All <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {!loading && featuredBooks.slice(0, 6).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
            
            {loading && Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="aspect-[2/3] w-full bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Special Offers Section */}
        <section className="mb-12 bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl p-6 border border-red-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FiTag className="mr-2 text-red-600" /> Special Offers
            </h2>
            <Link 
              href="/books?filter=offers" 
              className="text-red-600 hover:text-red-800 transition-colors flex items-center font-medium"
            >
              View All <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {!loading && featuredBooks
              .filter(book => book.discount > 0)
              .slice(0, 4)
              .map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            
            {loading && Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="aspect-[2/3] w-full bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Top Sellers Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FiTrendingUp className="mr-2 text-blue-600" /> Top Sellers
            </h2>
            <Link 
              href="/books?filter=bestsellers" 
              className="text-blue-600 hover:text-blue-800 transition-colors flex items-center font-medium"
            >
              View All <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {!loading && featuredBooks.slice(0, 6).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
            
            {loading && Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="aspect-[2/3] w-full bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Value Propositions */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <FiShoppingBag className="text-blue-600 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-600 text-sm">On all orders above $35</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <FiShield className="text-green-600 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600 text-sm">100% secure payment</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-100 p-4 rounded-full mb-4">
                <FiGift className="text-yellow-600 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Special Offers</h3>
              <p className="text-gray-600 text-sm">Save up to 50% on books</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <FiClock className="text-red-600 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Get support all day</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-2">Join Our Newsletter</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Subscribe to stay updated with new releases, exclusive offers, and reading recommendations.
          </p>
          
          <div className="max-w-md mx-auto">
            <form className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="px-6 py-3 rounded-lg text-gray-800 focus:outline-none w-full"
                required
              />
              <button type="submit" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all whitespace-nowrap">
                Subscribe
              </button>
            </form>
            <p className="text-xs text-blue-200 mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Browse by Category</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popularCategories.map((category) => (
              <Link 
                key={category.name}
                href={`/books?category=${encodeURIComponent(category.name.toLowerCase())}`}
                className="group bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-all border border-gray-100 hover:border-blue-200"
              >
                <div className={`${category.color} text-white w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Explore Books</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Mobile App Banner */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12 my-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-purple-500 opacity-30 transform rotate-12 translate-x-1/4"></div>
        <div className="container mx-auto px-4">
          <div className="md:flex items-center justify-between">
            <div className="mb-8 md:mb-0 md:w-2/3">
              <h2 className="text-3xl font-bold mb-4">Download Our Mobile App</h2>
              <p className="text-purple-100 mb-6 max-w-xl">
                Get exclusive app-only deals, track your orders in real-time, and build your personalized reading list.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#" className="bg-black text-white px-6 py-3 rounded-lg flex items-center hover:bg-gray-900 transition-colors">
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="white">
                    <path d="M17.707,9.293l-5-5C12.52,4.105,12.266,4,12,4s-0.52,0.105-0.707,0.293l-5,5C5.105,9.48,5,9.734,5,10 s0.105,0.52,0.293,0.707l5,5C10.48,15.895,10.734,16,11,16s0.52-0.105,0.707-0.293l5-5C16.895,10.52,17,10.266,17,10 S16.895,9.48,16.707,9.293z M14.586,10L12,7.414L9.414,10L12,12.586L14.586,10z"/>
                  </svg>
                  <div>
                    <div className="text-xs">Download on the</div>
                    <div className="text-xl font-semibold">App Store</div>
                  </div>
                </a>
                <a href="#" className="bg-black text-white px-6 py-3 rounded-lg flex items-center hover:bg-gray-900 transition-colors">
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="white">
                    <path d="M3,20.5v-17C3,2.673,3.673,2,4.5,2h15C20.327,2,21,2.673,21,3.5v17c0,0.827-0.673,1.5-1.5,1.5h-15 C3.673,22,3,21.327,3,20.5z M19,20.5v-17C19,3.224,18.776,3,18.5,3h-13C5.224,3,5,3.224,5,3.5v17C5,20.776,5.224,21,5.5,21h13 C18.776,21,19,20.776,19,20.5z"/>
                    <path d="M10.5,17l3.5-2l-3.5-2V17z"/>
                  </svg>
                  <div>
                    <div className="text-xs">GET IT ON</div>
                    <div className="text-xl font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <img 
                src="https://placehold.co/300x600/4338ca/ffffff?text=BookStore+App" 
                alt="BookStore Mobile App" 
                className="max-w-full h-auto max-h-80 rounded-3xl shadow-2xl border-4 border-white"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
