import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type} glass-glow`}>
      {type === 'error' && '⚠️ '}
      {type === 'success' && '✅ '}
      {type === 'info' && 'ℹ️ '}
      {message}
    </div>
  );
}
