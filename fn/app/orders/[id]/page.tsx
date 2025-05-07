'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiPackage, FiCreditCard, FiMapPin, FiCalendar, FiClock, FiCheckCircle, FiDownload, FiTruck, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AnimatedButton from '../../components/AnimatedButton';

export default function OrderDetailPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  // Load order details
  useEffect(() => {
    async function loadOrderDetails() {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const response = await ordersAPI.getOrderById(orderId);
        setOrder(response.order);
      } catch (error) {
        console.error('Error loading order details:', error);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadOrderDetails();
    } else {
      router.push('/login?redirect=/orders/' + orderId);
    }
  }, [isAuthenticated, orderId, router]);

  // Format date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    if (!status) return <FiClock />;
    
    switch (status.toLowerCase()) {
      case 'pending':
        return <FiClock />;
      case 'processing':
        return <FiPackage />;
      case 'shipped':
        return <FiTruck />;
      case 'delivered':
        return <FiCheckCircle />;
      case 'cancelled':
        return <FiX />;
      default:
        return <FiClock />;
    }
  };

  // Download invoice
  const handleDownloadInvoice = () => {
    toast.success('Invoice downloaded successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-green-600 border-green-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <Link 
            href="/orders"
            className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-6">
            <Link 
              href="/orders" 
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              <span>Back to Orders</span>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Order header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Order #{order.orderNumber}
                  </h1>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <FiCalendar className="mr-1" />
                    <span>Placed on {formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status}</span>
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div className="flex items-center">
                  <FiCreditCard className="text-gray-600 mr-2" />
                  <span className="text-gray-600">
                    Total: <span className="font-bold text-gray-800">${order.totalAmount?.toFixed(2) || '0.00'}</span>
                  </span>
                </div>
                
                <AnimatedButton
                  onClick={handleDownloadInvoice}
                  style="secondary"
                  className="flex items-center justify-center"
                >
                  <FiDownload className="mr-2" />
                  <span>Download Invoice</span>
                </AnimatedButton>
              </div>
            </div>

            {/* Order status timeline */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Order Status</h2>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${order.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      <FiCheckCircle size={16} />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-800">Order Delivered</h3>
                      <p className="text-sm text-gray-600">
                        {order.status === 'delivered' ? formatDate(order.deliveredAt || order.updatedAt) : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${(order.status === 'shipped' || order.status === 'delivered') ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      <FiTruck size={16} />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-800">Order Shipped</h3>
                      <p className="text-sm text-gray-600">
                        {(order.status === 'shipped' || order.status === 'delivered') ? formatDate(order.shippedAt || order.updatedAt) : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${(order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      <FiPackage size={16} />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-800">Order Processing</h3>
                      <p className="text-sm text-gray-600">
                        {(order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') ? formatDate(order.processedAt || order.updatedAt) : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center z-10">
                      <FiCreditCard size={16} />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-800">Order Placed</h3>
                      <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order items */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item._id} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-24 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                      <img
                        src={item.book?.imageLinks?.thumbnail || '/book-placeholder.svg'}
                        alt={item.book?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium text-gray-800">{item.book?.title || 'Book Title'}</h3>
                      <p className="text-sm text-gray-500">
                        {item.book?.authors?.join(', ') || 'Unknown Author'}
                      </p>
                      <div className="flex justify-between mt-2">
                        <div className="text-sm text-gray-600">
                          {item.quantity} × ${item.price?.toFixed(2) || '0.00'}
                        </div>
                        <div className="font-medium text-gray-800">
                          ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Order Summary</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">
                    ${(order.totalAmount ? (order.totalAmount - (order.totalAmount * 0.08)) : 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="text-gray-800">
                    ${(order.totalAmount ? (order.totalAmount * 0.08) : 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-800">$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-600">${order.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping info */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Shipping Information</h2>
              
              <div className="flex items-start">
                <FiMapPin className="text-gray-500 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-800">{order.shipping?.name}</p>
                  <p className="text-gray-600">
                    {order.shipping?.address?.street},<br />
                    {order.shipping?.address?.city}, {order.shipping?.address?.state} {order.shipping?.address?.postalCode},<br />
                    {order.shipping?.address?.country}
                  </p>
                  <p className="text-gray-600 mt-2">
                    Phone: {order.shipping?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Payment Information</h2>
              
              <div className="flex items-start">
                <FiCreditCard className="text-gray-500 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-gray-800">
                    {order.payment?.method === 'credit_card' ? 'Credit Card' : 
                     order.payment?.method === 'paypal' ? 'PayPal' : 
                     order.payment?.method === 'bank_transfer' ? 'Bank Transfer' : 
                     'Payment Method'}
                  </p>
                  {order.payment?.method === 'credit_card' && (
                    <p className="text-gray-600">
                      Card ending in {order.payment?.cardNumber?.slice(-4) || '****'}
                    </p>
                  )}
                  <p className="text-gray-600 mt-2">
                    Transaction ID: {order.payment?.transactionId || 'Processing'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 