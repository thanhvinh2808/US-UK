import React, { useState } from 'react';
import '../../styles/learningVisuals.css';

export default function LessonHeroVisual({
  visual,
  title,
  subtitle,
  badge = 'Bối cảnh thực tế'
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!visual || !visual.image) return null;

  return (
    <div className="v-lesson-hero-visual">
      <div className="v-lesson-hero-media">
        {!isLoaded && !hasError && (
          <div className="v-image-skeleton" aria-hidden="true" />
        )}

        {!hasError ? (
          <img
            src={visual.image}
            alt={visual.alt || title || 'Lesson contextual illustration'}
            loading="eager"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`v-context-image ${isLoaded ? 'loaded' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
            {visual.alt || 'Visual context'}
          </div>
        )}

        <div className="v-lesson-hero-overlay">
          <span className="v-lesson-hero-badge">
            {badge}
          </span>
          {title && (
            <h2 className="v-lesson-hero-title">
              {title}
            </h2>
          )}
          {(subtitle || visual.caption) && (
            <p className="v-lesson-hero-caption">
              {visual.caption || subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
