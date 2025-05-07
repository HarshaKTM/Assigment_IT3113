'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiChevronLeft, FiCreditCard, FiMapPin, FiCheck, FiLock, FiShoppingBag, FiShield } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, booksAPI } from '../services/api';
import toast from 'react-hot-toast';

interface DirectPurchaseItem {
  book: any;
  bookId: string;
  quantity: number;
  price: number;
}

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, refreshCart, totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  // Handle direct purchase parameters
  const bookId = searchParams?.get('bookId');
  const quantity = parseInt(searchParams?.get('quantity') || '1', 10);
  
  const [directPurchaseItem, setDirectPurchaseItem] = useState<DirectPurchaseItem | null>(null);
  const [isDirectPurchase, setIsDirectPurchase] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA'
    },
    phone: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'credit_card',
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    status: 'pending'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load book data for direct purchase
  useEffect(() => {
    const loadBookData = async () => {
      if (bookId) {
        setLoadingBook(true);
        try {
          const bookData = await booksAPI.getBook(bookId);
          setDirectPurchaseItem({
            book: bookData,
            bookId: bookData._id,
            quantity: quantity,
            price: bookData.price
          });
          setIsDirectPurchase(true);
        } catch (error) {
          console.error('Error loading book:', error);
          toast.error('Could not load book information');
          router.push('/books');
        } finally {
          setLoadingBook(false);
        }
      }
    };
    
    if (bookId) {
      loadBookData();
    }
  }, [bookId, quantity, router]);

  // Check authentication status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isAuthenticated) {
        const redirectUrl = bookId 
          ? `/login?redirect=/checkout?bookId=${bookId}&quantity=${quantity}`
          : '/login?redirect=/cart';
        router.push(redirectUrl);
      } else if (!isDirectPurchase && (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0)) {
        router.push('/cart');
      }
      
      // Pre-fill user information if available
      if (user) {
        setShippingInfo(prev => ({
          ...prev,
          name: user.username || ''
        }));
      }
    }
  }, [isAuthenticated, cart, router, isDirectPurchase, bookId, quantity, user]);

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: <FiCreditCard className="mr-2" /> },
    { id: 'paypal', name: 'PayPal', icon: <img src="/paypal.svg" alt="PayPal" className="h-5 mr-2" /> },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: <FiShield className="mr-2" /> }
  ];

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setShippingInfo({
        ...shippingInfo,
        [parent]: {
          ...shippingInfo[parent as keyof typeof shippingInfo],
          [child]: value
        }
      });
    } else {
      setShippingInfo({
        ...shippingInfo,
        [name]: value
      });
    }
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentInfo({
      ...paymentInfo,
      [name]: value
    });
  };

  const validateShipping = () => {
    const newErrors: Record<string, string> = {};
    
    if (!shippingInfo.name.trim()) {
      newErrors['name'] = 'Name is required';
    }
    
    if (!shippingInfo.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }
    
    if (!shippingInfo.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }
    
    if (!shippingInfo.address.state.trim()) {
      newErrors['address.state'] = 'State is required';
    }
    
    if (!shippingInfo.address.postalCode.trim()) {
      newErrors['address.postalCode'] = 'Postal code is required';
    }
    
    if (!shippingInfo.phone.trim()) {
      newErrors['phone'] = 'Phone number is required';
    } else if (!/^\d{10}$/.test(shippingInfo.phone.replace(/\D/g, ''))) {
      newErrors['phone'] = 'Valid phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors: Record<string, string> = {};
    
    if (paymentInfo.method === 'credit_card') {
      if (!paymentInfo.cardNumber.trim()) {
        newErrors['cardNumber'] = 'Card number is required';
      } else if (!/^\d{16}$/.test(paymentInfo.cardNumber.replace(/\s/g, ''))) {
        newErrors['cardNumber'] = 'Valid card number is required';
      }
      
      if (!paymentInfo.cardholderName.trim()) {
        newErrors['cardholderName'] = 'Cardholder name is required';
      }
      
      if (!paymentInfo.expiryDate.trim()) {
        newErrors['expiryDate'] = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(paymentInfo.expiryDate)) {
        newErrors['expiryDate'] = 'Use MM/YY format';
      }
      
      if (!paymentInfo.cvv.trim()) {
        newErrors['cvv'] = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(paymentInfo.cvv)) {
        newErrors['cvv'] = 'Valid CVV is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateShipping()) {
        setStep(2);
        setErrors({});
      }
    }
  };

  const handlePreviousStep = () => {
    if (step === 2) {
      setStep(1);
      setErrors({});
    }
  };

  const handlePlaceOrder = async () => {
    if (!validatePayment()) return;
    
    // Check if we have items (either from cart or direct purchase)
    const hasCartItems = cart && cart.items && cart.items.length > 0;
    const hasDirectItem = isDirectPurchase && directPurchaseItem;
    
    if (!hasCartItems && !hasDirectItem) {
      toast.error('No items to purchase. Please add items before checkout.');
      router.push('/books');
      return;
    }
    
    setLoading(true);
    
    try {
      // Show processing animation
      toast.loading('Creating your order...', { id: 'order-processing' });
      
      // Create an order with complete data
      const items = isDirectPurchase && directPurchaseItem 
        ? [{ 
            book: directPurchaseItem.bookId,
            quantity: directPurchaseItem.quantity,
            price: directPurchaseItem.price
          }]
        : (cart?.items || []).map(item => ({
            book: item.bookId || (typeof item.book === 'object' ? item.book._id : item.book),
            quantity: item.quantity,
            price: item.price
          }));
          
      const totalAmount = isDirectPurchase && directPurchaseItem
        ? directPurchaseItem.price * directPurchaseItem.quantity
        : cart?.totalAmount || 0;
        
      const orderData = {
        shipping: shippingInfo,
        payment: {
          method: paymentInfo.method,
          status: 'pending',
          cardDetails: paymentInfo.method === 'credit_card' ? {
            lastFourDigits: paymentInfo.cardNumber.replace(/\s/g, '').slice(-4),
            expiryDate: paymentInfo.expiryDate
          } : null
        },
        items: items,
        totalAmount: totalAmount
      };
      
      console.log("Submitting order data:", JSON.stringify(orderData));
      
      // Create the order
      const response = await ordersAPI.checkout(orderData);
      
      if (!response || !response.order || !response.order._id) {
        throw new Error('Invalid response from server. Order was not created properly.');
      }
      
      const orderId = response.order._id;
      
      // Store order info in localStorage for backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastOrderId', orderId);
        localStorage.setItem('lastOrderAmount', String(totalAmount));
        localStorage.setItem('lastShippingInfo', JSON.stringify(shippingInfo));
      }
      
      // Show success message
      toast.success('Order created successfully!', { id: 'order-processing' });
      
      // Navigate to payment page with order details and stay_on_page parameter
      const paymentUrl = `/checkout/payment?orderId=${orderId}&amount=${totalAmount}&stay_on_page=true`;
      
      try {
        // Use direct window location for most reliable navigation
        window.location.href = paymentUrl;
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to router
        router.push(paymentUrl);
      }
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order. Please try again.';
      toast.error(errorMessage, { id: 'order-processing' });
      setLoading(false);
    }
  };

  // Calculate the order summary
  const getOrderSummary = () => {
    if (isDirectPurchase && directPurchaseItem) {
      const { book, quantity, price } = directPurchaseItem;
      const subtotal = price * quantity;
      const shipping = 4.99;
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + shipping + tax;
      
      return {
        items: [{
          _id: book._id,
          title: book.title,
          price,
          quantity,
          subtotal
        }],
        subtotal,
        shipping,
        tax,
        total
      };
    }
    
    // Regular cart checkout
    if (cart && cart.items) {
      const subtotal = cart.totalAmount || 0;
      const shipping = 4.99;
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + shipping + tax;
      
      return {
        items: cart.items.map((item: any) => ({
          _id: item.bookId,
          title: item.book?.title || 'Book',
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        subtotal,
        shipping,
        tax,
        total
      };
    }
    
    return null;
  };

  const orderSummary = getOrderSummary();
  
  if (loadingBook) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading checkout information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={isDirectPurchase ? `/books/${bookId}` : "/cart"} className="text-green-600 hover:underline flex items-center group">
          <FiChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
          {isDirectPurchase ? 'Back to Book' : 'Back to Cart'}
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Checkout</h1>
      
      {/* Security Badge */}
      <div className="mb-8 flex items-center justify-center lg:justify-start p-3 bg-gray-50 border border-gray-200 rounded-lg w-full lg:w-auto">
        <FiLock className="text-green-600 mr-2" />
        <span className="text-sm text-gray-600">Secure Checkout - Your data is protected</span>
      </div>
      
      {/* Checkout Steps */}
      <div className="mb-10">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
          } transition-colors duration-300`}>
            {step > 1 ? <FiCheck /> : 1}
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            step > 1 ? 'bg-green-600' : 'bg-gray-200'
          } transition-colors duration-300`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
          } transition-colors duration-300`}>
            {step > 2 ? <FiCheck /> : 2}
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            step > 2 ? 'bg-green-600' : 'bg-gray-200'
          } transition-colors duration-300`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
          } transition-colors duration-300`}>
            3
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-center w-1/3">
            <p className={`${step >= 1 ? 'text-green-600 font-medium' : 'text-gray-600'} transition-colors duration-300`}>Shipping</p>
          </div>
          <div className="text-center w-1/3">
            <p className={`${step >= 2 ? 'text-green-600 font-medium' : 'text-gray-600'} transition-colors duration-300`}>Payment</p>
          </div>
          <div className="text-center w-1/3">
            <p className={`${step >= 3 ? 'text-green-600 font-medium' : 'text-gray-600'} transition-colors duration-300`}>Confirmation</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          {/* Shipping Information - Step 1 */}
          {step === 1 && (
            <div 
              className="animate-fadeIn bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <FiMapPin className="text-green-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Shipping Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={shippingInfo.name}
                    onChange={handleShippingChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="mt-1 text-red-500 text-sm">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="address.street">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={shippingInfo.address.street}
                    onChange={handleShippingChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors['address.street'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123 Main St"
                  />
                  {errors['address.street'] && <p className="mt-1 text-red-500 text-sm">{errors['address.street']}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="address.city">
                      City
                    </label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      value={shippingInfo.address.city}
                      onChange={handleShippingChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors['address.city'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="New York"
                    />
                    {errors['address.city'] && <p className="mt-1 text-red-500 text-sm">{errors['address.city']}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="address.state">
                      State
                    </label>
                    <input
                      type="text"
                      id="address.state"
                      name="address.state"
                      value={shippingInfo.address.state}
                      onChange={handleShippingChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors['address.state'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="NY"
                    />
                    {errors['address.state'] && <p className="mt-1 text-red-500 text-sm">{errors['address.state']}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="address.postalCode">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="address.postalCode"
                      name="address.postalCode"
                      value={shippingInfo.address.postalCode}
                      onChange={handleShippingChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors['address.postalCode'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="10001"
                    />
                    {errors['address.postalCode'] && <p className="mt-1 text-red-500 text-sm">{errors['address.postalCode']}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="address.country">
                      Country
                    </label>
                    <input
                      type="text"
                      id="address.country"
                      name="address.country"
                      value={shippingInfo.address.country}
                      onChange={handleShippingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="USA"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleShippingChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(123) 456-7890"
                  />
                  {errors.phone && <p className="mt-1 text-red-500 text-sm">{errors.phone}</p>}
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleNextStep}
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors w-full md:w-auto flex items-center justify-center"
                >
                  Continue to Payment
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Payment Information - Step 2 */}
          {step === 2 && (
            <div 
              className="animate-fadeIn bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200"
            >
              <div className="flex items-center mb-6">
                <FiCreditCard className="text-green-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold">Payment Information</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="method">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {paymentMethods.map(method => (
                      <div 
                        key={method.id}
                        className={`border rounded-md p-4 cursor-pointer transition-all ${
                          paymentInfo.method === method.id 
                            ? 'border-green-500 bg-green-50 shadow-sm' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                        onClick={() => setPaymentInfo({...paymentInfo, method: method.id})}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                            paymentInfo.method === method.id ? 'border-green-600' : 'border-gray-400'
                          }`}>
                            {paymentInfo.method === method.id && (
                              <div className="w-3 h-3 rounded-full bg-green-600"></div>
                            )}
                          </div>
                          <div className="flex items-center">
                            {method.icon}
                            <span>{method.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {paymentInfo.method === 'credit_card' && (
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2" htmlFor="cardNumber">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={paymentInfo.cardNumber}
                            onChange={handlePaymentChange}
                            className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="4242 4242 4242 4242"
                          />
                          <FiCreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        {errors.cardNumber && <p className="mt-1 text-red-500 text-sm">{errors.cardNumber}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-2" htmlFor="cardholderName">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          id="cardholderName"
                          name="cardholderName"
                          value={paymentInfo.cardholderName}
                          onChange={handlePaymentChange}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="John Doe"
                        />
                        {errors.cardholderName && <p className="mt-1 text-red-500 text-sm">{errors.cardholderName}</p>}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2" htmlFor="expiryDate">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            value={paymentInfo.expiryDate}
                            onChange={handlePaymentChange}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                              errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="MM/YY"
                          />
                          {errors.expiryDate && <p className="mt-1 text-red-500 text-sm">{errors.expiryDate}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 font-medium mb-2" htmlFor="cvv">
                            CVV
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="cvv"
                              name="cvv"
                              value={paymentInfo.cvv}
                              onChange={handlePaymentChange}
                              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                errors.cvv ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="123"
                              maxLength={4}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <FiLock className="text-gray-400" />
                            </div>
                          </div>
                          {errors.cvv && <p className="mt-1 text-red-500 text-sm">{errors.cvv}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentInfo.method === 'paypal' && (
                  <div className="bg-green-50 p-6 rounded-md border border-green-200 text-center">
                    <img src="/paypal-large.svg" alt="PayPal" className="h-10 mx-auto mb-4" />
                    <p className="text-gray-700 mb-4">
                      You will be redirected to PayPal to complete your payment after reviewing your order.
                    </p>
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <FiShield className="mr-1" /> Secure payment processing
                    </div>
                  </div>
                )}
                
                {paymentInfo.method === 'bank_transfer' && (
                  <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                    <p className="text-gray-700 mb-4">
                      Bank details will be provided after placing your order. Your order will be processed after payment confirmation.
                    </p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Note: Orders paid by bank transfer may take 1-3 business days to process after payment is received.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Shipping
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-md transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiLock className="mr-2" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div 
            className="animate-fadeIn bg-white rounded-lg shadow-md p-6 sticky top-4 border border-gray-200"
          >
            <div className="flex items-center mb-6">
              <FiShoppingBag className="text-green-600 mr-2" />
              <h2 className="text-xl font-semibold">Order Summary</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2 flex justify-between">
                <span>Items ({(cart?.items || []).reduce((acc, item) => acc + item.quantity, 0)})</span>
                <button className="text-green-600 text-sm hover:underline">Edit</button>
              </p>
              <div className="max-h-48 overflow-y-auto mb-4 pr-2">
                {(cart?.items || []).map((item) => (
                  <div key={item._id} className="flex items-center py-2 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors rounded-md">
                    <div className="w-10 h-14 bg-gray-200 rounded overflow-hidden mr-3 flex-shrink-0">
                      {item.book?.imageLinks?.smallThumbnail ? (
                        <img 
                          src={item.book.imageLinks.smallThumbnail} 
                          alt={item.book.title || 'Book cover'}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">No image</div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium truncate">{item.book?.title || 'Untitled Book'}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${(cart?.totalAmount || 0).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${((cart?.totalAmount || 0) * 0.1).toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>${((cart?.totalAmount || 0) * 1.1).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center mb-4 bg-green-50 p-2 rounded-md">
                <FiCheck className="text-green-500 mr-2" />
                <span className="text-sm text-green-700">Free shipping eligible</span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                <div className="h-6 px-2 py-1 bg-green-50 rounded-md flex items-center">
                  <span className="text-green-700 text-xs font-medium">VISA</span>
                </div>
                <div className="h-6 px-2 py-1 bg-green-50 rounded-md flex items-center">
                  <span className="text-green-700 text-xs font-medium">MasterCard</span>
                </div>
                <div className="h-6 px-2 py-1 bg-green-50 rounded-md flex items-center">
                  <span className="text-green-700 text-xs font-medium">AmEx</span>
                </div>
                <div className="h-6 px-2 py-1 bg-green-50 rounded-md flex items-center">
                  <span className="text-green-700 text-xs font-medium">PayPal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 