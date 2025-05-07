'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { booksAPI, cartAPI, ordersAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiCreditCard, FiBook, FiPackage, FiZap, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedBookCover from '../components/AnimatedBookCover';

export default function PurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const bookId = searchParams?.get('bookId');
  const quantity = parseInt(searchParams?.get('quantity') || '1', 10);
  
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [step, setStep] = useState(1);
  const [magicEffect, setMagicEffect] = useState(false);
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    saveCard: false
  });

  // Fetch book data
  useEffect(() => {
    async function loadData() {
      if (!bookId) {
        router.push('/books');
        return;
      }
      
      try {
        const bookData = await booksAPI.getBook(bookId);
        setBook(bookData);
        
        // Calculate price with initial quantity
        const initialPrice = bookData.price * quantity;
        setTotalPrice(initialPrice);
        
        // Set up cart item
        setCartItems([{
          _id: `temp-${Date.now()}`,
          bookId: bookData._id,
          book: bookData,
          quantity: quantity,
          price: bookData.price
        }]);
      } catch (error) {
        console.error('Error loading book data:', error);
        toast.error('Failed to load book information');
      } finally {
        setLoading(false);
      }
    }
    
    if (isAuthenticated) {
      loadData();
    } else {
      router.push(`/login?redirect=/purchase?bookId=${bookId}&quantity=${quantity}`);
    }
  }, [bookId, quantity, isAuthenticated, router]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = cartItems.map(item => ({
      ...item,
      quantity: newQuantity
    }));
    
    setCartItems(updatedItems);
    calculateTotal(updatedItems);
  };
  
  const calculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    setTotalPrice(total);
  };
  
  const handlePaymentInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPaymentInfo({
      ...paymentInfo,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const triggerMagicEffect = () => {
    setMagicEffect(true);
    toast.success('✨ Magic mode activated!', {
      style: {
        background: 'linear-gradient(to right, #00b09b, #96c93d)',
        color: 'white'
      },
      icon: '🪄'
    });
    
    // Reset after animation completes
    setTimeout(() => {
      setMagicEffect(false);
      // Simulate faster checkout by advancing to next step
      if (step === 1) setStep(2);
    }, 1500);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create order data with proper book titles for the backend
      const orderData = {
        items: cartItems.map(item => ({
          bookId: item.bookId,
          title: book.title,  // Add title for better data storage
          quantity: item.quantity,
          price: item.price
        })),
        shippingInfo: {
          name: user?.username || '',
          address: {
            street: '123 Example St',
            city: 'Sample City',
            state: 'ST',
            postalCode: '12345',
            country: 'USA'
          },
          phone: '123-456-7890'
        },
        paymentInfo: {
          method: 'credit_card',
          cardNumber: paymentInfo.cardNumber.replace(/\s/g, '').slice(-4),
          cardholderName: paymentInfo.cardName,
          status: 'completed'
        },
        totalAmount: totalPrice + (totalPrice * 0.08) // Include the tax in total amount
      };
      
      // Show loading toast
      const loadingToast = toast.loading('Processing your order...');
      
      // Save order to MongoDB
      try {
        const response = await ordersAPI.checkout(orderData);
        
        // Success and redirect
        toast.dismiss(loadingToast);
        toast.success('Order placed successfully!');
        
        // Redirect to order details
        setTimeout(() => {
          router.push(`/orders/${response.order?._id || 'latest'}`);
        }, 1000);
      } catch (error) {
        console.error('Error saving order:', error);
        toast.dismiss(loadingToast);
        toast.error('Failed to process your order');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process your order');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-t-green-600 border-green-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your book...</p>
        </motion.div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Book Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the book you're looking for.</p>
          <Link 
            href="/books"
            className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Complete Your Purchase</h1>
          
          {/* Progress steps */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                <FiShoppingCart />
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                <FiCreditCard />
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                <FiCheck />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={step >= 1 ? 'text-green-600 font-medium' : 'text-gray-500'}>Review Order</span>
              <span className={step >= 2 ? 'text-green-600 font-medium' : 'text-gray-500'}>Payment</span>
              <span className={step >= 3 ? 'text-green-600 font-medium' : 'text-gray-500'}>Confirmation</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Book details section */}
            <motion.div 
              className="md:col-span-5 bg-white rounded-lg shadow-md p-6 h-fit"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">Book Details</h2>
              
              <div className="flex space-x-4 mb-6">
                <div className="w-24 h-36 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  <AnimatedBookCover
                    imageUrl={book.imageLinks?.thumbnail || '/book-placeholder.svg'}
                    title={book.title}
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{book.title}</h3>
                  <p className="text-gray-600 text-sm">{book.authors?.join(', ')}</p>
                  
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-gray-700">Price: </span>
                    <span className="text-green-600 font-bold">${book.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="mt-1 text-sm">
                    <span className="font-medium text-gray-700">Category: </span>
                    <span className="text-gray-600">{book.category || 'General'}</span>
                  </div>
                  
                  <div className="mt-4 flex items-center">
                    <button 
                      onClick={() => handleQuantityChange(Math.max(1, cartItems[0].quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="mx-3 font-medium">{cartItems[0].quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(cartItems[0].quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Description</h4>
                <p className="text-gray-600 text-sm line-clamp-4">{book.description || 'No description available.'}</p>
              </div>
              
              <AnimatedButton
                onClick={triggerMagicEffect}
                style="magic"
                className="mt-6 w-full py-2 flex items-center justify-center space-x-2"
              >
                <FiZap className="text-white" />
                <span>Magic Purchase</span>
              </AnimatedButton>
            </motion.div>
            
            {/* Checkout form */}
            <motion.div 
              className="md:col-span-7 bg-white rounded-lg shadow-md"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
                    
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Book</span>
                        <span className="text-gray-800 font-medium">{book.title}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Quantity</span>
                        <span className="text-gray-800 font-medium">{cartItems[0].quantity}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Price per unit</span>
                        <span className="text-gray-800 font-medium">${book.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-800 font-medium">${(book.price * cartItems[0].quantity).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-b border-gray-200 pb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-800 font-medium">$0.00</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-800 font-medium">${(totalPrice * 0.08).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <div className="flex justify-between mb-4">
                        <span className="text-gray-800 font-bold">Total</span>
                        <span className="text-green-600 font-bold text-xl">${(totalPrice + (totalPrice * 0.08)).toFixed(2)}</span>
                      </div>
                      
                      <AnimatedButton
                        onClick={() => setStep(2)}
                        style="primary"
                        className="w-full py-3 flex items-center justify-center"
                      >
                        <span>Proceed to Payment</span>
                        <FiChevronRight className="ml-2" />
                      </AnimatedButton>
                    </div>
                  </motion.div>
                )}
                
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Information</h2>
                    
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label htmlFor="cardNumber" className="block text-gray-700 text-sm font-medium mb-1">Card Number</label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={paymentInfo.cardNumber}
                          onChange={handlePaymentInfoChange}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="cardName" className="block text-gray-700 text-sm font-medium mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          id="cardName"
                          name="cardName"
                          value={paymentInfo.cardName}
                          onChange={handlePaymentInfoChange}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label htmlFor="expiry" className="block text-gray-700 text-sm font-medium mb-1">Expiry Date</label>
                          <input
                            type="text"
                            id="expiry"
                            name="expiry"
                            value={paymentInfo.expiry}
                            onChange={handlePaymentInfoChange}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="cvv" className="block text-gray-700 text-sm font-medium mb-1">CVV</label>
                          <input
                            type="text"
                            id="cvv"
                            name="cvv"
                            value={paymentInfo.cvv}
                            onChange={handlePaymentInfoChange}
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="saveCard"
                            checked={paymentInfo.saveCard}
                            onChange={handlePaymentInfoChange}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">Save this card for future purchases</span>
                        </label>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                        <AnimatedButton
                          type="button"
                          onClick={() => setStep(1)}
                          style="secondary"
                          className="flex-1 py-3"
                        >
                          Back to Review
                        </AnimatedButton>
                        
                        <AnimatedButton
                          type="submit"
                          style="primary"
                          className="flex-1 py-3 flex items-center justify-center"
                          onClick={() => {}}
                        >
                          <FiCheck className="mr-2" />
                          <span>Complete Purchase</span>
                        </AnimatedButton>
                      </div>
                      
                      <div className="mt-4 text-center text-sm text-gray-600">
                        <p>Your card will be charged ${(totalPrice + (totalPrice * 0.08)).toFixed(2)}</p>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Magic animation overlay */}
        <AnimatePresence>
          {magicEffect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-purple-500/30 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.5, rotate: 0 }}
                animate={{ 
                  scale: [0.5, 1.2, 1],
                  rotate: [0, 15, -15, 0]
                }}
                transition={{ duration: 1.2 }}
                className="relative"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <FiZap className="text-white text-4xl" />
                </div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 0, 0.7],
                  }}
                  transition={{ 
                    repeat: 2,
                    duration: 0.7 
                  }}
                  className="absolute inset-0 rounded-full border-4 border-white"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 