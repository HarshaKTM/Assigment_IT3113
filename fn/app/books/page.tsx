'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { booksAPI } from '../services/api';
import BookCard from '../components/BookCard';

export default function Books() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch || 'programming');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [freeEbooksOnly, setFreeEbooksOnly] = useState(false);
  
  const itemsPerPage = 12;

  // Fetch books when page changes or search changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (freeEbooksOnly) {
          // Search Google Books API directly
          await searchGoogleBooks();
        } else {
          // Use our database
          const response = await booksAPI.getBooks(currentPage, itemsPerPage, searchQuery);
          setBooks(response.books);
          setTotalPages(response.totalPages);
          
          // If no books found in our database, fall back to Google Books
          if (!response.books || response.books.length === 0) {
            console.log("No books found in database, falling back to Google Books");
            await searchGoogleBooks();
          }
        }
      } catch (error: any) {
        setError(error.message || 'Failed to fetch books');
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchQuery, freeEbooksOnly]);

  // Add a new function to search Google Books API directly
  const searchGoogleBooks = async () => {
    setLoading(true);
    setError(null);
    
    // Use default search term if empty
    const searchTerm = searchQuery || 'programming';
    
    try {
      // Direct call to Google Books API for free eBooks
      const googleBooksApiKey = 'AIzaSyBtOn5PsETljURB5nKAVVEVOJm_ufcPcBY';
      const filter = freeEbooksOnly ? 'free-ebooks' : '';
      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}`;
      
      if (filter) {
        url += `&filter=${filter}`;
      }
      
      url += `&startIndex=${(currentPage - 1) * itemsPerPage}&maxResults=${itemsPerPage}&key=${googleBooksApiKey}`;
      
      console.log("Searching Google Books API with URL:", url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log("Google Books API response:", data);
      
      if (!data.items || data.items.length === 0) {
        setBooks([]);
        setError('No books found matching your criteria.');
      } else {
        // Transform Google Books API data to match our book format
        const formattedBooks = data.items.map((item: any) => {
          return {
            _id: `googlebooks_${item.id}`,
            googleBookId: item.id,
            title: item.volumeInfo.title || 'Unknown Title',
            authors: item.volumeInfo.authors || ['Unknown Author'],
            description: item.volumeInfo.description,
            volumeInfo: {
              imageLinks: item.volumeInfo.imageLinks || {}
            },
            price: 0, // Free books
            saleInfo: item.saleInfo || { saleability: 'FOR_SALE' },
            stock: 10, // Default stock for free books
          };
        });
        
        setBooks(formattedBooks);
        setTotalPages(Math.ceil(data.totalItems / itemsPerPage));
      }
    } catch (error: any) {
      console.error('Error searching Google Books API:', error);
      setError('Failed to fetch books from Google Books API. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    
    if (freeEbooksOnly) {
      searchGoogleBooks(); // Use direct Google Books API for free ebooks
    } else {
      // Use backend search which is handled by the useEffect
      const fetchBooks = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const response = await booksAPI.getBooks(currentPage, itemsPerPage, searchQuery);
          setBooks(response.books);
          setTotalPages(response.totalPages);
        } catch (error: any) {
          setError(error.message || 'Failed to fetch books');
          console.error('Error fetching books:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchBooks();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFreeEbooksToggle = () => {
    setFreeEbooksOnly(!freeEbooksOnly);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Browse Books</h1>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
            >
              <FiSearch />
            </button>
          </form>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-gray-200 text-gray-700 p-2 rounded-md hover:bg-gray-300 transition-colors"
              aria-label="Filter"
            >
              {isFilterOpen ? <FiX /> : <FiFilter />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Filter panel */}
      {isFilterOpen && (
        <div className="bg-white p-4 rounded-md shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-3">Filter Books</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* This would be expanded with actual filter options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Genre
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Genres</option>
                <option value="fiction">Fiction</option>
                <option value="non-fiction">Non-Fiction</option>
                <option value="science">Science</option>
                <option value="fantasy">Fantasy</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Price</option>
                <option value="0-10">$0 - $10</option>
                <option value="10-20">$10 - $20</option>
                <option value="20-30">$20 - $30</option>
                <option value="30+">$30+</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <input
                type="checkbox"
                id="freeEbooksOnly"
                checked={freeEbooksOnly}
                onChange={handleFreeEbooksToggle}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="freeEbooksOnly" className="ml-2 block text-sm text-gray-700">
                Show only free eBooks (Google Books API)
              </label>
            </div>
            
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleSearch}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Books grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      ) : books.length > 0 ? (
        <>
          {freeEbooksOnly && (
            <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-md">
              Showing free eBooks from Google Books API.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book: any) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No books found.</p>
          {searchQuery && (
            <p className="mt-2 text-gray-500">
              Try a different search term or {freeEbooksOnly ? 'disable the free eBooks filter' : 'browse all books'}.
            </p>
          )}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && !error && books.length > 0 && !freeEbooksOnly && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'
              }`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 