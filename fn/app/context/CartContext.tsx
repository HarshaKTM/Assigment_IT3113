'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';

// Define types
interface CartItem {
  _id: string;
  bookId: string;
  book: any;
  title: string;
  authors: string[];
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Cart {
  items: CartItem[];
  totalAmount: number;
}

interface CartContextType {
  cart: Cart;
  totalItems: number;
  totalAmount: number;
  loading: boolean;
  addToCart: (bookId: string, quantity: number) => Promise<any>;
  updateCartItem: (itemId: string, quantity: number) => Promise<any>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<any>;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Context provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [], totalAmount: 0 });
  const [totalItems, setTotalItems] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize cart from API
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await cartAPI.getCart();
        setCart(data?.cart || { items: [], totalAmount: 0 });
        calculateTotals(data?.cart?.items || []);
      } catch (error: any) {
        console.error('Error fetching cart:', error);
        
        // Handle 401 unauthorized errors specifically
        if (error?.response?.status === 401) {
          console.log('Authentication error when fetching cart. User might not be logged in.');
          
          // Clear auth token if it exists but is invalid
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
        }
        
        // Initialize empty cart on any error
        setCart({ items: [], totalAmount: 0 });
        setTotalItems(0);
        setTotalAmount(0);
      }
    };

    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Only fetch cart if user is authenticated (token exists)
    if (token) {
      fetchCart();
    } else {
      // Clear cart if not authenticated
      setCart({ items: [], totalAmount: 0 });
      setTotalItems(0);
      setTotalAmount(0);
    }
  }, []);

  // Calculate cart totals
  const calculateTotals = (items: CartItem[]) => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const amount = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    setTotalItems(itemCount);
    setTotalAmount(amount);
  };

  // Refresh cart with better error handling
  const refreshCart = async () => {
    try {
      const data = await cartAPI.getCart();
      setCart(data?.cart || { items: [], totalAmount: 0 });
      calculateTotals(data?.cart?.items || []);
      return data;
    } catch (error: any) {
      console.error('Error refreshing cart:', error);
      
      // Handle 401 unauthorized errors specifically
      if (error?.response?.status === 401) {
        console.log('Authentication error when refreshing cart. User might not be logged in.');
        
        // Clear local cart state
        setCart({ items: [], totalAmount: 0 });
        setTotalItems(0);
        setTotalAmount(0);
        
        // Clear auth token if it exists but is invalid
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
      
      return null;
    }
  };

  // Add an item to the cart
  const addToCart = async (bookId: string, quantity: number) => {
    setLoading(true);
    try {
      console.log(`Adding book to cart: ${bookId} with quantity: ${quantity}`);
      const data = await cartAPI.addToCart(bookId, quantity);
      
      // Update state with the response data
      if (data && data.cart && data.cart.items) {
        setCart(data.cart);
        calculateTotals(data.cart.items);
      } else if (process.env.NODE_ENV === 'development') {
        // In case the data structure is different in development mode
        await refreshCart();
      }
      
      console.log('Book added to cart successfully');
      return data;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const data = await cartAPI.updateCartItem(itemId, quantity);
      
      if (data && data.cart && data.cart.items) {
        setCart(data.cart);
        calculateTotals(data.cart.items);
      } else {
        // In case the data structure is different, refresh the cart
        await refreshCart();
      }
      
      return data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Remove an item from the cart
  const removeFromCart = async (itemId: string) => {
    setLoading(true);
    try {
      const data = await cartAPI.removeFromCart(itemId);
      
      if (data && data.cart && data.cart.items) {
        setCart(data.cart);
        calculateTotals(data.cart.items);
      } else {
        // In case the data structure is different, refresh the cart
        await refreshCart();
      }
      
      return data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear the entire cart
  const clearCart = async () => {
    setLoading(true);
    try {
      const data = await cartAPI.clearCart();
      
      if (data && data.cart) {
        setCart({ items: [], totalAmount: 0 });
        setTotalItems(0);
        setTotalAmount(0);
      } else {
        // In case the data structure is different, refresh the cart
        await refreshCart();
      }
      
      return data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      totalItems,
      totalAmount,
      loading,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 