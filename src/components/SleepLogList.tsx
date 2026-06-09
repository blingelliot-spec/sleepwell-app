import React, { useState } from 'react';
import { SleepLog } from '../types';
import { format } from 'date-fns';
import { Star, Clock, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { sleepService } from '../services/sleepService';

interface Props {
  logs: SleepLog[];
}

export default function SleepLogList({ logs }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  if (logs.length === 0) return (
    <div className="text-center py-20 text-zinc-500 font-light">
      No sleep logs recorded yet. Create your first one!
    </div>
  );

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const start = log.startTime.toDate();
        const end = log.endTime.toDate();
        let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        // Show warning if duration is negative
        const isInvalid = duration <= 0;
        if (isInvalid) duration = Math.abs(duration);

        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md ${isInvalid ? 'border-red-500/50' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isInvalid ? 'bg-red-500/20' : 'bg-indigo-500/10'}`}>
                <Clock className={`w-6 h-6 ${isInvalid ? 'text-red-400' : 'text-indigo-400'}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  {format(start, 'EEEE, MMM do')}
                </h3>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                  {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                </p>
                {isInvalid && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Invalid: End time before start time
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Duration</p>
                <p className={`text-xl font-medium ${isInvalid ? 'text-red-400' : ''}`}>
                  {duration.toFixed(1)}h {isInvalid && '⚠️'}
                </p>
              </div>

              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Quality</p>
                <div className="flex gap-1 justify-center">
                  {[...Array(log.quality)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                  ))}
                </div>
              </div>

              <div className="text-center hidden sm:block">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Mood</p>
                <p className="text-slate-300 font-medium">{log.mood || 'N/A'}</p>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(log.id!)}
                disabled={deletingId === log.id}
                className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}