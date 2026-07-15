import React, { useEffect, useRef } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`toast toast-${type} glass-glow`}>
      {type === 'error' && '⚠️ '}
      {type === 'success' && '✅ '}
      {type === 'info' && 'ℹ️ '}
      {message}
    </div>
  );
}
