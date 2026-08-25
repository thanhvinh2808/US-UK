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
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast toast-${type}`}>
        <span className="text-base">
          {type === 'error' && '⚠️'}
          {type === 'success' && '✅'}
          {type === 'warning' && '⚡'}
          {type === 'info' && 'ℹ️'}
        </span>
        <span className="flex-1">{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thông báo"
            className="ml-2 text-slate-400 hover:text-slate-700 text-xs font-bold p-0.5"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
