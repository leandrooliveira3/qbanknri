import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface QuestionTimerProps {
  isActive: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

export const QuestionTimer: React.FC<QuestionTimerProps> = ({ isActive, onTimeUpdate }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev + 1;
          onTimeUpdate?.(newValue);
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, onTimeUpdate]);

  // Reset quando questão muda
  useEffect(() => {
    setSeconds(0);
  }, [isActive]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg text-sm font-mono">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-foreground">{formatTime(seconds)}</span>
    </div>
  );
};
