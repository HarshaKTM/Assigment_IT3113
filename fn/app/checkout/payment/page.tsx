'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiCreditCard, FiLock, FiShield, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, cartAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading, user } = useAuth();
  
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'credit_card',
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    saveCard: false
  });
  
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    amount: 0,
    tax: 0,
    total: 0
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  // Get order ID from URL query
  useEffect(() => {
    const fetchOrderDetails = () => {
      try {
        const orderId = searchParams?.get('orderId');
        const amount = parseFloat(searchParams?.get('amount') || '0');
        const shouldStayOnPage = searchParams?.get('stay_on_page') === 'true';
        
        console.log("Payment page parameters:", { orderId, amount, shouldStayOnPage });
        
        // First try to use URL parameters
        if (orderId && amount > 0) {
          setOrderDetails({
            orderId,
            amount,
            tax: amount * 0.1,
            total: amount * 1.1
          });
          
          // Store in localStorage for safety
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastOrderId', orderId);
            localStorage.setItem('lastOrderAmount', String(amount));
          }
          
          return; // Successfully got order details from URL
        }
        
        // If URL parameters are missing, try to get from localStorage
        if (typeof window !== 'undefined') {
          const lastOrderId = localStorage.getItem('lastOrderId');
          const lastOrderAmount = parseFloat(localStorage.getItem('lastOrderAmount') || '0');
          
          if (lastOrderId && lastOrderAmount > 0) {
            console.log("Using order details from localStorage:", { lastOrderId, lastOrderAmount });
            setOrderDetails({
              orderId: lastOrderId,
              amount: lastOrderAmount,
              tax: lastOrderAmount * 0.1,
              total: lastOrderAmount * 1.1
            });
            
            // If we recovered from localStorage and stay_on_page is true, update URL
            if (shouldStayOnPage) {
              const newUrl = `/checkout/payment?orderId=${lastOrderId}&amount=${lastOrderAmount}&stay_on_page=true`;
              window.history.replaceState({}, '', newUrl);
            }
            
            return; // Successfully got order details from localStorage
          }
        }
        
        // If still no valid order data and in development mode, use mock data
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
          const mockOrderId = `dev-order-${Date.now()}`;
          const mockAmount = 99.99;
          console.log("Using mock order details for development:", { mockOrderId, mockAmount });
          
          setOrderDetails({
            orderId: mockOrderId,
            amount: mockAmount,
            tax: mockAmount * 0.1,
            total: mockAmount * 1.1
          });
          
          // Save to localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastOrderId', mockOrderId);
            localStorage.setItem('lastOrderAmount', mockAmount.toString());
          }
          return; // Successfully created mock order for development
        }
        
        // Only show a warning message - don't redirect automatically
        console.warn('Missing order parameters, showing warning message');
        toast.error('Order information is missing. Please fill in payment details anyway or go back to checkout.', {
          duration: 5000,
          position: 'top-center'
        });
      } catch (error) {
        console.error('Error processing order parameters:', error);
        toast.error('Error processing order details, but you can still proceed.', {
          duration: 5000
        });
      }
    };
    
    if (searchParams) {
      fetchOrderDetails();
    }
  }, [searchParams]);
  
  // Redirect if not authenticated - but with a button that user must click
  useEffect(() => {
    // Skip authentication check in development mode
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      return;
    }
    
    // Only show login prompt if definitely not authenticated (loading is complete)
    if (!loading && !isAuthenticated) {
      toast.error(
        'Please log in to continue with checkout', 
        { 
          duration: 5000,
          position: 'top-center'
        }
      );
    }
  }, [isAuthenticated, loading]);
  
  // Remove automatic redirects and add a stay_on_page param to the URL
  useEffect(() => {
    // Check for a stay_on_page parameter in the URL to prevent navigation issues
    const shouldStayOnPage = searchParams?.get('stay_on_page') === 'true';
    if (shouldStayOnPage) {
      console.log("Stay on page parameter detected - preventing automatic navigation");
      
      // If we need to reload order details, we can do it here but stay on the page
      const orderId = searchParams?.get('orderId');
      const amount = parseFloat(searchParams?.get('amount') || '0');
      
      if (orderId && amount > 0) {
        setOrderDetails({
          orderId,
          amount,
          tax: amount * 0.1,
          total: amount * 1.1
        });
        
        // Store in localStorage for safety
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastOrderId', orderId);
          localStorage.setItem('lastOrderAmount', String(amount));
        }
      }
    }
  }, [searchParams]);
  
  // For development mode only: Auto-fill credit card details for testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setPaymentInfo({
        method: 'credit_card',
        cardNumber: '4242 4242 4242 4242',
        cardholderName: 'Test User',
        expiryDate: '12/25',
        cvv: '123',
        saveCard: false
      });
      
      console.log('In development mode: Test card details auto-filled for easier testing');
      toast.success('Test card details auto-filled for development', {
        id: 'dev-helper',
        duration: 3000
      });
    }
  }, []);
  
  // Handle payment method change
  const handlePaymentMethodChange = (method: string) => {
    setPaymentInfo({ ...paymentInfo, method });
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setPaymentInfo({ ...paymentInfo, [name]: checked });
      return;
    }
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentInfo({ ...paymentInfo, [name]: formatted });
    } 
    // Format expiry date as MM/YY
    else if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      }
      
      setPaymentInfo({ ...paymentInfo, [name]: formatted });
    } 
    // Handle other fields normally
    else {
      setPaymentInfo({ ...paymentInfo, [name]: value });
    }
  };
  
  // Validate payment information
  const validatePayment = () => {
    const newErrors: Record<string, string> = {};
    
    if (paymentInfo.method === 'credit_card') {
      if (!paymentInfo.cardNumber.trim()) {
        newErrors.cardNumber = 'Card number is required';
      } else if (paymentInfo.cardNumber.replace(/\s/g, '').length < 16) {
        newErrors.cardNumber = 'Card number must be 16 digits';
      }
      
      if (!paymentInfo.cardholderName.trim()) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
      
      if (!paymentInfo.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(paymentInfo.expiryDate)) {
        newErrors.expiryDate = 'Use MM/YY format';
      }
      
      if (!paymentInfo.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(paymentInfo.cvv)) {
        newErrors.cvv = 'CVV must be 3 or 4 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Process payment
  const processPayment = async () => {
    if (!validatePayment()) return;
    
    if (!orderDetails.orderId) {
      // Try to recover order info from localStorage before showing error
      const recoveredOrderId = localStorage.getItem('lastOrderId');
      if (recoveredOrderId) {
        const recoveredAmount = parseFloat(localStorage.getItem('lastOrderAmount') || '0');
        if (recoveredAmount > 0) {
          setOrderDetails({
            orderId: recoveredOrderId,
            amount: recoveredAmount,
            tax: recoveredAmount * 0.1,
            total: recoveredAmount * 1.1
          });
          toast.success('Order information recovered. Proceeding with payment.');
          // Continue with payment immediately after a short delay
          setTimeout(() => {
            processPaymentWithOrderDetails(recoveredOrderId, recoveredAmount);
          }, 1000);
          return;
        }
      }
      
      // If recovery failed, show error but don't redirect
      toast.error('Order information missing. Please go back to checkout or try again.', { duration: 5000 });
      return;
    }
    
    processPaymentWithOrderDetails(orderDetails.orderId, orderDetails.amount);
  };
  
  // Prevent automatic navigation on success
  const handleSuccessfulPayment = () => {
    // Update UI to show success state
    setStatus('success');
    setProcessing(false);
    
    // Show success message but don't redirect
    toast.success('Payment successful! You can now view your order details.', {
      duration: 5000,
      position: 'top-center'
    });
    
    // Clear sensitive payment data
    setPaymentInfo({
      method: 'credit_card',
      cardNumber: '',
      cardholderName: '',
      expiryDate: '',
      cvv: '',
      saveCard: false
    });
  };
  
  // Update processPaymentWithOrderDetails to use handleSuccessfulPayment
  const processPaymentWithOrderDetails = async (orderId: string, amount: number) => {
    setProcessing(true);
    setStatus('processing');
    
    try {
      // Show processing toast
      toast.loading('Processing payment...', { id: 'payment-processing' });
      
      // Gather payment data
      const paymentData = {
        paymentStatus: 'completed',
        transactionId: `TX${Date.now()}`,
        method: paymentInfo.method,
        cardDetails: paymentInfo.method === 'credit_card' ? {
          lastFourDigits: paymentInfo.cardNumber.replace(/\s/g, '').slice(-4),
          expiryDate: paymentInfo.expiryDate
        } : null
      };
      
      console.log('Processing payment for order:', orderId);
      
      // Update payment status on the order
      const response = await ordersAPI.updatePayment(orderId, paymentData);
      
      // Clear cart after successful payment
      await cartAPI.clearCart();
      
      // Handle successful payment
      handleSuccessfulPayment();
      
      // Store order info in localStorage for backup
      if (typeof window !== 'undefined') {
        try {
          // Save to recentOrders for history
          const recentOrders = JSON.parse(localStorage.getItem('recentOrders') || '[]');
          recentOrders.push({
            _id: orderId,
            totalAmount: amount * 1.1,
            createdAt: new Date().toISOString(),
            status: 'paid'
          });
          localStorage.setItem('recentOrders', JSON.stringify(recentOrders.slice(-5)));
        } catch (e) {
          console.error('Error storing order in localStorage:', e);
        }
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Set error status
      setStatus('error');
      
      // Show error message
      const errorMessage = error.response?.data?.message || error.message || 'Payment processing failed';
      toast.error(errorMessage, { id: 'payment-processing' });
      
      // Allow retry instead of immediately redirecting
      setProcessing(false);
    }
  };
  
  // Display loading state when authenticating
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl content-fix">
      <div className="mb-6">
        <Link href="/checkout" className="text-green-600 hover:underline flex items-center">
          <FiArrowLeft className="mr-2" /> 
          Back to Checkout
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Complete Your Payment</h1>
      <p className="text-gray-600 mb-8">Your order is almost complete. Please provide your payment details below.</p>
      
      {/* Security Badge */}
      <div className="mb-8 p-3 bg-gray-50 border border-gray-200 rounded-lg inline-flex items-center">
        <FiLock className="text-green-600 mr-2" />
        <span className="text-sm text-gray-600">Secure Payment - Your data is protected and encrypted</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 payment-layout">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100">Payment Method</h2>
            
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('credit_card')}
                  className={`payment-method-card ${
                    paymentInfo.method === 'credit_card' 
                      ? 'payment-method-selected' 
                      : 'payment-method-unselected'
                  }`}
                >
                  <FiCreditCard size={20} />
                  <span>Credit Card</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('paypal')}
                  className={`payment-method-card ${
                    paymentInfo.method === 'paypal' 
                      ? 'payment-method-selected' 
                      : 'payment-method-unselected'
                  }`}
                >
                  <img src="/paypal.svg" alt="PayPal" className="h-5" />
                  <span>PayPal</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange('bank_transfer')}
                  className={`payment-method-card ${
                    paymentInfo.method === 'bank_transfer' 
                      ? 'payment-method-selected' 
                      : 'payment-method-unselected'
                  }`}
                >
                  <FiShield size={20} />
                  <span>Bank Transfer</span>
                </button>
              </div>
              
              {/* Credit Card Form */}
              {paymentInfo.method === 'credit_card' && (
                <div className="animate-fadeIn space-y-4 mt-6">
                  <div>
                    <label htmlFor="cardNumber" className="block text-gray-700 font-medium mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        maxLength={19} // 16 digits + 3 spaces
                        placeholder="1234 5678 9012 3456"
                        value={paymentInfo.cardNumber}
                        onChange={handleInputChange}
                        className={`input-field ${
                          errors.cardNumber ? 'input-field-error' : ''
                        }`}
                      />
                      <FiCreditCard className="absolute right-3 top-3 text-gray-400" size={20} />
                    </div>
                    {errors.cardNumber && <p className="error-message">{errors.cardNumber}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="cardholderName" className="block text-gray-700 font-medium mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      id="cardholderName"
                      name="cardholderName"
                      placeholder="John Doe"
                      value={paymentInfo.cardholderName}
                      onChange={handleInputChange}
                      className={`input-field ${
                        errors.cardholderName ? 'input-field-error' : ''
                      }`}
                    />
                    {errors.cardholderName && <p className="error-message">{errors.cardholderName}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-gray-700 font-medium mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={paymentInfo.expiryDate}
                        onChange={handleInputChange}
                        className={`input-field ${
                          errors.expiryDate ? 'input-field-error' : ''
                        }`}
                      />
                      {errors.expiryDate && <p className="error-message">{errors.expiryDate}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="cvv" className="block text-gray-700 font-medium mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        placeholder="123"
                        maxLength={4}
                        value={paymentInfo.cvv}
                        onChange={handleInputChange}
                        className={`input-field ${
                          errors.cvv ? 'input-field-error' : ''
                        }`}
                      />
                      {errors.cvv && <p className="error-message">{errors.cvv}</p>}
                    </div>
                  </div>
                  
                  {/* Save Card Details Option */}
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="saveCard"
                        checked={paymentInfo.saveCard}
                        onChange={handleInputChange}
                        className="save-card-checkbox"
                      />
                      <span className="text-gray-700">Save card for future purchases</span>
                    </label>
                  </div>
                  
                  {/* Credit Card Logos */}
                  <div className="mt-4 flex gap-2">
                    <img src="/visa.svg" alt="Visa" className="h-6" />
                    <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                    <img src="/amex.svg" alt="American Express" className="h-6" />
                  </div>
                </div>
              )}
              
              {/* PayPal Information */}
              {paymentInfo.method === 'paypal' && (
                <div className="animate-fadeIn text-center py-8">
                  <img src="/paypal.svg" alt="PayPal" className="h-12 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">You will be redirected to PayPal to complete your payment.</p>
                </div>
              )}
              
              {/* Bank Transfer Information */}
              {paymentInfo.method === 'bank_transfer' && (
                <div className="animate-fadeIn py-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-blue-800 mb-2">Bank Transfer Information</h3>
                    <p className="text-blue-700 text-sm mb-2">Please transfer the total amount to the following account:</p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div className="grid grid-cols-3">
                        <span className="font-medium">Bank Name:</span>
                        <span className="col-span-2">Book Library National Bank</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="font-medium">Account Number:</span>
                        <span className="col-span-2">1234567890</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="font-medium">Routing Number:</span>
                        <span className="col-span-2">987654321</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="font-medium">Reference:</span>
                        <span className="col-span-2">ORDER-{orderDetails.orderId.slice(-6)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your order will be processed once we receive your payment. Please use the order ID as a reference 
                    for your transfer.
                  </p>
                </div>
              )}
            </div>
            
            {/* Payment Status Messages */}
            {status === 'success' && (
              <div className="payment-success">
                <FiCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-medium text-green-800">Payment Successful!</h3>
                  <p className="text-green-700 text-sm mb-4">Your payment has been processed successfully. Click the button below to view your order details.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link 
                      href={`/orders/${orderDetails.orderId}?from_payment=true`}
                      className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors text-center"
                    >
                      View Order Details
                    </Link>
                    <Link
                      href="/books"
                      className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors text-center"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="payment-error">
                <FiAlertCircle className="text-red-500 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-medium text-red-800">Payment Failed</h3>
                  <p className="text-red-700 text-sm">There was an issue processing your payment. Please check your details and try again.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 sticky top-6">
            <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${orderDetails.amount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="font-medium">${orderDetails.tax.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-600">${orderDetails.total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Payment Button */}
            <button
              onClick={processPayment}
              disabled={processing || status === 'success'}
              className={`w-full mt-8 px-6 py-4 text-white font-medium rounded-lg transition-all flex justify-center items-center
                ${processing || status === 'success'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : status === 'success' ? (
                <>
                  <FiCheckCircle className="mr-2" size={20} />
                  Payment Complete
                </>
              ) : (
                <>
                  <FiLock className="mr-2" size={20} />
                  Pay Now ${orderDetails.total.toFixed(2)}
                </>
              )}
            </button>
            
            <p className="text-center text-gray-500 text-xs mt-4">
              By completing this purchase, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 