'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiInfo, FiBookOpen, FiTag, FiHeart, FiStar, FiCheck, FiBarChart, FiShoppingBag, FiCreditCard } from 'react-icons/fi';
import { booksAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import LinkComponent from './LinkComponent';

interface BookProps {
  book: {
    _id: string;
    title: string;
    authors: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    volumeInfo?: {
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      }
    };
    price: number;
    stock: number;
    saleInfo?: {
      isEbook?: boolean;
      saleability?: string;
      retailPrice?: {
        amount: number;
        currencyCode: string;
      }
    };
    googleBookId?: string;
    discount?: number;
    rating?: number;
    isNew?: boolean;
    category?: string;
  };
  compact?: boolean;
}

export default function BookCard({ book, compact = false }: BookProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const router = useRouter();
  
  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      
      // Check if this is a Google book that needs to be imported
      if (book.googleBookId) {
        // Prepare book data for import
        const bookData = {
          title: book.title,
          authors: book.authors,
          description: book.description || '',
          imageLinks: book.volumeInfo?.imageLinks || book.imageLinks,
          price: book.price || 0,
          stock: book.stock || 10,
          googleBookId: book.googleBookId
        };
        
        try {
          // Import the book to the database
          const importedBook = await booksAPI.importBook(book.googleBookId, bookData);
          
          // Show success message and redirect to purchase page
          toast.success("Redirecting to purchase...");
          router.push(`/purchase?bookId=${importedBook._id}&quantity=1`);
        } catch (importError) {
          console.error("Error importing book:", importError);
          
          // If import fails, try direct purchase
          toast.success("Redirecting to purchase...");
          router.push(`/purchase?bookId=${book._id}&quantity=1`);
        }
      } else {
        // Regular book, direct purchase
        toast.success("Redirecting to purchase...");
        router.push(`/purchase?bookId=${book._id}&quantity=1`);
      }
    } catch (error) {
      console.error("Error processing purchase:", error);
      toast.error("Failed to process purchase. Please try again.");
      setIsPurchasing(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    
    const message = isFavorite ? "Removed from favorites" : "Added to favorites";
    toast.success(message, {
      icon: isFavorite ? '💔' : '❤️',
      style: {
        border: '1px solid #f43f5e',
        padding: '16px',
        color: '#f43f5e',
      },
    });
  };

  // Support both direct imageLinks and Google Books API format (volumeInfo.imageLinks)
  const getImageUrl = () => {
    if (imageError) return null;
    
    // Google Books API structure (most common)
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
    
    return '/book-placeholder.svg';
  };

  // Get price from either our model or Google Books API
  const getPrice = () => {
    if (typeof book.price === 'number') {
      return book.price;
    }
    
    if (book.saleInfo?.retailPrice?.amount) {
      return book.saleInfo.retailPrice.amount;
    }
    
    return 0;
  };

  // Check if book is free
  const isFree = () => {
    const price = getPrice();
    return price === 0;
  };

  // Get availability status
  const isAvailable = () => {
    // Check our model
    if (typeof book.stock === 'number') {
      return book.stock > 0;
    }
    
    // Check Google Books API format
    if (book.saleInfo) {
      return book.saleInfo.saleability !== 'NOT_FOR_SALE';
    }
    
    // Default to available
    return true;
  };

  // Calculate discounted price if applicable
  const getDiscountedPrice = (originalPrice: number) => {
    if (!book.discount) return null;
    return (originalPrice - (originalPrice * (book.discount / 100))).toFixed(2);
  };

  // Format price with appropriate display
  const formatPrice = (price: number) => {
    if (price === 0) return 'FREE';
    return `$${price.toFixed(2)}`;
  };
  
  // Render rating stars
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FiStar key={`full-${i}`} className="text-yellow-400 fill-current" size={12} />
        ))}
        
        {hasHalfStar && (
          <div className="relative">
            <FiStar className="text-yellow-400" size={12} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <FiStar className="text-yellow-400 fill-current" size={12} />
            </div>
          </div>
        )}
        
        {[...Array(emptyStars)].map((_, i) => (
          <FiStar key={`empty-${i}`} className="text-yellow-400" size={12} />
        ))}
        
        <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  const imageUrl = getImageUrl();
  const price = getPrice();
  const discountedPrice = book.discount ? getDiscountedPrice(price) : null;
  const available = isAvailable();
  const isFreeBook = isFree();
  const showPrice = available;
  const showPurchaseButton = available;
  const bookRating = book.rating || 4.5; // Use default rating if not provided
  
  return (
    <div 
      className={`book-card ${compact ? '' : 'book-card-large'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* New badge */}
      {book.isNew && (
        <div className="absolute top-3 left-3 z-20 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          NEW
        </div>
      )}
      
      {/* Discount badge */}
      {book.discount && book.discount > 0 && (
        <div className="absolute top-3 right-3 z-20 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          {book.discount}% OFF
        </div>
      )}
      
      <div className="book-card-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={book.title}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <img
              src="/book-placeholder.svg"
              alt="Book placeholder"
              className="w-16 h-16"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}
        
        {/* Favorite button */}
        <button 
          onClick={toggleFavorite}
          className="absolute top-3 left-3 z-10 p-2 bg-white/80 hover:bg-white text-gray-600 rounded-full shadow-md transition-all hover:scale-110"
          style={{ opacity: isFavorite ? 1 : (isHovered ? 0.9 : 0) }}
        >
          <FiHeart 
            size={16} 
            className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-600"} 
          />
        </button>
        
        {/* Book details on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
          {/* Book category if available */}
          {book.category && (
            <div className="absolute top-3 left-3 z-10">
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-green-600/80 text-white shadow-sm`}>
                {book.category}
              </span>
            </div>
          )}
          
          <div className="p-4 w-full">
            <LinkComponent href={`/books/${book._id}`}>
              <h2 className="text-white font-bold text-lg line-clamp-1 hover:underline">{book.title}</h2>
              <p className="text-gray-300 text-sm mb-2 line-clamp-1">
                {book.authors?.join(', ') || 'Unknown Author'}
              </p>
              
              {/* Show rating */}
              <div className="mb-3">
                {renderRating(bookRating)}
              </div>
              
              {/* Show price */}
              {showPrice && (
                <div className="flex items-end mb-3">
                  {discountedPrice ? (
                    <>
                      <span className="text-red-400 font-bold text-lg mr-2">${discountedPrice}</span>
                      <span className="text-gray-400 line-through text-sm">${price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className={`font-bold text-lg ${isFreeBook ? 'text-green-400' : 'text-white'}`}>
                      {formatPrice(price)}
                    </span>
                  )}
                </div>
              )}
            </LinkComponent>
              
            <div className="flex space-x-2">
              <button 
                onClick={() => router.push(`/books/${book._id}`)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors flex-grow text-center backdrop-blur-sm"
              >
                View Details
              </button>
              
              {showPurchaseButton && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePurchase();
                  }}
                  disabled={isPurchasing}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-full transition-colors flex items-center justify-center"
                >
                  {isPurchasing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FiCreditCard size={15} className="text-white mr-1" />
                      <span>Purchase</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Card body - always visible details */}
      <div className="book-card-content">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="book-card-title">{book.title}</h2>
            <p className="book-card-author">
              {book.authors?.join(', ') || 'Unknown Author'}
            </p>
            
            {/* Compact rating display - always visible */}
            <div className="mb-2">
              {renderRating(bookRating)}
            </div>
          </div>
        </div>
        
        {/* Price section */}
        <div className="flex items-center justify-between mt-2">
          {showPrice && (
            <div className="flex items-baseline">
              {discountedPrice ? (
                <>
                  <span className="text-red-600 font-bold mr-2">${discountedPrice}</span>
                  <span className="text-gray-400 line-through text-sm">${price.toFixed(2)}</span>
                </>
              ) : (
                <span className={`book-card-price ${isFreeBook ? 'text-green-600' : 'text-green-600'}`}>
                  {formatPrice(price)}
                </span>
              )}
            </div>
          )}
          
          {/* Purchase button - always visible */}
          {showPurchaseButton && (
            <button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="text-white px-4 py-2 rounded-full transition-all flex-shrink-0 flex items-center space-x-1 bg-green-600 hover:bg-green-700"
            >
              {isPurchasing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiCreditCard size={16} className="text-white" />
                  <span>Buy Now</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 