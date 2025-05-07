'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiUser, FiBookOpen, FiPackage, FiSettings, FiChevronRight, FiCamera, FiUpload, FiTrash2, FiDownload, FiSave, FiCheck, FiCreditCard, FiCalendar, FiClipboard, FiPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from '../components/AnimatedButton';

// Interface for user form data
interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  bio?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }
}

// Interface for password form
interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading, updateUserProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [recentBooks, setRecentBooks] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  
  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    bio: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Function to get status badge color
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

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserOrders();
      
      // Initialize form with user data
      if (user) {
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          username: user.username || '',
          bio: user.bio || '',
          phone: user.phone || '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            zipCode: user.address?.zipCode || '',
            country: user.address?.country || ''
          }
        });
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Check for tab parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      
      if (tabParam) {
        switch(tabParam) {
          case 'orders':
            setActiveTab('orders');
            break;
          case 'books':
            setActiveTab('books');
            break;
          case 'settings':
            setActiveTab('settings');
            break;
          case 'personal':
            setActiveTab('personal');
            break;
          case 'payment':
            setActiveTab('payment');
            break;
          default:
            setActiveTab('personal');
        }
      }
    }
  }, []);

  useEffect(() => {
    // Load profile photo from localStorage if available
    if (typeof window !== 'undefined') {
      const savedPhoto = localStorage.getItem('userProfilePhoto');
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
    }
  }, []);

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated) return;
      
      try {
        setLoadingOrders(true);
        const response = await ordersAPI.getUserOrders();
        setOrders(response.orders || []);
        
        // Load saved payment methods
        const mockSavedCards = [
          {
            id: 'card1',
            type: 'visa',
            last4: '4242',
            expiryMonth: '12',
            expiryYear: '24',
            isDefault: true
          },
          {
            id: 'card2',
            type: 'mastercard',
            last4: '5678',
            expiryMonth: '06',
            expiryYear: '25',
            isDefault: false
          }
        ];
        setSavedCards(mockSavedCards);
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load your information');
      } finally {
        setLoadingOrders(false);
      }
    }
    
    if (isAuthenticated) {
      loadOrders();
    } else if (!loading) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, loading, router]);

  const fetchUserOrders = async () => {
    setLoadingOrders(true);
    try {
      // Fetch user orders through API with proper error handling
      const response = await ordersAPI.getUserOrders();
      
      if (response.orders && Array.isArray(response.orders)) {
        setOrders(response.orders);
        
        // Extract books from orders for recent books section
        if (response.orders.length > 0) {
          const books = response.orders.flatMap(order => {
            // Check if order.items exists and is an array before mapping
            if (!order.items || !Array.isArray(order.items)) {
              return [];
            }
            
            return order.items.map(item => {
              // Safely handle potential undefined properties
              const book = item.book || {};
              return {
                _id: book._id || item.bookId || 'unknown',
                title: book.title || 'Unknown Book',
                authors: book.authors || ['Unknown Author'],
                imageLinks: book.imageLinks || null
              };
            });
          });
          
          // Filter out duplicates based on book ID
          const uniqueBooks = books.filter((book, index, self) =>
            index === self.findIndex((b) => b._id === book._id)
          );
          
          setRecentBooks(uniqueBooks.slice(0, 6)); // Limit to 6 recent books
        }
      } else {
        // Handle empty or invalid response
        setOrders([]);
        setRecentBooks([]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load order history');
      setOrders([]);
      setRecentBooks([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const photoUrl = event.target.result as string;
          setProfilePhoto(photoUrl);
          
          // Save to localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('userProfilePhoto', photoUrl);
          }
          
          // Update profile photo in user profile
          handleUpdateProfile({ profilePhoto: photoUrl });
          
          setUploading(false);
          toast.success('Profile photo updated!');
        }
      };
      
      reader.onerror = () => {
        toast.error('Failed to load image');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeProfilePhoto = () => {
    setProfilePhoto(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userProfilePhoto');
    }
    
    // Update profile with removed photo
    handleUpdateProfile({ profilePhoto: null });
    
    toast.success('Profile photo removed');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Update URL without full page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    setFormChanged(true);
  };
  
  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
    
    // Clear any previous errors
    setPasswordError(null);
  };
  
  // Update profile information
  const handleUpdateProfile = async (additionalData = {}) => {
    setSavingProfile(true);
    
    try {
      // Combine form data with any additional data
      const profileData = {
        ...formData,
        ...additionalData
      };
      
      // Call the auth context update function
      await updateUserProfile(profileData);
      
      toast.success('Profile updated successfully!');
      setFormChanged(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };
  
  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    
    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setSavingPassword(false);
      return;
    }
    
    // Validate password strength
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      setSavingPassword(false);
      return;
    }
    
    try {
      // Call update password endpoint
      await updateUserProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      toast.success('Password updated successfully!');
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Failed to update password:', error);
      setPasswordError('Current password is incorrect or server error');
      toast.error('Failed to update password. Please check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // This will redirect in the useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
          
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-3xl font-bold mb-4 md:mb-0 md:mr-6">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-500 text-sm mt-1">Member since {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`py-3 px-6 ${
                  activeTab === 'personal'
                    ? 'border-b-2 border-green-600 text-green-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('personal')}
              >
                <span className="flex items-center">
                  <FiUser className="mr-2" />
                  Personal Info
                </span>
              </button>
              <button
                className={`py-3 px-6 ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-green-600 text-green-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('orders')}
              >
                <span className="flex items-center">
                  <FiPackage className="mr-2" />
                  Order History
                </span>
              </button>
              <button
                className={`py-3 px-6 ${
                  activeTab === 'payment'
                    ? 'border-b-2 border-green-600 text-green-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('payment')}
              >
                <span className="flex items-center">
                  <FiCreditCard className="mr-2" />
                  Payment Methods
                </span>
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'personal' && (
              <motion.div
                key="personal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user.username}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Phone Number</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <AnimatedButton
                      onClick={() => toast.success('Profile updated successfully!')}
                      style="primary"
                    >
                      Save Changes
                    </AnimatedButton>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">New Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <AnimatedButton
                        onClick={() => toast.success('Password updated successfully!')}
                        style="primary"
                      >
                        Update Password
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Order History</h2>
                  <Link href="/orders" className="text-green-600 hover:text-green-700 font-medium flex items-center">
                    View All Orders <FiChevronRight className="ml-1" />
                  </Link>
                </div>
                
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-t-green-600 border-green-200 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FiPackage className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No Orders Yet</h3>
                    <p className="text-gray-600 mb-4">
                      You haven't placed any orders yet. Start shopping to see your order history.
                    </p>
                    <Link
                      href="/books"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-block"
                    >
                      Browse Books
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order._id || `order-${Math.random()}`} className="py-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                          <div>
                            <div className="flex items-center">
                              <span className="text-lg font-medium text-gray-800">Order #{order.orderNumber || 'Unknown'}</span>
                              <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'pending')}`}>
                                {order.status || 'Pending'}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                              <FiCalendar className="mr-1" />
                              <span>Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 md:mt-0 flex items-center">
                            <span className="text-gray-800 font-medium mr-4">
                              ${(order.totalAmount || 0).toFixed(2)}
                            </span>
                            <Link 
                              href={`/orders/${order._id}`}
                              className="flex items-center text-green-600 hover:text-green-700 transition-colors"
                            >
                              <span>View Details</span>
                              <FiChevronRight className="ml-1" />
                            </Link>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex overflow-x-auto hide-scrollbar">
                          {order.items && Array.isArray(order.items) ? 
                            order.items.slice(0, 4).map((item) => (
                              <div key={item._id || `item-${Math.random()}`} className="flex-shrink-0 mr-4">
                                <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden">
                                  <img
                                    src={(item.book && item.book.imageLinks && item.book.imageLinks.thumbnail) || '/book-placeholder.svg'}
                                    alt={(item.book && item.book.title) || 'Book cover'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )) : (
                              <div className="flex-shrink-0 mr-4">
                                <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                                  <span className="text-sm text-gray-600">No items</span>
                                </div>
                              </div>
                            )
                          }
                          {order.items && Array.isArray(order.items) && order.items.length > 4 && (
                            <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-sm text-gray-600">+{order.items.length - 4} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            
            {activeTab === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Methods</h2>
                
                <div className="space-y-4">
                  {/* Saved cards */}
                  {savedCards.map((card) => (
                    <div 
                      key={card.id} 
                      className={`border rounded-lg p-4 ${card.isDefault ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-12 h-8 bg-gray-200 rounded mr-3 flex items-center justify-center">
                            {card.type === 'visa' && <span className="font-bold text-blue-600">VISA</span>}
                            {card.type === 'mastercard' && <span className="font-bold text-red-600">MC</span>}
                          </div>
                          <div>
                            <p className="text-gray-800 font-medium">•••• •••• •••• {card.last4}</p>
                            <p className="text-gray-500 text-sm">Expires {card.expiryMonth}/{card.expiryYear}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {card.isDefault && (
                            <span className="text-green-600 text-sm font-medium mr-3">Default</span>
                          )}
                          <button 
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => toast.success(card.isDefault ? 'Already default payment method' : 'Set as default payment method')}
                          >
                            {!card.isDefault && 'Set Default'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add new card button */}
                  <button 
                    onClick={() => toast.success('Feature coming soon!')}
                    className="border border-dashed border-gray-300 rounded-lg p-4 w-full flex items-center justify-center text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
                  >
                    <FiPlus className="mr-2" />
                    <span>Add New Payment Method</span>
                  </button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Billing Address</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        defaultValue={user.username}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Address Line 1</label>
                      <input
                        type="text"
                        defaultValue="123 Main Street"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Address Line 2</label>
                      <input
                        type="text"
                        defaultValue="Apt 4B"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">City</label>
                        <input
                          type="text"
                          defaultValue="New York"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">State</label>
                        <input
                          type="text"
                          defaultValue="NY"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Postal Code</label>
                        <input
                          type="text"
                          defaultValue="10001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Country</label>
                        <input
                          type="text"
                          defaultValue="United States"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <AnimatedButton
                        onClick={() => toast.success('Billing address updated!')}
                        style="primary"
                      >
                        Save Address
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
} 