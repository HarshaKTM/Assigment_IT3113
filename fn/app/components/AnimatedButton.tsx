'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  style?: 'primary' | 'secondary' | 'magic';
}

export default function AnimatedButton({
  onClick,
  children,
  className = '',
  type = 'button',
  disabled = false,
  style = 'primary'
}: AnimatedButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Define base styles for different button types
  const baseStyles = {
    primary: "bg-green-600 hover:bg-green-700 text-white",
    secondary: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700",
    magic: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
  };
  
  // Define animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
    disabled: { opacity: 0.7, scale: 1 }
  };
  
  // Magic sparkle effect
  const sparkleVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: { 
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: { 
        duration: 0.7,
        repeat: isHovered ? Infinity : 0,
        repeatDelay: 0.5
      }
    }
  };
  
  return (
    <div className="relative inline-block">
      {style === 'magic' && isHovered && (
        <>
          <motion.span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-300"
            initial="initial"
            animate="animate"
            variants={sparkleVariants}
          />
          <motion.span
            className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-blue-300"
            initial="initial"
            animate="animate"
            variants={sparkleVariants}
            transition={{ delay: 0.1 }}
          />
          <motion.span
            className="absolute top-1/2 -translate-y-1/2 -right-2 w-2 h-2 rounded-full bg-pink-300"
            initial="initial"
            animate="animate"
            variants={sparkleVariants}
            transition={{ delay: 0.2 }}
          />
        </>
      )}
      
      <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyles[style]} rounded-md font-medium px-4 py-2 transition-colors ${className}`}
        variants={buttonVariants}
        initial="initial"
        whileHover={disabled ? "disabled" : "hover"}
        whileTap={disabled ? "disabled" : "tap"}
        animate={disabled ? "disabled" : "initial"}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {children}
      </motion.button>
    </div>
  );
} 