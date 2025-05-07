import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const GOOGLE_BOOKS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || 'AIzaSyBtOn5PsETljURB5nKAVVEVOJm_ufcPcBY';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for Google Books API
const googleBooksApi = axios.create({
  baseURL: GOOGLE_BOOKS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Improve request interceptor to include auth token and handle development mode
api.interceptors.request.use(
  (config) => {
    let token;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
      
      // In development mode, always use a mock token
      if (process.env.NODE_ENV === 'development') {
        // Use a consistent token for development mode to simulate real authentication
        if (!token || token.startsWith('mock-token-for-development')) {
          token = 'mock-token-for-development';
          localStorage.setItem('token', token);
        }
        
        // Also set a mock user if not present
        if (!localStorage.getItem('user')) {
          const mockUser = {
            _id: 'mock-user-id',
            username: 'mockuser',
            email: 'mock@example.com',
            role: 'user'
          };
          localStorage.setItem('user', JSON.stringify(mockUser));
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for auto-login in development mode
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-clear authentication on 401 errors - just log them
    if (error.response?.status === 401) {
      console.log('Authentication error (401) - will use development mode fallbacks');
      
      // In development mode, refresh token and retry
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock authentication for development');
        
        // Store mock user and token in localStorage with consistent values
        if (typeof window !== 'undefined') {
          const mockUser = {
            _id: 'mock-user-id',
            username: 'mockuser',
            email: 'mock@example.com',
            role: 'user'
          };
          
          // Use a consistent token
          localStorage.setItem('token', 'mock-token-for-development');
          localStorage.setItem('user', JSON.stringify(mockUser));
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  login: async (credentials: any) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      // For demo purposes, simulate successful login if backend is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock login for development');
        return {
          token: 'mock-token-for-development',
          user: {
            _id: '123',
            username: credentials.email.split('@')[0],
            email: credentials.email,
            role: 'user'
          }
        };
      }
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      // For demo mode
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const user = localStorage.getItem('user');
        if (user) {
          return { user: JSON.parse(user) };
        }
      }
      throw error;
    }
  },
  
  updateProfile: async (profileData: any) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Update localStorage with the new user data
      if (typeof window !== 'undefined' && response.data.user) {
        const currentUserData = localStorage.getItem('user');
        if (currentUserData) {
          const updatedUser = {
            ...JSON.parse(currentUserData),
            ...response.data.user
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // For development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock profile update for development');
        
        // Get current user from localStorage
        if (typeof window !== 'undefined') {
          const currentUserData = localStorage.getItem('user');
          if (currentUserData) {
            // Update local user data with new profile data
            const currentUser = JSON.parse(currentUserData);
            const updatedUser = {
              ...currentUser,
              ...profileData,
              // Don't include password fields in the user object
              currentPassword: undefined,
              newPassword: undefined
            };
            
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            return {
              message: 'Profile updated successfully',
              user: updatedUser
            };
          }
        }
      }
      
      throw error;
    }
  },
  
  logout: async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
};

// Books API calls
export const booksAPI = {
  getBooks: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await api.get('/books', { 
        params: { page, limit, search } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      return { books: [], totalPages: 0, currentPage: 1, total: 0 };
    }
  },
  
  getBook: async (id: string) => {
    try {
      const response = await api.get(`/books/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book details:', error);
      
      // For development mode, return mock book data
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock book details for development');
        return {
          _id: id,
          title: 'Sample Book',
          authors: ['Sample Author'],
          description: 'This is a sample book description for development mode.',
          price: 19.99,
          stock: 10,
          category: 'Fiction',
          imageLinks: {
            thumbnail: '/book-placeholder.svg',
            smallThumbnail: '/book-placeholder.svg'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      throw error;
    }
  },
  
  addBook: async (bookData: FormData) => {
    try {
      const response = await api.post('/books', bookData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding book:', error);
      
      // For development mode, create a mock response
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock book creation for development');
        
        // Extract data from FormData for easier use
        const title = bookData.get('title') as string;
        const authors = bookData.get('authors') as string;
        const price = parseFloat(bookData.get('price') as string) || 0;
        const description = bookData.get('description') as string;
        const category = bookData.get('category') as string;
        const stock = parseInt(bookData.get('stock') as string) || 1;
        
        // Generate a mock book with this data
        const mockBook = {
          _id: `dev-book-${Date.now()}`,
          title,
          authors: authors.split(',').map(a => a.trim()),
          description,
          price,
          stock,
          category,
          imageLinks: {
            thumbnail: '/book-placeholder.svg',
            smallThumbnail: '/book-placeholder.svg'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Store in localStorage to persist between page reloads
        const devBooks = localStorage.getItem('dev_books');
        const books = devBooks ? JSON.parse(devBooks) : [];
        books.push(mockBook);
        localStorage.setItem('dev_books', JSON.stringify(books));
        
        return mockBook;
      }
      
      throw error;
    }
  },
  
  searchGoogleBooks: async (query: string, startIndex = 0, maxResults = 10, filter = '') => {
    try {
      // Try to use the backend endpoint first
      try {
        const response = await api.get('/books/google/search', {
          params: { q: query, startIndex, maxResults, filter }
        });
        return response.data;
      } catch (backendError) {
        console.warn('Failed to fetch from backend, using Google Books API directly', backendError);
        
        // If backend fails, use Google Books API directly
        const response = await googleBooksApi.get('', {
          params: {
            q: query,
            startIndex,
            maxResults,
            filter,
            key: GOOGLE_BOOKS_API_KEY
          }
        });
        
        return {
          books: response.data.items || [],
          totalItems: response.data.totalItems || 0
        };
      }
    } catch (error) {
      console.error('Error searching Google Books:', error);
      return { books: [], totalItems: 0 };
    }
  },
  
  importBook: async (googleBookId: string, data: any) => {
    try {
      const response = await api.post(`/books/import/${googleBookId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error importing book:', error);
      
      // For development mode, create a mock imported book
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock book import for development');
        return {
          _id: `dev_${googleBookId}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      throw error;
    }
  },
  
  updateBook: async (id: string, data: any) => {
    try {
      const response = await api.put(`/books/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  },
  
  deleteBook: async (id: string) => {
    try {
      const response = await api.delete(`/books/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }
};

// Cart API calls with better development mode support
export const cartAPI = {
  getCart: async () => {
    // Check for authentication before making request
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // For development mode, always return mock cart data
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('Using development mode mock cart data');
      
      // Get cart from localStorage or initialize empty
      try {
        const localCart = localStorage.getItem('dev_cart');
        const cart = localCart ? JSON.parse(localCart) : { 
          items: [], 
          totalAmount: 0 
        };
        
        // If cart is empty but we're in development, add a sample book
        if (cart.items.length === 0) {
          cart.items.push({
            _id: 'sample-item-1',
            bookId: 'sample-book-1',
            book: {
              _id: 'sample-book-1',
              title: 'Sample Book',
              authors: ['Sample Author'],
              price: 19.99,
              imageLinks: {
                thumbnail: '/book-placeholder.svg'
              }
            },
            quantity: 1,
            price: 19.99,
            title: 'Sample Book',
            authors: ['Sample Author']
          });
          
          cart.totalAmount = 19.99;
          localStorage.setItem('dev_cart', JSON.stringify(cart));
        } else {
          // Update any existing items to use local image path
          cart.items.forEach((item: any) => {
            if (item.imageUrl && item.imageUrl.includes('placeholder.com')) {
              item.imageUrl = '/book-placeholder.svg';
            }
            if (item.book && item.book.imageLinks && item.book.imageLinks.thumbnail && item.book.imageLinks.thumbnail.includes('placeholder.com')) {
              item.book.imageLinks.thumbnail = '/book-placeholder.svg';
            }
          });
          localStorage.setItem('dev_cart', JSON.stringify(cart));
        }
        
        return { cart };
      } catch (e) {
        console.error('Error with mock cart data:', e);
        // Return empty cart as fallback
        return { 
          cart: { 
            items: [], 
            totalAmount: 0 
          } 
        };
      }
    }
    
    // If no token is available, return empty cart immediately without making API call
    if (!token) {
      console.log('No authentication token found, returning empty cart');
      return { cart: { items: [], totalAmount: 0 } };
    }
    
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Error fetching cart: Status ${error.response.status}`, error.response.data);
        
        // Handle 401 unauthorized specially - but don't clear tokens
        if (error.response.status === 401) {
          console.warn('Authentication error: User may not be logged in');
          
          // Return empty cart on auth errors instead of clearing tokens
          return { cart: { items: [], totalAmount: 0 } };
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error fetching cart: No response received', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error fetching cart:', error.message);
      }
      
      // Development mode fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock cart data in development mode');
        // Get cart from localStorage or initialize empty
        const localCart = localStorage.getItem('dev_cart');
        try {
          const cart = localCart ? JSON.parse(localCart) : { items: [], totalAmount: 0 };
          return { cart };
        } catch (e) {
          console.error('Error parsing local cart data:', e);
          return { cart: { items: [], totalAmount: 0 } };
        }
      }
      
      return { cart: { items: [], totalAmount: 0 } };
    }
  },
  
  addToCart: async (bookId: string, quantity = 1) => {
    try {
      const response = await api.post('/cart/add', { bookId, quantity });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Development mode fallback
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('Using local cart in development mode for adding item');
        
        // Get cart from localStorage or initialize empty
        const localCart = localStorage.getItem('dev_cart');
        const cart = localCart ? JSON.parse(localCart) : { items: [], totalAmount: 0 };
        
        // Create a mock item
        const newItem = {
          _id: `local_${Date.now()}`,
          bookId,
          title: 'Book Title', 
          authors: ['Author'],
          price: 9.99,
          quantity,
          imageUrl: '/book-placeholder.svg'
        };
        
        // Add to cart
        cart.items.push(newItem);
        cart.totalAmount = cart.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
        
        // Save to localStorage
        localStorage.setItem('dev_cart', JSON.stringify(cart));
        
        return { success: true, cart };
      }
      
      throw error;
    }
  },
  
  updateCartItem: async (itemId: string, quantity: number) => {
    try {
      const response = await api.put(`/cart/update/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      
      // Development mode fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using local cart in development mode for updating item');
        
        // Get cart from localStorage
        const localCart = localStorage.getItem('dev_cart');
        if (!localCart) {
          return { cart: { items: [], totalAmount: 0 } };
        }
        
        const cart = JSON.parse(localCart);
        
        // Find and update item
        const itemIndex = cart.items.findIndex((item: any) => item._id === itemId);
        if (itemIndex !== -1) {
          cart.items[itemIndex].quantity = quantity;
          cart.totalAmount = cart.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
          
          // Save to localStorage
          localStorage.setItem('dev_cart', JSON.stringify(cart));
        }
        
        return { success: true, cart };
      }
      
      throw error;
    }
  },
  
  removeFromCart: async (itemId: string) => {
    try {
      const response = await api.delete(`/cart/remove/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      
      // Development mode fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using local cart in development mode for removing item');
        
        // Get cart from localStorage
        const localCart = localStorage.getItem('dev_cart');
        if (!localCart) {
          return { cart: { items: [], totalAmount: 0 } };
        }
        
        const cart = JSON.parse(localCart);
        
        // Remove item
        cart.items = cart.items.filter((item: any) => item._id !== itemId);
        cart.totalAmount = cart.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
        
        // Save to localStorage
        localStorage.setItem('dev_cart', JSON.stringify(cart));
        
        return { success: true, cart };
      }
      
      throw error;
    }
  },
  
  clearCart: async () => {
    try {
      const response = await api.delete('/cart/clear');
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      
      // Development mode fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using local cart in development mode for clearing cart');
        
        // Clear cart in localStorage
        localStorage.setItem('dev_cart', JSON.stringify({ items: [], totalAmount: 0 }));
        
        return { success: true, cart: { items: [], totalAmount: 0 } };
      }
      
      throw error;
    }
  }
};

// Orders API calls
export const ordersAPI = {
  async checkout(orderData: any) {
    try {
      const response = await api.post('/orders/checkout', orderData);
      
      // Store order in localStorage regardless of successful API call
      // This ensures we have the data even in development mode
      if (typeof window !== 'undefined') {
        const recentOrders = localStorage.getItem('recentOrders');
        const orders = recentOrders ? JSON.parse(recentOrders) : [];
        
        // Create an order object that matches our schema
        const newOrder = {
          _id: response.data?.order?._id || `order-${Date.now()}`,
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!)._id : 'mock-user-id',
          items: orderData.items.map((item: any) => ({
            book: item.bookId,
            title: item.title || "Unknown Book",
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: orderData.totalAmount,
          shipping: orderData.shippingInfo,
          payment: {
            method: orderData.paymentInfo.method,
            transactionId: `TXN-${Date.now()}`,
            status: 'completed',
            amount: orderData.totalAmount,
            paymentDate: new Date().toISOString()
          },
          status: 'processing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add to beginning of orders array
        orders.unshift(newOrder);
        
        // Save to localStorage
        localStorage.setItem('recentOrders', JSON.stringify(orders));
      }
      
      return response.data;
    } catch (error) {
      console.error('Checkout error:', error);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock order in development mode');
        
        // Create mock order response with order ID
        const mockOrderId = `order-${Date.now()}`;
        
        // Save order to localStorage
        if (typeof window !== 'undefined') {
          const recentOrders = localStorage.getItem('recentOrders');
          const orders = recentOrders ? JSON.parse(recentOrders) : [];
          
          // Create mock order data
          const mockOrder = {
            _id: mockOrderId,
            orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
            user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!)._id : 'mock-user-id',
            items: orderData.items.map((item: any) => ({
              book: item.bookId,
              title: item.title || "Unknown Book",
              quantity: item.quantity,
              price: item.price
            })),
            totalAmount: orderData.totalAmount,
            shipping: orderData.shippingInfo,
            payment: {
              method: orderData.paymentInfo.method,
              transactionId: `TXN-${Date.now()}`,
              status: 'completed',
              amount: orderData.totalAmount,
              paymentDate: new Date().toISOString()
            },
            status: 'processing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Add to beginning of orders array
          orders.unshift(mockOrder);
          
          // Save to localStorage
          localStorage.setItem('recentOrders', JSON.stringify(orders));
        }
        
        // Return mock success response
        return {
          success: true,
          order: {
            _id: mockOrderId,
            ...orderData,
            status: 'processing',
            createdAt: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  },

  async getUserOrders() {
    try {
      const response = await api.get('/orders');
      
      // In development mode, also save the response to localStorage for persistence
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        localStorage.setItem('recentOrders', JSON.stringify(response.data.orders));
      }
      
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock orders in development mode');
        // Get saved orders from localStorage in development mode
        if (typeof window !== 'undefined') {
          // Initialize orders array in localStorage if it doesn't exist
          if (!localStorage.getItem('recentOrders')) {
            localStorage.setItem('recentOrders', JSON.stringify([
              {
                _id: `order-${Date.now()}`,
                orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
                createdAt: new Date().toISOString(),
                status: 'processing',
                paymentStatus: 'paid',
                totalAmount: 49.98,
                items: [
                  {
                    quantity: 1,
                    price: 24.99,
                    book: {
                      _id: 'book1',
                      title: 'Sample Book',
                      authors: ['Author Name'],
                      imageLinks: {
                        thumbnail: '/book-placeholder.svg',
                        smallThumbnail: '/book-placeholder.svg'
                      }
                    }
                  }
                ]
              }
            ]));
          }
          
          const recentOrders = localStorage.getItem('recentOrders');
          if (recentOrders) {
            return { orders: JSON.parse(recentOrders) };
          }
        }
        
        // Return empty orders array as fallback
        return { orders: [] };
      }
      throw error;
    }
  },

  async getOrderById(orderId: string) {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock order in development mode');
        
        // Try to find the order in localStorage
        if (typeof window !== 'undefined') {
          const recentOrders = localStorage.getItem('recentOrders');
          if (recentOrders) {
            const orders = JSON.parse(recentOrders);
            const order = orders.find((order: any) => order._id === orderId);
            
            if (order) {
              return { order };
            }
          }
        }
        
        // If not found in localStorage, create a sample order
        return { 
          order: {
            _id: orderId,
            orderNumber: `ORD-${orderId.slice(-6)}`,
            createdAt: new Date().toISOString(),
            totalAmount: 54.97,
            status: 'processing',
            paymentStatus: 'paid',
            shipping: {
              name: 'John Doe',
              address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'USA'
              },
              phone: '123-456-7890'
            },
            payment: {
              method: 'credit_card',
              transactionId: `TX${Date.now()}`,
              status: 'completed'
            },
            items: [
              {
                quantity: 1,
                price: 29.99,
                book: {
                  _id: 'book1',
                  title: 'Sample Book',
                  authors: ['Author Name'],
                  imageLinks: {
                    smallThumbnail: 'https://books.google.com/books/content?id=iXn5U2IzVH0C&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api'
                  }
                }
              }
            ]
          }
        };
      }
      throw error;
    }
  },

  async updatePayment(orderId: string, paymentData: any) {
    try {
      const response = await api.put(`/orders/${orderId}/payment`, paymentData);
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock payment update in development mode');
        // Mock successful payment update in development
        return {
          success: true,
          order: {
            _id: orderId,
            payment: {
              ...paymentData,
              updatedAt: new Date().toISOString()
            }
          }
        };
      }
      throw error;
    }
  },
  
  // Admin only
  getAllOrders: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/orders/admin/all', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return { orders: [], totalPages: 0, currentPage: 1, total: 0 };
    }
  },
  
  updateOrderStatus: async (id: string, status: string) => {
    try {
      const response = await api.put(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
};

export default api; 