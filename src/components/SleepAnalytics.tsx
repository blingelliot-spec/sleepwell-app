import React from 'react';
import { SleepLog } from '../types';
import { format } from 'date-fns';
import { BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface Props {
  logs: SleepLog[];
  bedtimeGoal: string | null;
}

export default function SleepAnalytics({ logs, bedtimeGoal }: Props) {
  if (logs.length === 0) {
    return (
      <div className="glass-card p-6 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-lg tracking-tight">Sleep Analytics</h3>
        </div>
        <p className="text-sm text-slate-500 text-center py-6">
          Add sleep logs to see your bedtime analytics!
        </p>
      </div>
    );
  }

  const recentLogs = logs.slice(0, 7);
  
  // Calculate average bedtime
  const bedtimes = recentLogs.map(log => {
    const start = log.startTime.toDate();
    return start.getHours() * 60 + start.getMinutes();
  });
  
  const avgBedtimeMinutes = bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length;
  const avgBedtimeHour = Math.floor(avgBedtimeMinutes / 60);
  const avgBedtimeMinute = Math.floor(avgBedtimeMinutes % 60);
  const avgBedtimeStr = `${avgBedtimeHour.toString().padStart(2, '0')}:${avgBedtimeMinute.toString().padStart(2, '0')}`;
  
  // Calculate average wake time
  const wakeTimes = recentLogs.map(log => {
    const end = log.endTime.toDate();
    return end.getHours() * 60 + end.getMinutes();
  });
  
  const avgWakeMinutes = wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length;
  const avgWakeHour = Math.floor(avgWakeMinutes / 60);
  const avgWakeMinute = Math.floor(avgWakeMinutes % 60);
  const avgWakeStr = `${avgWakeHour.toString().padStart(2, '0')}:${avgWakeMinute.toString().padStart(2, '0')}`;

  // Calculate deviation from goal
  let deviationText = 'Set a bedtime goal';
  let deviationColor = 'text-slate-400';
  let deviationIcon = null;

  if (bedtimeGoal) {
    const [goalHour, goalMinute] = bedtimeGoal.split(':').map(Number);
    const goalMinutes = goalHour * 60 + goalMinute;
    const deviationMinutes = avgBedtimeMinutes - goalMinutes;
    const deviationHrs = Math.floor(Math.abs(deviationMinutes) / 60);
    const deviationMins = Math.abs(deviationMinutes) % 60;
    
    if (deviationMinutes > 0) {
      deviationText = `${deviationHrs > 0 ? `${deviationHrs}h ` : ''}${deviationMins}min late on average`;
      deviationColor = 'text-orange-400';
      deviationIcon = <TrendingUp className="w-4 h-4" />;
    } else if (deviationMinutes < 0) {
      deviationText = `${deviationHrs > 0 ? `${deviationHrs}h ` : ''}${deviationMins}min early on average`;
      deviationColor = 'text-green-400';
      deviationIcon = <TrendingDown className="w-4 h-4" />;
    } else {
      deviationText = 'Perfect! On time! 🎯';
      deviationColor = 'text-green-400';
    }
  }

  return (
    <div className="glass-card p-6 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-lg tracking-tight">Sleep Analytics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Avg Bedtime</p>
          <p className="text-xl font-medium mt-1">{avgBedtimeStr}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Avg Wake Time</p>
          <p className="text-xl font-medium mt-1">{avgWakeStr}</p>
        </div>
      </div>

      {bedtimeGoal && (
        <div className={`mt-3 flex items-center justify-center gap-2 ${deviationColor} text-sm font-medium`}>
          {deviationIcon}
          {deviationText}
        </div>
      )}

      {!bedtimeGoal && (
        <p className="text-xs text-slate-500 text-center mt-2">
          Set a bedtime goal above to see your progress
        </p>
      )}

      <div className="mt-3 text-center">
        <p className="text-[10px] text-slate-500">
          Based on last {recentLogs.length} day(s)
        </p>
      </div>
    </div>
  );
}