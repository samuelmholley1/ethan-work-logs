'use client';

import { useState, useEffect } from 'react';

interface PromptCounterProps {
  initialCount?: number;
  onCountChange: (count: number) => void;
  onContinue: () => void;
  eventType: 'VP' | 'PP';
}

const QUICK_SELECT_VALUES = [1, 2, 3, 4, 5];

export default function PromptCounter({ 
  initialCount = 1, 
  onCountChange, 
  onContinue,
  eventType 
}: PromptCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    onCountChange(count);
  }, [count, onCountChange]);

  const increment = () => {
    const newCount = count + 1;
    setCount(newCount);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const decrement = () => {
    if (count > 0) {
      const newCount = count - 1;
      setCount(newCount);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  };

  const selectQuickValue = (value: number) => {
    setCount(value);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const eventTypeLabel = eventType === 'VP' ? 'Verbal Prompts' : 'Physical Prompts';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
          {eventTypeLabel}
        </h2>
        <p className="text-sm text-gray-600 mb-8 text-center">
          How many prompts were needed?
        </p>

        {/* Large Stepper */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={decrement}
            disabled={count === 0}
            className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 disabled:opacity-40 disabled:hover:bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-700 transition-all active:scale-95 shadow-md"
            aria-label="Decrease count"
          >
            −
          </button>

          <div className="w-32 h-32 rounded-2xl bg-emerald-100 border-4 border-emerald-500 flex items-center justify-center">
            <span className="text-6xl font-bold text-emerald-700">
              {count}
            </span>
          </div>

          <button
            onClick={increment}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 flex items-center justify-center text-3xl font-bold text-white transition-all active:scale-95 shadow-md"
            aria-label="Increase count"
          >
            +
          </button>
        </div>

        {/* Quick Select Chips */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3 text-center">
            Quick Select:
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {QUICK_SELECT_VALUES.map((value) => (
              <button
                key={value}
                onClick={() => selectQuickValue(value)}
                className={`min-w-[48px] h-12 px-4 rounded-full font-semibold transition-all active:scale-95 ${
                  count === value
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                }`}
              >
                {value}
              </button>
            ))}
            <button
              onClick={() => selectQuickValue(6)}
              className={`min-w-[48px] h-12 px-4 rounded-full font-semibold transition-all active:scale-95 ${
                count >= 6
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
            >
              5+
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors text-lg shadow-lg"
        >
          Continue →
        </button>

        {/* Context Help */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Record the number of times you needed to provide a{' '}
            {eventType === 'VP' ? 'verbal reminder' : 'physical cue'} to complete the activity.
          </p>
        </div>
      </div>
    </div>
  );
}
