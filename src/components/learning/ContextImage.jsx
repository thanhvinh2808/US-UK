import React, { useState } from 'react';
import '../../styles/learningVisuals.css';

export default function ContextImage({
  src,
  alt = '',
  aspectRatio = '16-9',
  className = '',
  eager = false,
  caption = null,
  attribution = null,
  showFallbackText = false
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  const aspectClass = `aspect-${aspectRatio}`;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className={`v-context-image-wrapper ${aspectClass}`}>
        {!isLoaded && !hasError && (
          <div className="v-image-skeleton" aria-hidden="true" />
        )}

        {hasError ? (
          <div className="v-image-fallback" role="img" aria-label={alt || 'Visual content'}>
            <svg
              className="v-image-fallback-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {showFallbackText && (
              <span className="v-image-fallback-text">{alt || 'Hình ảnh ngữ cảnh'}</span>
            )}
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`v-context-image ${isLoaded ? 'loaded' : ''}`}
          />
        )}
      </div>

      {caption && isLoaded && !hasError && (
        <p className="v-image-caption">
          {caption}
        </p>
      )}

      {attribution && isLoaded && !hasError && (
        <span className="text-[10px] text-slate-400 block font-normal text-right">
          {attribution}
        </span>
      )}
    </div>
  );
}
