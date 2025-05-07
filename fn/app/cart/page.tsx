'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, totalItems, totalAmount, updateCartItem, removeFromCart, clearCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleQuantityChange = async (itemId: string, quantity: number, maxStock: number = 10) => {
    const newQuantity = Math.max(1, Math.min(quantity, maxStock));
    await updateCartItem(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  // Simple direct navigation method to ensure checkout button always works
  const handleCheckoutClick = () => {
    try {
      // Set loading state
      setCheckingOut(true);
      
      // Show loading toast
      toast.loading('Proceeding to checkout...', { id: 'checkout-process' });
      
      // Direct DOM navigation is more reliable than router.push()
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Error navigating to checkout. Please try again.');
      setCheckingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:flex md:items-center p-8">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                <FiShoppingCart className="text-blue-600 text-3xl" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Sign In to View Your Cart</h1>
            <p className="text-gray-600 mb-8">Please log in to access your cart and continue shopping.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/login" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg w-full sm:w-auto text-center"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-all w-full sm:w-auto text-center"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-8">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                <FiShoppingBag className="text-blue-600 text-3xl" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Find your next favorite books in our collection!</p>
            <Link 
              href="/books" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all inline-block shadow-md hover:shadow-lg"
            >
              Browse Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Your Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Cart Items ({totalItems})
              </h2>
              <button
                onClick={handleClearCart}
                disabled={loading}
                className="text-red-600 hover:text-red-800 transition-colors focus:outline-none flex items-center px-4 py-2 rounded-lg hover:bg-red-50"
              >
                <FiTrash2 className="mr-2" />
                Clear Cart
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {cart.items && Array.isArray(cart.items) && cart.items.map((item) => (
                <div key={item._id} className="py-6 flex flex-col sm:flex-row gap-4">
                  {/* Book Image */}
                  <div className="flex-shrink-0 w-full sm:w-24 h-32 mb-4 sm:mb-0 relative bg-gray-100 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-1">📚</div>
                          <div className="text-xs">No Image</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Book Info */}
                  <div className="flex-grow flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">
                        <Link href={`/books/${item.bookId}`} className="hover:text-blue-600 transition-colors">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {item.authors?.join(', ') || 'Unknown Author'}
                      </p>
                      <p className="font-medium text-blue-600 mt-2">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-3">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || loading}
                          className="p-2 border border-gray-300 rounded-l-lg bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus size={16} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={10}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                          className="w-12 text-center p-2 border-t border-b border-gray-300 bg-white"
                          aria-label="Quantity"
                        />
                        <button
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                          disabled={item.quantity >= 10 || loading}
                          className="p-2 border border-gray-300 rounded-r-lg bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
                          aria-label="Increase quantity"
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        disabled={loading}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors focus:outline-none flex items-center"
                        aria-label="Remove item"
                      >
                        <FiTrash2 className="mr-1" size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-100">
              <Link 
                href="/books" 
                className="text-blue-600 hover:text-blue-800 transition-colors flex items-center font-medium"
              >
                <FiChevronLeft className="mr-2" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 pb-4 border-b border-gray-100">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="font-medium">${(totalAmount * 0.1).toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-blue-600">${(totalAmount * 1.1).toFixed(2)}</span>
              </div>
            </div>
            
            {/* New reliable checkout button with <a> tag as fallback */}
            <button
              onClick={handleCheckoutClick}
              disabled={loading || checkingOut || !cart?.items?.length}
              className={`w-full mt-8 ${
                loading || checkingOut || !cart?.items?.length ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-medium py-4 px-6 rounded-lg transition-all flex justify-center items-center shadow-md hover:shadow-lg`}
            >
              {checkingOut ? (
                <>
                  <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>Proceed to Checkout</span>
                  <FiArrowRight className="ml-2" />
                </>
              )}
            </button>
            
            {/* Fallback link in case button fails */}
            <div className="mt-4 text-center">
              <a 
                href="/checkout"
                className="text-blue-600 hover:underline text-sm"
                onClick={(e) => {
                  if (checkingOut) {
                    e.preventDefault(); // Don't follow link if already checking out
                  }
                }}
              >
                Having trouble? Click here to continue
              </a>
            </div>
            
            <p className="text-gray-500 text-sm text-center mt-4">
              Secure payment processing provided
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 