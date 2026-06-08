import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SleepLog } from '../types';
import { format } from 'date-fns';

interface Props {
  logs: SleepLog[];
}

export default function SleepCycleChart({ logs }: Props) {
  const data = logs.slice().reverse().map(log => {
    const start = log.startTime.toDate();
    const end = log.endTime.toDate();
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return {
      date: format(start, 'MMM d'),
      hours: parseFloat(duration.toFixed(1)),
      quality: log.quality,
    };
  });

  const getBarColor = (hours: number) => {
    if (hours < 6) return '#ef4444'; // red-500
    if (hours < 7) return '#6d28d9'; // purple-700
    return '#6366f1'; // indigo-500
  };

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '12px'
            }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.hours)} fillOpacity={entry.hours < 7 ? 0.6 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
