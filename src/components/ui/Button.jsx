import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...rest }) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}
