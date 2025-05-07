import React from 'react';
import Link from 'next/link';

// This is a wrapper around Next.js Link component
// It prevents nested anchor tags and ensures proper forwarding of props
// Starting from Next.js 13, Link automatically renders an <a> tag
// so we don't need to nest <a> tags inside Link

interface LinkComponentProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  [key: string]: any; // For any other props
}

export default function LinkComponent({
  href,
  className,
  children,
  ...rest
}: LinkComponentProps) {
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
} 