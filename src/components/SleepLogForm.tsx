import React, { useState, useEffect } from 'react';
import { sleepService } from '../services/sleepService';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Star, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface SleepLogFormProps {
  initialStartTime?: Date | null;
  initialEndTime?: Date | null;
  onClose?: () => void;
}

export default function SleepLogForm({ initialStartTime, initialEndTime, onClose }: SleepLogFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState(
    initialStartTime 
      ? format(initialStartTime, "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'22:00")
  );
  const [endTime, setEndTime] = useState(
    initialEndTime 
      ? format(initialEndTime, "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'07:00")
  );
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [loading, setLoading] = useState(false);
  
  // New interruption states
  const [interrupted, setInterrupted] = useState(false);
  const [interruptionReason, setInterruptionReason] = useState('');
  const [interruptionNotes, setInterruptionNotes] = useState('');

  // Reset form when opened with new times
  useEffect(() => {
    if (initialStartTime && initialEndTime) {
      setIsOpen(true);
    }
  }, [initialStartTime, initialEndTime]);

  // Reset interruption fields when form opens
  useEffect(() => {
    if (isOpen) {
      setInterrupted(false);
      setInterruptionReason('');
      setInterruptionNotes('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      alert("Waking time must be after bedtime. Please check your times.");
      return;
    }
    
    setLoading(true);
    try {
      const logData: any = {
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        quality,
        notes,
        mood,
        interrupted,
      };

      // Only add interruption fields if interrupted is true
      if (interrupted) {
        logData.interruptionReason = interruptionReason || 'Other';
        if (interruptionNotes) {
          logData.interruptionNotes = interruptionNotes;
        }
      }

      await sleepService.logSleep(logData);
      setIsOpen(false);
      resetForm();
      if (onClose) onClose();
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
    setInterrupted(false);
    setInterruptionReason('');
    setInterruptionNotes('');
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const interruptionReasons = [
    '🚽 Bathroom',
    '🔊 Loud noise',
    '👤 Someone woke me',
    '😰 Anxiety / Stress',
    '💭 Racing thoughts',
    '🌡️ Too hot / too cold',
    '🤒 Physical discomfort',
    '📱 Phone notification',
    '🌙 Nightmare',
    'Other'
  ];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
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
              onClick={handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-8 relative overflow-hidden backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-6 tracking-tight">
                {initialStartTime && initialEndTime ? '🌅 Log Your Sleep' : 'Log Sleep'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors appearance-none text-white"
                  >
                    <option value="Exhausted" className="bg-gray-800 text-white">Exhausted</option>
                    <option value="Tired" className="bg-gray-800 text-white">Tired</option>
                    <option value="Neutral" className="bg-gray-800 text-white">Neutral</option>
                    <option value="Refreshed" className="bg-gray-800 text-white">Refreshed</option>
                    <option value="Energized" className="bg-gray-800 text-white">Energized</option>
                  </select>
                </div>

                {/* Interruption Section */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="interrupted"
                      checked={interrupted}
                      onChange={(e) => setInterrupted(e.target.checked)}
                      className="w-5 h-5 accent-indigo-500 rounded"
                    />
                    <label htmlFor="interrupted" className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      My sleep was interrupted
                    </label>
                  </div>

                  {interrupted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pl-6"
                    >
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">
                          Reason for interruption
                        </label>
                        <select
                          value={interruptionReason}
                          onChange={(e) => setInterruptionReason(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 transition-colors text-sm text-white appearance-none"
                        >
                          <option value="" className="bg-gray-800 text-white">Select a reason...</option>
                          {interruptionReasons.map((reason) => (
                            <option key={reason} value={reason.replace(/^[^\s]+\s/, '')} className="bg-gray-800 text-white">
                              {reason}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">
                          Additional notes (optional)
                        </label>
                        <input
                          type="text"
                          value={interruptionNotes}
                          onChange={(e) => setInterruptionNotes(e.target.value)}
                          placeholder="How long were you awake? Any other details?"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 transition-colors text-sm text-white placeholder:text-slate-500"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dreams, disruptions, etc."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors min-h-[80px] text-white placeholder:text-slate-500"
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