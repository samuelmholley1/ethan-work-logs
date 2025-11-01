'use client';

import { useState, useEffect, useRef } from 'react';

interface EventNotesProps {
  initialNotes?: string;
  onNotesChange: (notes: string) => void;
  onSkip: () => void;
  onContinue: () => void;
}

export default function EventNotes({ 
  initialNotes = '', 
  onNotesChange, 
  onSkip, 
  onContinue 
}: EventNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Web Speech API is available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const newNotes = notes + (notes ? ' ' : '') + transcript;
        setNotes(newNotes);
        onNotesChange(newNotes);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        // Show user-friendly error
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else {
          console.error('Speech recognition error:', event.error);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [notes, onNotesChange, isListening]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(value);
  };

  const startVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        setIsListening(false);
        alert('Unable to start voice input. Please try again.');
      }
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Failed to stop voice recognition:', error);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-4">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
          Add Notes (Optional)
        </h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          What happened during this activity?
        </p>

        {/* Textarea */}
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Describe the activity, environment, or any relevant observations..."
          className="w-full min-h-[200px] p-4 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none text-base"
          maxLength={500}
        />

        <div className="flex items-center justify-between mt-2 mb-6">
          <span className={`text-xs ${notes.length > 450 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            {notes.length}/500 characters
            {notes.length > 450 && ' - Close to limit!'}
          </span>
          {voiceSupported && (
            <span className="text-xs text-emerald-600">
              🎤 Voice input available
            </span>
          )}
        </div>

        {/* Voice Input Button */}
        {voiceSupported && (
          <button
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            className={`w-full py-4 rounded-xl font-semibold transition-all mb-4 flex items-center justify-center gap-2 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white'
            }`}
          >
            <span className="text-2xl">{isListening ? '⏹️' : '🎤'}</span>
            <span>{isListening ? 'Stop Recording' : 'Voice Input'}</span>
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto">
          <button
            onClick={onSkip}
            className="flex-1 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-lg"
          >
            {notes.trim() ? 'Continue →' : 'Skip →'}
          </button>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Helpful details:</strong> Location, peer interactions, staff support needed, 
            client's mood, environmental factors, or anything unusual.
          </p>
        </div>
      </div>
    </div>
  );
}
