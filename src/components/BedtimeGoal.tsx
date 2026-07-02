import React, { useState, useEffect } from 'react';
import { Moon, Clock, Save, CheckCircle } from 'lucide-react';
import { sleepService } from '../services/sleepService';

export default function BedtimeGoal() {
  const [bedtimeGoal, setBedtimeGoal] = useState('22:30');
  const [savedGoal, setSavedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load saved goal from Firestore
  useEffect(() => {
    const loadGoal = async () => {
      try {
        const goal = await sleepService.getBedtimeGoal();
        if (goal) {
          setBedtimeGoal(goal);
          setSavedGoal(goal);
        }
      } catch (error) {
        console.error('Error loading bedtime goal:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGoal();
  }, []);

  const saveGoal = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await sleepService.saveBedtimeGoal(bedtimeGoal);
      setSavedGoal(bedtimeGoal);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving bedtime goal:', error);
      alert('Failed to save bedtime goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 backdrop-blur-md">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
          <Moon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg tracking-tight">Bedtime Goal</h3>
          <p className="text-xs text-slate-500">Set your ideal bedtime</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">
            Ideal Bedtime
          </label>
          <input
            type="time"
            value={bedtimeGoal}
            onChange={(e) => setBedtimeGoal(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500/50 text-white"
          />
        </div>
        <button
          onClick={saveGoal}
          disabled={saving}
          className="mt-2 sm:mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </div>

      {saveSuccess && (
        <div className="mt-3 text-xs text-green-400 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> Goal saved successfully!
        </div>
      )}

      {savedGoal && (
        <div className="mt-3 text-xs text-slate-400">
          Current goal: <span className="text-indigo-400 font-medium">{savedGoal}</span>
        </div>
      )}
    </div>
  );
}