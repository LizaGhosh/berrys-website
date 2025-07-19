import React from 'react';

interface BerrysLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export default function BerrysLogo({ 
  className = '', 
  variant = 'light', 
  size = 'md' 
}: BerrysLogoProps) {
  const sizeClasses = {
    sm: 'w-24 h-8',
    md: 'w-32 h-10',
    lg: 'w-48 h-12'
  };

  const logoSrc = variant === 'dark' ? '/berrys-logo-dark.svg' : '/berrys-logo.svg';

  return (
    <img 
      src={logoSrc} 
      alt="Berrys AI" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
} 