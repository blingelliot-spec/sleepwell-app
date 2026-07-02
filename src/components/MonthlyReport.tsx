import React, { useState, useEffect } from 'react';
import { SleepLog } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from 'date-fns';
import { Calendar, TrendingUp, TrendingDown, Award, BarChart3 } from 'lucide-react';

interface Props {
  logs: SleepLog[];
}

export default function MonthlyReport({ logs }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthLogs, setMonthLogs] = useState<SleepLog[]>([]);
  const [previousMonthLogs, setPreviousMonthLogs] = useState<SleepLog[]>([]);

  useEffect(() => {
    // Filter logs for selected month
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    
    const filtered = logs.filter(log => {
      const logDate = log.startTime.toDate();
      return isWithinInterval(logDate, { start, end });
    });
    setMonthLogs(filtered);

    // Get previous month for comparison
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevStart = startOfMonth(prevMonth);
    const prevEnd = endOfMonth(prevMonth);
    
    const prevFiltered = logs.filter(log => {
      const logDate = log.startTime.toDate();
      return isWithinInterval(logDate, { start: prevStart, end: prevEnd });
    });
    setPreviousMonthLogs(prevFiltered);

  }, [logs, selectedMonth]);

  const changeMonth = (offset: number) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setSelectedMonth(newMonth);
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // Calculate stats for current month
  const totalLogs = monthLogs.length;
  const avgQuality = totalLogs > 0 
    ? (monthLogs.reduce((sum, log) => sum + log.quality, 0) / totalLogs).toFixed(1)
    : '0';
  
  const avgDuration = totalLogs > 0
    ? (monthLogs.reduce((sum, log) => {
        const start = log.startTime.toDate();
        const end = log.endTime.toDate();
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0) / totalLogs).toFixed(1)
    : '0';

  // Calculate days with sleep
  const daysWithSleep = new Set(monthLogs.map(log => 
    format(log.startTime.toDate(), 'yyyy-MM-dd')
  )).size;

  const totalDays = differenceInDays(endOfMonth(selectedMonth), startOfMonth(selectedMonth)) + 1;
  const consistency = totalDays > 0 ? Math.round((daysWithSleep / totalDays) * 100) : 0;

  // Calculate comparison with previous month
  const prevTotalLogs = previousMonthLogs.length;
  const logChange = prevTotalLogs > 0 
    ? Math.round(((totalLogs - prevTotalLogs) / prevTotalLogs) * 100)
    : totalLogs > 0 ? 100 : 0;

  const prevAvgQuality = prevTotalLogs > 0
    ? (previousMonthLogs.reduce((sum, log) => sum + log.quality, 0) / prevTotalLogs)
    : 0;
  const qualityChange = prevAvgQuality > 0
    ? ((parseFloat(avgQuality) - prevAvgQuality) / prevAvgQuality * 100)
    : 0;

  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  return (
    <div className="glass-card p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-lg tracking-tight">Monthly Report</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
          >
            ←
          </button>
          <span className="text-xs font-medium text-slate-300 min-w-[80px] text-center">
            {format(selectedMonth, 'MMM yyyy')}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
          >
            →
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 ml-1"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {totalLogs === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No sleep logs for {format(selectedMonth, 'MMMM yyyy')}</p>
          <p className="text-xs mt-1">Start logging your sleep to see your monthly report!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Logs</p>
              <p className="text-xl font-bold mt-0.5">{totalLogs}</p>
              {logChange !== 0 && (
                <p className={`text-[9px] ${logChange > 0 ? 'text-green-400' : 'text-red-400'} flex items-center justify-center gap-0.5`}>
                  {logChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(logChange)}%
                </p>
              )}
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Avg Quality</p>
              <p className="text-xl font-bold mt-0.5">{avgQuality}</p>
              {qualityChange !== 0 && (
                <p className={`text-[9px] ${qualityChange > 0 ? 'text-green-400' : 'text-red-400'} flex items-center justify-center gap-0.5`}>
                  {qualityChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(qualityChange).toFixed(0)}%
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Avg Duration</p>
              <p className="text-lg font-bold mt-0.5">{avgDuration}h</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Consistency</p>
              <p className="text-lg font-bold mt-0.5 flex items-center justify-center gap-1">
                {consistency}%
                {consistency >= 80 && <Award className="w-4 h-4 text-yellow-400" />}
              </p>
              <p className="text-[9px] text-slate-500">{daysWithSleep}/{totalDays} days</p>
            </div>
          </div>

          {/* Month-over-month indicator */}
          {previousMonthLogs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[9px] text-slate-500 text-center">
                vs previous month: {logChange > 0 ? '+' : ''}{logChange}% logs
                {qualityChange !== 0 && `, ${qualityChange > 0 ? '+' : ''}${qualityChange.toFixed(0)}% quality`}
              </p>
            </div>
          )}

          {isCurrentMonth && (
            <div className="mt-3 pt-3 border-t border-white/10 text-center">
              <p className="text-[9px] text-indigo-400">
                📊 {daysWithSleep} days tracked this month
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}