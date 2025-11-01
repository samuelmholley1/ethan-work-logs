'use client';

import { useState, useEffect } from 'react';
import type { Outcome } from '@/types/worklog';

interface OutcomeSelectorProps {
  outcomes: Outcome[];
  onSelect: (outcome: Outcome) => void;
}

export default function OutcomeSelector({ outcomes, onSelect }: OutcomeSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(currentIndex - 1);
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      } else if (e.key === 'ArrowRight' && currentIndex < outcomes.length - 1) {
        e.preventDefault();
        setCurrentIndex(currentIndex + 1);
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const currentOutcome = outcomes[currentIndex];
        if (currentOutcome) {
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
          onSelect(currentOutcome);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, outcomes, onSelect]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < outcomes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }

    // Reset touch tracking
    setTouchStart(null);
    setTouchEnd(null);
  };

  const currentOutcome = outcomes[currentIndex];

  if (!currentOutcome) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <p className="text-gray-500 text-center">No outcomes available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">
        Which outcome?
      </h2>

      {/* Swipeable Card */}
      <div
        className="w-full max-w-md touch-pan-y" 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-500 min-h-[280px] flex flex-col justify-between transition-transform active:scale-[0.98] select-none">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg">
                {currentIndex + 1}
              </span>
              <span className="text-sm text-gray-500">
                {currentIndex + 1} of {outcomes.length}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug">
              {currentOutcome.title}
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed">
              {currentOutcome.description}
            </p>
          </div>

          <button
            onClick={() => {
              if ('vibrate' in navigator) {
                navigator.vibrate(50);
              }
              onSelect(currentOutcome);
            }}
            className="mt-6 w-full py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors text-lg"
          >
            Select →
          </button>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {outcomes.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-emerald-600 w-8'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to outcome ${index + 1}`}
          />
        ))}
      </div>

      {/* Swipe Hint */}
      {outcomes.length > 1 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          ← Swipe to browse outcomes →
        </p>
      )}
    </div>
  );
}
