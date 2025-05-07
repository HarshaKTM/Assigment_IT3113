'use client';

import Link from 'next/link';
import { FiBookOpen, FiGithub, FiTwitter, FiInstagram, FiFacebook, FiMail, FiMapPin, FiPhone, FiClock, FiCreditCard, FiTruck, FiShield, FiLock } from 'react-icons/fi';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-black text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and Contact Info */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <FiBookOpen className="text-red-500 text-3xl" />
              <span className="text-xl font-bold text-white">BOOKSTORE.LK</span>
            </div>
            
            <div className="mb-4">
              <p className="text-white">Sri Lanka's Premier Bookstore</p>
              <p className="text-white">Sharjah Main City, Sharjah, UAE</p>
              <p className="text-white">Veyangoda, Gampaha.</p>
            </div>
            
            <div className="mb-4">
              <p className="text-white">Monday - Friday: 8:00-5:00</p>
              <p className="text-white">Saturday: 10:00 - 5:00</p>
            </div>
            
            <div className="mb-4">
              <p className="text-white">Call Us: <span className="text-blue-500">078 888 5148</span></p>
              <p className="text-white">bookstore@gmail.com</p>
            </div>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-white hover:text-blue-400 transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white hover:text-blue-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-white hover:text-blue-400 transition-colors">
                  Delivery Information
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white hover:text-blue-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="text-white hover:text-blue-400 transition-colors">
                  Refunds & Returns
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Our Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Our Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-white hover:text-blue-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-white hover:text-blue-400 transition-colors">
                  Refunds & Returns
                </Link>
              </li>
              <li>
                <Link href="/authors" className="text-white hover:text-blue-400 transition-colors">
                  Authors
                </Link>
              </li>
              <li>
                <Link href="/publishers" className="text-white hover:text-blue-400 transition-colors">
                  Publishers
                </Link>
              </li>
              <li>
                <Link href="/store-pickup" className="text-white hover:text-blue-400 transition-colors">
                  Store Pickup
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-white hover:text-blue-400 transition-colors">
                  Register with us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Corporate & Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Corporate</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/become-agent" className="text-white hover:text-blue-400 transition-colors">
                  Become an Agent
                </Link>
              </li>
              <li>
                <Link href="/education" className="text-white hover:text-blue-400 transition-colors">
                  Sipwaruna Education
                </Link>
              </li>
              <li>
                <Link href="/digital" className="text-white hover:text-blue-400 transition-colors">
                  Digital Nation Pvt Ltd
                </Link>
              </li>
            </ul>
            
            <div className="mt-8">
              <div className="text-right">
                <h3 className="text-lg font-semibold mb-1 text-white">BOOKSTORE</h3>
                <p className="text-white">Sri Lanka's Premier Bookstore</p>
                <p className="text-white">Online Since: 2023</p>
                <p className="text-white mt-4">Estd. 2041</p>
                <p className="text-white">A Proud Partner of</p>
                <p className="text-white">Ariyadasa Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Social Media */}
      <div className="bg-white border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-white">&copy; {currentYear} BookStore. All rights reserved.</p>
            </div>
            
            <div>
              <p className="text-white mb-2 text-right">Follow Us</p>
              <div className="flex space-x-4 justify-end">
                <Link href="#" className="text-black hover:text-blue-400 transition-colors">
                  <FiFacebook size={20} />
                </Link>
                <Link href="#" className="text-black hover:text-blue-400 transition-colors">
                  <FiFacebook size={20} />
                </Link>
                <Link href="#" className="text-black hover:text-blue-400 transition-colors">
                  <FiTwitter size={20} />
                </Link>
                <Link href="#" className="text-black hover:text-blue-400 transition-colors">
                  <FiInstagram size={20} />
                </Link>
                <Link href="#" className="text-black hover:text-blue-400 transition-colors">
                  <FiGithub size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 