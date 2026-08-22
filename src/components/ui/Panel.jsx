import React from 'react';

export default function Panel({ children, className = '', as = 'section', ...rest }) {
  const Comp = as;
  return (
    <Comp className={`panel-shell ${className}`} {...rest}>
      {children}
    </Comp>
  );
}
