import React, { useState } from 'react';
import { storage } from '../utils/storage';

export default function Flashcards({ onNavigateBack, onSavedVocabChange }) {
  const [dueCards, setDueCards] = useState(() => {
    const now = Date.now();
    return storage.getSavedVocab().filter(card => !card.nextReviewDate || new Date(card.nextReviewDate) <= now);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewsCompleted, setReviewsCompleted] = useState(0);

  // Mobile Touch & Swipe Gestures
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  const currentCard = dueCards[currentIndex];

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(true);
    setHasDragged(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Prevent vertical page scroll if horizontal swipe is happening
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (e.cancelable) e.preventDefault();
    }
    
    if (Math.abs(deltaX) > 10) {
      setHasDragged(true);
    }
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const swipeThreshold = 100; // px
    if (dragOffset.x > swipeThreshold) {
      // Swipe Right -> Grade "Good" (4)
      handleGrade(4);
    } else if (dragOffset.x < -swipeThreshold) {
      // Swipe Left -> Grade "Again" (1)
      handleGrade(1);
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  const handleSpeak = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleGrade = (grade) => {
    if (!currentCard) return;

    // Update progress in local storage
    storage.updateWordProgress(currentCard.word, grade);
    onSavedVocabChange();

    setIsFlipped(false);
    setReviewsCompleted(prev => prev + 1);

    // If we have more cards, wait a split second for flip transition before advancing
    setTimeout(() => {
      if (grade === 1) {
        // Move current card to the end of the due list so it appears later in this session
        const cardToMove = dueCards[currentIndex];
        const remaining = dueCards.filter((_, idx) => idx !== currentIndex);
        setDueCards([...remaining, cardToMove]);
        setCurrentIndex(0);
      } else {
        // Word learned, remove from current session
        const remaining = dueCards.filter((_, idx) => idx !== currentIndex);
        setDueCards(remaining);
        setCurrentIndex(0);
      }
    }, 200);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (dueCards.length === 0) {
    return (
      <div className="flashcards-empty glass-glow p-8 text-center max-w-xl mx-auto mt-10 animate-slideup">
        <span className="icon-huge">🎉</span>
        <h2 className="text-gradient mt-4 mb-2">All Caught Up!</h2>
        <p className="color-text-muted mb-6">You have reviewed all your words for today. Good job! Add more words from reading passages to study.</p>
        
        {reviewsCompleted > 0 && (
          <p className="mb-6 text-sm color-text-muted">Reviewed <strong>{reviewsCompleted}</strong> words in this session.</p>
        )}

        <button className="btn-primary" onClick={onNavigateBack}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flashcards-screen animate-slideup">
      {/* Header */}
      <div className="screen-header mb-6">
        <button className="btn-secondary" onClick={onNavigateBack}>
          ← Back to Dashboard
        </button>
        <div className="topic-meta">
          <span className="badge-level">SRS</span>
          <span className="topic-name">Spaced Repetition Review</span>
        </div>
      </div>

      <div className="flashcards-layout max-w-lg mx-auto">
        <div className="flashcards-progress mb-6 flex justify-between items-center text-sm color-text-muted">
          <span>Remaining reviews: <strong>{dueCards.length}</strong></span>
          <span>Session completed: <strong>{reviewsCompleted}</strong></span>
        </div>

        {/* 3D Flashcard Wrapper */}
        <div 
          className={`flashcard-container ${isFlipped ? 'flipped' : ''}`} 
          onClick={() => {
            if (!hasDragged) {
              handleFlip();
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: isDragging ? `translateX(${dragOffset.x}px) rotate(${dragOffset.x * 0.05}deg)` : '',
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            touchAction: 'pan-y',
            position: 'relative'
          }}
        >
          {/* Touch Swipe Indicators */}
          {isDragging && dragOffset.x > 30 && (
            <div className="swipe-badge swipe-good">Good</div>
          )}
          {isDragging && dragOffset.x < -30 && (
            <div className="swipe-badge swipe-again">Again</div>
          )}

          <div className="flashcard-inner">
            
            {/* Front Side */}
            <div className="flashcard-front glass p-6">
              <span className="card-hint">Topic: {currentCard.topic}</span>
              <h2 className="card-word">{currentCard.word}</h2>
              <p className="card-ipa">{currentCard.ipa}</p>
              
              <button 
                className="speak-btn-large" 
                onClick={(e) => {
                  e.stopPropagation(); // prevent card flip
                  handleSpeak(currentCard.word);
                }}
              >
                🔊 Pronounce
              </button>
              
              <span className="flip-instruction">Click card to reveal translation</span>
            </div>

            {/* Back Side */}
            <div className="flashcard-back glass p-6">
              <span className="card-hint">Translation</span>
              <h2 className="card-translation-text">{currentCard.vietnamese}</h2>
              
              <div className="card-example-box mt-4">
                <strong>Example Sentence:</strong>
                <p className="italic color-text-muted mt-1">"{currentCard.example}"</p>
              </div>
              
              <span className="flip-instruction">Click card to view front</span>
            </div>

          </div>
        </div>

        {/* Grading Buttons (shown when card is flipped) */}
        <div className={`grading-bar mt-8 ${isFlipped ? 'visible' : ''}`}>
          <p className="text-center text-sm color-text-muted mb-3">How well did you recall this word?</p>
          <div className="grading-buttons">
            <button className="btn-grade again" onClick={(e) => { e.stopPropagation(); handleGrade(1); }}>
              <span>Again</span>
              <small>&lt;1m</small>
            </button>
            <button className="btn-grade hard" onClick={(e) => { e.stopPropagation(); handleGrade(3); }}>
              <span>Hard</span>
              <small>1d</small>
            </button>
            <button className="btn-grade good" onClick={(e) => { e.stopPropagation(); handleGrade(4); }}>
              <span>Good</span>
              <small>4d</small>
            </button>
            <button className="btn-grade easy" onClick={(e) => { e.stopPropagation(); handleGrade(5); }}>
              <span>Easy</span>
              <small>8d</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
