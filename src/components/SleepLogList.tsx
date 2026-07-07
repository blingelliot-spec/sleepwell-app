import React, { useState, useMemo } from 'react';
import { SleepLog } from '../types';
import { format } from 'date-fns';
import { Star, Clock, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { sleepService } from '../services/sleepService';

interface Props {
  logs: SleepLog[];
}

export default function SleepLogList({ logs }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const handleDelete = async (logId: string) => {
    if (confirm('Are you sure you want to delete this sleep log? This cannot be undone.')) {
      setDeletingId(logId);
      try {
        await sleepService.deleteLog(logId);
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete log. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  // Memoize visible logs to prevent unnecessary re-renders
  const visibleLogs = useMemo(() => logs.slice(0, visibleCount), [logs, visibleCount]);
  const hasMore = visibleCount < logs.length;

  if (logs.length === 0) return (
    <div className="text-center py-12 text-zinc-500 font-light">
      No sleep logs recorded yet. Create your first one!
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span>Showing {Math.min(visibleCount, logs.length)} of {logs.length} logs</span>
      </div>

      {visibleLogs.map((log) => {
        const start = log.startTime.toDate();
        const end = log.endTime.toDate();
        let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        const isInvalid = duration <= 0;
        if (isInvalid) duration = Math.abs(duration);

        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`glass-card p-4 grid grid-cols-2 md:grid-cols-5 gap-2 items-center backdrop-blur-md ${isInvalid ? 'border-red-500/50' : ''}`}
          >
            {/* Date & Time - spans 2 cols on mobile, 2 on desktop */}
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isInvalid ? 'bg-red-500/20' : 'bg-indigo-500/10'}`}>
                  <Clock className={`w-4 h-4 ${isInvalid ? 'text-red-400' : 'text-indigo-400'}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {format(start, 'EEE, MMM d')}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                  </p>
                  {isInvalid && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Invalid
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Duration</p>
              <p className={`text-sm font-medium ${isInvalid ? 'text-red-400' : ''}`}>
                {duration.toFixed(1)}h
              </p>
            </div>

            {/* Quality */}
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Quality</p>
              <div className="flex gap-0.5 justify-center">
                {[...Array(log.quality)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                ))}
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(log.id!)}
              disabled={deletingId === log.id}
              className="justify-self-end p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
              aria-label="Delete log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        );
      })}

      {hasMore && (
        <button
          onClick={loadMore}
          className="w-full py-3 glass-card hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white"
        >
          <ChevronDown className="w-4 h-4" />
          Load More
        </button>
      )}
    </div>
  );
}