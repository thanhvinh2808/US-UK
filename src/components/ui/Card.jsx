import React from 'react';

export default function Card({ children, className = '', as = 'div', ...rest }) {
  const Comp = as;
  return (
    <Comp className={`card-surface ${className}`} {...rest}>
      {children}
    </Comp>
  );
}
