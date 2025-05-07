'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiMenu, FiX, FiShoppingCart, FiUser, FiLogOut, FiLogIn, FiBookOpen, FiSettings, FiPlusCircle, FiSave } from 'react-icons/fi';

export default function AppHeader(): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Load profile photo from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated) {
      const savedPhoto = localStorage.getItem('userProfilePhoto');
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
    }
  }, [isAuthenticated]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  const navigateToProfile = () => {
    router.push('/profile');
    setMenuOpen(false);
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <FiBookOpen className="text-white text-3xl" />
            <span>BookStore</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`hover:text-green-200 transition-colors ${pathname === '/' ? 'text-white font-medium' : 'text-green-50'}`}>Home</Link>
            <Link href="/books" className={`hover:text-green-200 transition-colors ${pathname === '/books' ? 'text-white font-medium' : 'text-green-50'}`}>Books</Link>
            {isAuthenticated && (
              <>
                <Link href="/orders" className={`hover:text-green-200 transition-colors ${pathname === '/orders' ? 'text-white font-medium' : 'text-green-50'}`}>My Orders</Link>
                <Link href="/books/add" className={`hover:text-green-200 transition-colors ${pathname === '/books/add' ? 'text-white font-medium' : 'text-green-50'} flex items-center`}>
                  <FiPlusCircle className="mr-1" />
                  <span>Add Book</span>
                </Link>
                <Link href="/purchase?bookId=sample-book-1" className={`hover:text-green-200 transition-colors ${pathname.startsWith('/purchase') ? 'text-white font-medium' : 'text-green-50'} flex items-center`}>
                  <FiSave className="mr-1" />
                  <span>Quick Purchase</span>
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className={`hover:text-blue-200 transition-colors ${pathname === '/admin' ? 'text-white font-medium' : 'text-blue-50'}`}>Admin Dashboard</Link>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/cart" className="flex items-center hover:text-blue-200 transition-colors relative">
                  <FiShoppingCart className="text-xl mr-1" />
                  <span>Cart</span>
                  {cart && cart.totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.totalItems}
                    </span>
                  )}
                </Link>
                
                {/* Updated profile dropdown with avatar */}
                <div className="flex items-center group relative">
                  <button 
                    className={`flex items-center hover:text-blue-200 transition-colors p-1 rounded-full ${pathname === '/profile' ? 'bg-blue-700' : ''}`}
                    onClick={navigateToProfile}
                    aria-label="Go to profile"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/60 flex items-center justify-center bg-blue-500">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt={user?.username || 'Profile'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-white" />
                      )}
                    </div>
                    <span className="ml-2">{user.username}</span>
                  </button>
                  <div className="absolute right-0 top-10 bg-white text-gray-800 shadow-lg rounded-md w-48 py-2 hidden group-hover:block z-10">
                    <Link href="/profile" className={`block px-4 py-2 hover:bg-gray-100 transition-colors ${pathname === '/profile' ? 'bg-blue-50 text-blue-600' : ''}`}>
                      <div className="flex items-center">
                        <FiUser className="mr-2" /> My Profile
                      </div>
                    </Link>
                    <Link href="/profile?tab=books" className="block px-4 py-2 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <FiBookOpen className="mr-2" /> My Books
                      </div>
                    </Link>
                    <Link href="/profile?tab=settings" className="block px-4 py-2 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <FiSettings className="mr-2" /> Account Settings
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center text-red-600">
                      <FiLogOut className="mr-2" /> Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center hover:text-blue-200 transition-colors">
                  <FiLogIn className="text-xl mr-1" />
                  <span>Login</span>
                </Link>
                <Link href="/register" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">Register</Link>
              </>
            )}
          </div>

          <button className="md:hidden text-white text-2xl" onClick={toggleMenu} aria-label="Toggle menu">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden py-4 space-y-3">
            <Link href="/" className={`block hover:text-blue-200 transition-colors ${pathname === '/' ? 'font-medium' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/books" className={`block hover:text-blue-200 transition-colors ${pathname === '/books' ? 'font-medium' : ''}`} onClick={() => setMenuOpen(false)}>Books</Link>
            {isAuthenticated ? (
              <>
                <Link href="/cart" className={`block hover:text-blue-200 transition-colors flex items-center ${pathname === '/cart' ? 'font-medium' : ''}`} onClick={() => setMenuOpen(false)}>
                  <FiShoppingCart className="mr-1" />
                  <span>Cart {cart && cart.totalItems > 0 ? `(${cart.totalItems})` : ''}</span>
                </Link>
                <Link href="/orders" className={`block hover:text-blue-200 transition-colors ${pathname === '/orders' ? 'font-medium' : ''}`} onClick={() => setMenuOpen(false)}>My Orders</Link>
                
                {/* Enhanced mobile profile link */}
                <div className="border-t border-blue-500/30 pt-2 mt-2">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/60 flex items-center justify-center bg-blue-500 mr-2">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt={user?.username || 'Profile'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-white" />
                      )}
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    className={`block hover:text-blue-200 transition-colors pl-10 ${pathname === '/profile' ? 'font-medium' : ''}`} 
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FiUser className="mr-2" /> My Profile
                    </div>
                  </Link>
                  <Link 
                    href="/profile?tab=books" 
                    className="block hover:text-blue-200 transition-colors pl-10" 
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FiBookOpen className="mr-2" /> My Books
                    </div>
                  </Link>
                  <Link 
                    href="/profile?tab=settings" 
                    className="block hover:text-blue-200 transition-colors pl-10 mb-2" 
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FiSettings className="mr-2" /> Account Settings
                    </div>
                  </Link>
                </div>
                
                {user?.role === 'admin' && (
                  <Link href="/admin" className={`block hover:text-blue-200 transition-colors ${pathname === '/admin' ? 'font-medium' : ''}`} onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
                )}
                <button onClick={handleLogout} className="block hover:text-blue-200 transition-colors flex items-center text-red-200">
                  <FiLogOut className="mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={`block hover:text-blue-200 transition-colors flex items-center ${pathname === '/login' ? 'font-medium' : ''}`} onClick={() => setMenuOpen(false)}>
                  <FiLogIn className="mr-1" />
                  <span>Login</span>
                </Link>
                <Link href="/register" className={`block hover:text-blue-200 transition-colors ${pathname === '/register' ? 'font-medium' : ''}`} onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
} 