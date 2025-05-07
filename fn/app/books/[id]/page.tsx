'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { booksAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { FiShoppingCart, FiArrowLeft, FiSave, FiCreditCard, FiShield } from 'react-icons/fi';

export default function BookDetail() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [importStatus, setImportStatus] = useState({
    loading: false,
    success: false,
    error: null as string | null
  });

  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if this is a Google Books ID (not from our database)
        if (bookId.includes('googlebooks_')) {
          const googleId = bookId.replace('googlebooks_', '');
          // We need to fetch from Google Books API
          const googleBooksApiKey = 'AIzaSyBtOn5PsETljURB5nKAVVEVOJm_ufcPcBY';
          const url = `https://www.googleapis.com/books/v1/volumes/${googleId}?key=${googleBooksApiKey}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error.message || 'Failed to fetch book from Google Books API');
          }
          
          // Transform Google Books API data to match our book format
          const formattedBook = {
            _id: `googlebooks_${data.id}`,
            googleBookId: data.id,
            title: data.volumeInfo.title || 'Unknown Title',
            authors: data.volumeInfo.authors || ['Unknown Author'],
            description: data.volumeInfo.description || '',
            categories: data.volumeInfo.categories || [],
            pageCount: data.volumeInfo.pageCount,
            publishedDate: data.volumeInfo.publishedDate,
            publisher: data.volumeInfo.publisher,
            volumeInfo: {
              imageLinks: data.volumeInfo.imageLinks || {}
            },
            price: data.saleInfo?.retailPrice?.amount || 0,
            saleInfo: data.saleInfo || { saleability: 'FOR_SALE' },
            stock: 10, // Default stock for imported books
          };
          
          setBook(formattedBook);
        } else {
          // Fetch from our database
          const response = await booksAPI.getBook(bookId);
          setBook(response.book);
        }
      } catch (error: any) {
        console.error('Error fetching book details:', error);
        setError(error.message || 'Failed to fetch book details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  const getImageUrl = () => {
    if (imageError || !book) return null;
    
    // Google Books API structure
    if (book.volumeInfo?.imageLinks?.thumbnail) {
      return book.volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
    }
    
    // Direct imageLinks structure (our backend)
    if (book.imageLinks?.thumbnail) {
      return book.imageLinks.thumbnail.replace('http://', 'https://');
    }
    
    // Fallbacks
    if (book.volumeInfo?.imageLinks?.smallThumbnail) {
      return book.volumeInfo.imageLinks.smallThumbnail.replace('http://', 'https://');
    }
    
    if (book.imageLinks?.smallThumbnail) {
      return book.imageLinks.smallThumbnail.replace('http://', 'https://');
    }
    
    return null;
  };
  
  const handleAddToCart = async () => {
    try {
      // Check if this is a Google book that needs to be imported
      if (book.googleBookId && book._id.includes('googlebooks_')) {
        // Import book first, then add to cart
        await importBook();
      } else {
        // Regular book, just add to cart
        await addToCart(book._id, quantity);
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart: ' + (error.message || 'Unknown error'));
    }
  };

  const importBook = async () => {
    if (!book.googleBookId) return;
    
    setImportStatus({
      loading: true,
      success: false,
      error: null
    });
    
    try {
      // Prepare book data for import
      const bookData = {
        title: book.title,
        authors: book.authors,
        description: book.description || '',
        imageLinks: book.volumeInfo?.imageLinks || book.imageLinks,
        price: book.price || 0,
        stock: quantity || 10,
        categories: book.categories || [],
        pageCount: book.pageCount,
        publishedDate: book.publishedDate,
        publisher: book.publisher,
        googleBookId: book.googleBookId
      };
      
      // Import the book to the database
      const importedBook = await booksAPI.importBook(book.googleBookId, bookData);
      
      setImportStatus({
        loading: false,
        success: true,
        error: null
      });
      
      // Add to cart
      await addToCart(importedBook._id, quantity);
      
      // Update book in state to use the imported version
      setBook(importedBook);
      
      // Show success alert
      alert('Book was successfully imported and added to your cart!');
      
      // Redirect to the new book page (only in production, for development we stay on the same page)
      if (process.env.NODE_ENV !== 'development') {
        router.push(`/books/${importedBook._id}`);
      }
      
    } catch (error: any) {
      console.error('Error importing book:', error);
      
      // Handle development mode differently
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development mode fallback for import');
        
        // Create mock imported book
        const mockImportedBook = {
          _id: `dev_${book.googleBookId}`,
          ...book,
          googleBookId: book.googleBookId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setImportStatus({
          loading: false,
          success: true,
          error: null
        });
        
        // Add to cart using the book ID directly
        try {
          await addToCart(mockImportedBook._id, quantity);
          alert('Book was added to your cart in development mode!');
        } catch (cartError) {
          console.error('Error adding to cart:', cartError);
        }
        
        return;
      }
      
      // Regular error handling for production
      setImportStatus({
        loading: false,
        success: false,
        error: error.message || 'Failed to import book'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/books" className="text-blue-600 hover:underline flex items-center">
            <FiArrowLeft className="mr-2" /> Back to Books
          </Link>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-md">
          Book not found
        </div>
        <div className="mt-4">
          <Link href="/books" className="text-blue-600 hover:underline flex items-center">
            <FiArrowLeft className="mr-2" /> Back to Books
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl();
  const isGoogleBook = book._id.includes('googlebooks_');
  const isFreeBook = book.price === 0 || book.saleInfo?.saleability === 'FREE';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/books" className="text-blue-600 hover:underline flex items-center">
          <FiArrowLeft className="mr-2" /> Back to Books
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Book Image */}
          <div className="md:w-1/3 flex-shrink-0">
            <div className="relative aspect-[3/4] w-full bg-gray-200 rounded-md overflow-hidden">
              {imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={`Cover for ${book.title}`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  loading="eager"
                  fetchPriority="high"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-200">
                  <div className="text-center p-4">
                    <img
                      src="/book-placeholder.svg"
                      alt="Book placeholder"
                      className="w-24 h-24 mx-auto mb-2"
                      loading="eager"
                      fetchPriority="high"
                    />
                    <div className="text-xl">{book.title}</div>
                  </div>
                </div>
              )}
            </div>
            
            {isGoogleBook && (
              <div className="mt-4 bg-blue-50 text-blue-700 p-3 rounded-md text-center">
                <p>Source: Google Books</p>
                {!importStatus.success && (
                  <button
                    onClick={importBook}
                    disabled={importStatus.loading}
                    className="mt-2 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                  >
                    {importStatus.loading ? 'Importing...' : (
                      <>
                        <FiSave className="mr-2" /> Import to Database
                      </>
                    )}
                  </button>
                )}
                {importStatus.success && (
                  <p className="mt-2 text-green-600">Book imported successfully!</p>
                )}
                {importStatus.error && (
                  <p className="mt-2 text-red-600">{importStatus.error}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Book Details */}
          <div className="md:w-2/3">
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-gray-600 mb-4">by {book.authors?.join(', ') || 'Unknown Author'}</p>
            
            {book.publisher && (
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Publisher:</span> {book.publisher}
              </p>
            )}
            
            {book.publishedDate && (
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Published:</span> {book.publishedDate}
              </p>
            )}
            
            {book.pageCount && (
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Pages:</span> {book.pageCount}
              </p>
            )}
            
            {book.categories && book.categories.length > 0 && (
              <div className="mb-4">
                <span className="font-medium text-gray-600">Categories:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {book.categories.map((category: string, index: number) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="my-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <div 
                className="text-gray-600"
                dangerouslySetInnerHTML={{ __html: book.description || 'No description available.' }}
              />
            </div>
            
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  {isFreeBook ? 'Free' : `$${(book.price || 0).toFixed(2)}`}
                </span>
                <div className="flex items-center">
                  <span className="mr-3">Quantity:</span>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={importStatus.loading}
                className="w-full py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center text-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                {importStatus.loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiShoppingCart className="mr-3" size={20} /> 
                    {isGoogleBook ? 'Import and Add to Cart' : 'Add to Cart'}
                  </>
                )}
              </button>
              
              {book.stock <= 5 && book.stock > 0 && !isGoogleBook && (
                <p className="mt-2 text-orange-500 text-sm">
                  Only {book.stock} left in stock - order soon!
                </p>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Options:</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <div className="flex items-center text-gray-600 text-sm">
                    <FiCreditCard className="mr-1 text-blue-600" size={16} />
                    Credit Card
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <FiShield className="mr-1 text-blue-600" size={16} />
                    PayPal
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <FiShield className="mr-1 text-blue-600" size={16} />
                    Bank Transfer
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Secure payment processing with your choice of payment method. Free shipping on all orders!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 