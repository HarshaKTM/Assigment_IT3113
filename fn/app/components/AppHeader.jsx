'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiBookOpen, FiHeart, FiPackage } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function AppHeader() {
  const pathname = usePathname();
  const { isAuthenticated, user, loading } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Books', path: '/books' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' }
  ];
  
  return (
    <header className={`navbar sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <img 
            src="/logo.svg" 
            alt="Book Library Logo" 
            width={150} 
            height={45} 
          />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          <ul className="flex space-x-8">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  href={link.path}
                  className={`navbar-link text-base font-medium ${
                    pathname === link.path ? 'text-green-600 font-semibold' : ''
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Cart with Badge */}
          <Link 
            href="/cart" 
            className="relative p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </Link>
          
          {/* User Menu */}
          {!loading && (
            <>
              {isAuthenticated ? (
                <Link 
                  href="/account" 
                  className="p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FiUser size={22} />
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="navbar-button"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white absolute top-full left-0 w-full shadow-lg animate-slideIn">
          <nav className="px-4 py-3">
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className={`block py-2 px-3 rounded-md ${
                      pathname === link.path 
                        ? 'bg-green-50 text-green-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              
              {isAuthenticated && (
                <>
                  <li>
                    <Link
                      href="/account"
                      className="flex items-center py-2 px-3 rounded-md text-gray-700 hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      <FiUser className="mr-3" />
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/favorites"
                      className="flex items-center py-2 px-3 rounded-md text-gray-700 hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      <FiHeart className="mr-3" />
                      Favorites
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/orders"
                      className="flex items-center py-2 px-3 rounded-md text-gray-700 hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      <FiPackage className="mr-3" />
                      Orders
                    </Link>
                  </li>
                </>
              )}
              
              {!isAuthenticated && (
                <li>
                  <Link
                    href="/login"
                    className="flex items-center py-2 px-3 bg-green-600 text-white rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <FiUser className="mr-3" />
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
} 