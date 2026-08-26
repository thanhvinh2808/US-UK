import React from 'react';
import ContextImage from './ContextImage';
import '../../styles/learningVisuals.css';

export default function VocabularyVisualCard({
  vocab,
  visual,
  onSpeak,
  compact = false,
  className = ''
}) {
  if (!vocab) return null;

  const wordText = typeof vocab === 'string' ? vocab : vocab.word;
  const ipaText = vocab.ipa || '';
  const viText = vocab.vietnamese || '';
  const exampleText = vocab.example || '';
  const partOfSpeech = vocab.partOfSpeech || '';

  const handleAudio = (e) => {
    e.stopPropagation();
    if (onSpeak) onSpeak(wordText);
  };

  return (
    <div className={`v-vocab-visual-card ${className}`}>
      {visual && visual.image && (
        <div className="v-vocab-card-media">
          <ContextImage
            src={visual.image}
            alt={visual.alt || `Visual representation of ${wordText}`}
            aspectRatio={compact ? '1-1' : '4-3'}
            showFallbackText={false}
          />
        </div>
      )}

      <div className="v-vocab-card-body">
        <div className="v-vocab-word-row">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="v-vocab-word">{wordText}</span>
              {partOfSpeech && (
                <span className="text-[10px] text-slate-400 font-mono">({partOfSpeech})</span>
              )}
            </div>
            {ipaText && <span className="v-vocab-ipa">{ipaText}</span>}
          </div>

          {onSpeak && (
            <button
              type="button"
              onClick={handleAudio}
              className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition-colors flex items-center gap-1 shrink-0"
              title={`Phát âm từ ${wordText}`}
            >
              <span>🔊</span>
            </button>
          )}
        </div>

        {viText && (
          <p className="v-vocab-vi">
            {viText}
          </p>
        )}

        {exampleText && (
          <p className="v-vocab-example">
            {exampleText}
          </p>
        )}
      </div>
    </div>
  );
}
