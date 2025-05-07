'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

interface AnimatedBookCoverProps {
  imageUrl: string;
  title: string;
  showAnimation?: boolean;
}

export default function AnimatedBookCover({ 
  imageUrl, 
  title,
  showAnimation = true
}: AnimatedBookCoverProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for 3D effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform the rotation and shadow based on cursor position
  const rotateY = useTransform(x, [-100, 100], [10, -10]);
  const rotateX = useTransform(y, [-100, 100], [-10, 10]);
  const shadowBlur = useTransform(
    [rotateX, rotateY],
    ([newRotateX, newRotateY]) => Math.sqrt(newRotateX * newRotateX + newRotateY * newRotateY) * 0.8
  );
  
  // Handle mouse move for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !showAnimation) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate delta from center
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    // Update motion values
    x.set(deltaX);
    y.set(deltaY);
  };
  
  // Reset position when mouse leaves
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  // Spine effect
  const spineWidth = 10; // pixels
  
  // Book open effect variants
  const bookVariants = {
    closed: { 
      rotateY: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    },
    open: { 
      rotateY: -25, 
      transition: { duration: 0.6, ease: "easeInOut" } 
    }
  };
  
  const pageVariants = {
    closed: { 
      rotateY: 0,
      opacity: 0,
      transition: { duration: 0.6 } 
    },
    open: { 
      rotateY: 0, 
      opacity: 1,
      transition: { duration: 0.6, delay: 0.2 } 
    }
  };
  
  // Glow effect variants
  const glowVariants = {
    off: { opacity: 0 },
    on: { 
      opacity: [0, 0.5, 0],
      transition: { 
        duration: 2,
        repeat: Infinity,
        repeatType: "mirror"
      }
    }
  };
  
  return (
    <div
      ref={containerRef}
      className="relative perspective-600 w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Container */}
      <motion.div
        className="relative w-full h-full preserve-3d"
        style={{
          rotateX: showAnimation ? rotateX : 0,
          rotateY: showAnimation ? rotateY : 0,
          x: 0,
          y: 0,
          boxShadow: showAnimation 
            ? `0px ${shadowBlur}px 15px rgba(0, 0, 0, 0.3)` 
            : "0px 5px 15px rgba(0, 0, 0, 0.2)",
          transformStyle: "preserve-3d"
        }}
        animate={isHovered && showAnimation ? "open" : "closed"}
        variants={bookVariants}
      >
        {/* Front cover (main image) */}
        <motion.div
          className="absolute inset-0 rounded-md overflow-hidden bg-gray-200 backface-hidden"
          style={{ 
            transformStyle: "preserve-3d",
            transform: "translateZ(2px)",
            transformOrigin: "left center"
          }}
        >
          <div className="w-full h-full relative">
            <img
              src={imageUrl || '/book-placeholder.svg'}
              alt={title}
              className="w-full h-full object-cover"
            />
            
            {/* Edge lighting effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none"
              animate={isHovered && showAnimation ? "on" : "off"}
              variants={glowVariants}
            />
          </div>
        </motion.div>
        
        {/* Spine */}
        <div 
          className="absolute top-0 bottom-0 left-0 w-2 bg-gray-300"
          style={{ 
            transform: `translateX(${-spineWidth/2}px) rotateY(90deg) translateZ(${spineWidth/2}px)`,
            width: `${spineWidth}px`,
            transformOrigin: "center left"
          }}
        />
        
        {/* Inner pages */}
        <AnimatePresence>
          {isHovered && showAnimation && (
            <motion.div
              className="absolute inset-0 bg-white rounded-md bg-opacity-90"
              style={{ 
                transform: "translateZ(1px) translateX(10px)",
                transformOrigin: "left center",
                backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 20%)"
              }}
              initial="closed"
              animate="open"
              exit="closed"
              variants={pageVariants}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 