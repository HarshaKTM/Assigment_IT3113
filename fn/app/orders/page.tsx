'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiCreditCard, FiShoppingBag, FiCalendar, FiChevronRight, FiClock, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Define TypeScript interfaces for our data
interface OrderItem {
  _id: string;
  bookId: string;
  book: {
    _id: string;
    title: string;
    authors: string[];
    imageLinks: {
      thumbnail?: string;
    };
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  paymentStatus: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Load user orders
  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const response = await ordersAPI.getUserOrders();
        setOrders(response.orders || []);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error('Failed to load your orders');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadOrders();
    } else {
      router.push('/login?redirect=/orders');
    }
  }, [isAuthenticated, router]);

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-green-600 border-green-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
            <Link
              href="/books"
              className="flex items-center text-green-600 hover:text-green-700 transition-colors"
            >
              <FiShoppingBag className="mr-2" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FiPackage className="text-gray-400 text-3xl" />
              </div>
              <h2 className="text-2xl font-medium text-gray-800 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Link
                href="/books"
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors inline-block"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {orders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">
                            Order #{order.orderNumber}
                          </h2>
                          <div className="flex items-center text-gray-600 text-sm mt-1">
                            <FiCalendar className="mr-1" />
                            <span>Placed on {formatDate(order.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiCreditCard className="text-gray-600 mr-2" />
                          <span className="text-gray-600">
                            Total: <span className="font-bold text-gray-800">${order.totalAmount.toFixed(2)}</span>
                          </span>
                        </div>

                        <Link
                          href={`/orders/${order._id}`}
                          className="flex items-center text-green-600 hover:text-green-700 transition-colors"
                        >
                          <span>View details</span>
                          <FiChevronRight className="ml-1" />
                        </Link>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Items in this order</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {order.items.map((item) => (
                          <div key={item._id} className="flex items-center">
                            <div className="w-12 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                              <img
                                src={item.book?.imageLinks?.thumbnail || '/book-placeholder.svg'}
                                alt={item.book?.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-800 line-clamp-1">
                                {item.book?.title || 'Book Title'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 