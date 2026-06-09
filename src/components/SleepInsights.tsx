import React, { useState, useEffect } from 'react';
import { SleepLog } from '../types';
import { getSleepInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  logs: SleepLog[];
}

export default function SleepInsights({ logs }: Props) {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchInsights = async () => {
    if (logs.length === 0) return;
    setLoading(true);
    setError('');
    try {
      console.log("Fetching insights for", logs.length, "logs");
      const result = await getSleepInsights(logs);
      console.log("Got result:", result);
      setInsights(result);
    } catch (err) {
      console.error("AI Insights error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load insights: ${errorMessage}`);
      setInsights(`⚠️ Could not generate insights at this time. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (logs.length > 0 && !insights && !error) {
      fetchInsights();
    }
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="glass-card p-8 min-h-[200px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Sparkles className="w-24 h-24" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold tracking-tight">AI Sleep Insights</h2>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="prose prose-invert prose-indigo max-w-none prose-p:text-slate-400 prose-headings:font-bold prose-headings:tracking-tight text-sm leading-relaxed">
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
          </div>
        ) : (
          <ReactMarkdown>{insights}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}