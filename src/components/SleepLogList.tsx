import React from 'react';
import { SleepLog } from '../types';
import { format } from 'date-fns';
import { Star, Clock, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  logs: SleepLog[];
}

export default function SleepLogList({ logs }: Props) {
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
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  {format(start, 'EEEE, MMM do')}
                </h3>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                  {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Duration</p>
                <p className="text-xl font-medium">{duration.toFixed(1)}h</p>
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
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
