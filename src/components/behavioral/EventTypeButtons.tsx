'use client';

import type { EventType } from '@/hooks/useBehavioralLogger';

interface EventTypeButtonsProps {
  onSelect: (type: EventType) => void;
  selectedOutcomeName?: string;
}

const EVENT_TYPES = [
  {
    type: 'I' as EventType,
    label: 'Independent',
    emoji: '✅',
    description: 'Completed without assistance',
    color: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700',
    textColor: 'text-white',
  },
  {
    type: 'VP' as EventType,
    label: 'Verbal Prompt',
    emoji: '💬',
    description: 'Needed verbal reminders',
    color: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    textColor: 'text-white',
  },
  {
    type: 'PP' as EventType,
    label: 'Physical Prompt',
    emoji: '🤝',
    description: 'Needed physical assistance',
    color: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
    textColor: 'text-white',
  },
  {
    type: 'M' as EventType,
    label: 'Goal Met',
    emoji: '⭐',
    description: 'Achieved the target goal',
    color: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700',
    textColor: 'text-gray-900',
  },
  {
    type: 'U' as EventType,
    label: 'Not Met',
    emoji: '⚠️',
    description: 'Did not meet the goal',
    color: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    textColor: 'text-white',
  },
  {
    type: 'NA' as EventType,
    label: 'Not Applicable',
    emoji: '➖',
    description: 'Goal not relevant today',
    color: 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700',
    textColor: 'text-white',
  },
  {
    type: 'R' as EventType,
    label: 'Refused',
    emoji: '🚫',
    description: 'Chose not to participate',
    color: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
    textColor: 'text-white',
  },
];

export default function EventTypeButtons({ onSelect, selectedOutcomeName }: EventTypeButtonsProps) {
  const handleSelect = (type: EventType) => {
    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onSelect(type);
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen">
      <div className="w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
          How did it go?
        </h2>
        {selectedOutcomeName && (
          <p className="text-sm text-gray-600 mb-6 text-center">
            {selectedOutcomeName}
          </p>
        )}

        <div className="space-y-3">
          {EVENT_TYPES.map(({ type, label, emoji, description, color, textColor }) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className={`w-full min-h-[96px] rounded-xl transition-all transform active:scale-[0.97] shadow-md ${color} ${textColor} p-4 flex items-center gap-4`}
            >
              <div className="text-4xl flex-shrink-0">
                {emoji}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-lg mb-1">
                  {type} - {label}
                </div>
                <div className="text-sm opacity-90">
                  {description}
                </div>
              </div>
              <div className="text-2xl flex-shrink-0">
                →
              </div>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">
            Quick Reference
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div><strong>VP:</strong> Verbal Prompt</div>
            <div><strong>PP:</strong> Physical Prompt</div>
            <div><strong>I:</strong> Independent</div>
            <div><strong>M:</strong> Goal Met</div>
            <div><strong>U:</strong> Not Met</div>
            <div><strong>NA:</strong> Not Applicable</div>
            <div><strong>R:</strong> Refused</div>
          </div>
        </div>
      </div>
    </div>
  );
}
