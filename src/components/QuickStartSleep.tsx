import React, { useState, useEffect } from 'react';
import { Moon, Sun, Clock } from 'lucide-react';

interface QuickStartSleepProps {
  onStartSleep: (startTime: Date) => void;
  onEndSleep: (startTime: Date, endTime: Date) => void;
}

export default function QuickStartSleep({ onStartSleep, onEndSleep }: QuickStartSleepProps) {
  const [isSleeping, setIsSleeping] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('');

  // Load sleep state from localStorage on mount
  useEffect(() => {
    const savedStartTime = localStorage.getItem('sleepStartTime');
    if (savedStartTime) {
      const parsed = new Date(savedStartTime);
      if (!isNaN(parsed.getTime())) {
        setIsSleeping(true);
        setStartTime(parsed);
      } else {
        localStorage.removeItem('sleepStartTime');
      }
    }
  }, []);

  // Update elapsed time every second when sleeping
  useEffect(() => {
    if (!isSleeping || !startTime) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setElapsedTime(`${diffHrs}h ${diffMins}m`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isSleeping, startTime]);

  const handleStartSleep = () => {
    const now = new Date();
    setIsSleeping(true);
    setStartTime(now);
    localStorage.setItem('sleepStartTime', now.toISOString());
    onStartSleep(now);
  };

  const handleEndSleep = () => {
    if (!startTime) return;
    const endTime = new Date();
    setIsSleeping(false);
    localStorage.removeItem('sleepStartTime');
    setElapsedTime('');
    onEndSleep(startTime, endTime);
  };

  return (
    <div className="glass-card p-6 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg tracking-tight">Quick Start Sleep</h3>
          <p className="text-xs text-slate-500">
            {isSleeping ? 'Sleeping...' : 'Ready to sleep'}
          </p>
        </div>
      </div>

      {isSleeping ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
            <span className="text-sm text-slate-400">Elapsed time</span>
            <span className="text-lg font-mono text-indigo-400">{elapsedTime || '0h 0m'}</span>
          </div>
          <button
            onClick={handleEndSleep}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-900/30 flex items-center justify-center gap-2"
          >
            <Sun className="w-5 h-5" />
            End Sleep - Wake Up
          </button>
        </div>
      ) : (
        <button
          onClick={handleStartSleep}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2"
        >
          <Moon className="w-5 h-5" />
          Start Sleep
        </button>
      )}
    </div>
  );
}