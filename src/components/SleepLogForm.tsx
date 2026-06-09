import React, { useState } from 'react';
import { sleepService } from '../services/sleepService';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Star, Clock, Calendar, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export default function SleepLogForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState(format(new Date(), "yyyy-MM-dd'T'22:00"));
  const [endTime, setEndTime] = useState(format(new Date(), "yyyy-MM-dd'T'07:00"));
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Check if end time is after start time
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      alert("Waking time must be after bedtime. Please check your times.");
      return;
    }
    
    setLoading(true);
    try {
      await sleepService.logSleep({
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        quality,
        notes,
        mood
      });
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to save sleep log. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNotes('');
    setMood('Neutral');
    setQuality(3);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-900/50 z-50 transition-colors hover:bg-indigo-500"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative overflow-hidden backdrop-blur-xl border-white/10"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-6 tracking-tight">Log Sleep</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Start of Sleep
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Woke Up At
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Quality</label>
                  <div className="flex justify-between items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setQuality(star)}
                        className={`p-2 rounded-lg transition-all ${quality >= star ? 'text-indigo-400' : 'text-zinc-600'}`}
                      >
                        <Star className={`w-6 h-6 ${quality >= star ? 'fill-indigo-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Mood Upon Waking</label>
                  <select 
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                  >
                    <option value="Exhausted">Exhausted</option>
                    <option value="Tired">Tired</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Refreshed">Refreshed</option>
                    <option value="Energized">Energized</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dreams, disruptions, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors min-h-[80px]"
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-full font-bold transition-all shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-2"
                >
                  {loading ? 'Logging...' : (
                    <>
                      <Check className="w-5 h-5" />
                      Save Log
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}