import React from 'react';
import VocabularyVisualCard from './VocabularyVisualCard';
import { getVocabularyVisual } from '../../data/visualLearningData';

export default function VisualVocabularyGrid({
  vocabularyList = [],
  onSpeak,
  columns = 3,
  className = ''
}) {
  if (!Array.isArray(vocabularyList) || vocabularyList.length === 0) {
    return null;
  }

  const gridColsClass = columns === 4
    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
    : columns === 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';

  return (
    <div className={`grid ${gridColsClass} gap-4 ${className}`}>
      {vocabularyList.map((vocabItem, idx) => {
        const wordKey = typeof vocabItem === 'string' ? vocabItem : vocabItem.word;
        const visual = getVocabularyVisual(wordKey);

        const vocabObj = typeof vocabItem === 'string'
          ? { word: vocabItem, ipa: '', vietnamese: '', example: '' }
          : vocabItem;

        return (
          <VocabularyVisualCard
            key={idx}
            vocab={vocabObj}
            visual={visual}
            onSpeak={onSpeak}
          />
        );
      })}
    </div>
  );
}
