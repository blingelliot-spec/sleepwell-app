import MonthlyReport from './components/MonthlyReport';
import QuickStartSleep from './components/QuickStartSleep';
import SmartAlarm from './components/SmartAlarm';
import BedtimeGoal from './components/BedtimeGoal';
import SleepAnalytics from './components/SleepAnalytics';
import DarkModeToggle from './components/DarkModeToggle';
import PDFExport from './components/PDFExport';
import React, { useEffect, useState } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Auth from './components/Auth';
import SleepLogForm from './components/SleepLogForm';
import SleepCycleChart from './components/SleepCycleChart';
import SleepInsights from './components/SleepInsights';
import SleepLogList from './components/SleepLogList';
import { SleepLog } from './types';
import { sleepService } from './services/sleepService';
import { Moon, LogOut, LayoutDashboard, History, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ===== DYNAMIC GREETING FUNCTION =====
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '🌅 Good morning';
  if (hour >= 12 && hour < 17) return '☀️ Good afternoon';
  if (hour >= 17 && hour < 21) return '🌇 Good evening';
  return '🌙 Good night';
}
// =====================================

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [quickStartTimes, setQuickStartTimes] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [bedtimeGoal, setBedtimeGoal] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = sleepService.subscribeToLogs((newLogs) => {
        setLogs(newLogs);
      });
      return () => unsubscribe();
    } else {
      setLogs([]);
    }
  }, [user]);

  // Load bedtime goal
  useEffect(() => {
    if (user) {
      const loadGoal = async () => {
        try {
          const goal = await sleepService.getBedtimeGoal();
          setBedtimeGoal(goal);
        } catch (error) {
          console.error('Error loading goal:', error);
        }
      };
      loadGoal();
    }
  }, [user]);

  // Quick Start Sleep handlers
  const handleStartSleep = (startTime: Date) => {
    console.log('💤 Sleep started at:', startTime);
  };

  const handleEndSleep = (startTime: Date, endTime: Date) => {
    console.log('🌅 Sleep ended at:', endTime);
    console.log('💤 Started at:', startTime);
    setQuickStartTimes({ start: startTime, end: endTime });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Moon className="w-8 h-8 text-blue-400 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="atmosphere" />
        <Auth />
      </>
    );
  }

  return (
    <div className="relative min-h-screen pb-20 overflow-x-hidden">
      <div className="atmosphere">
        <div className="atmosphere-blob-1" />
        <div className="atmosphere-blob-2" />
      </div>
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-[#070912]/50 backdrop-blur-md border-b border-white/5 h-20 flex items-center px-6 md:px-10 justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full opacity-80" />
          </div>
          <span className="text-xl font-bold tracking-tight">SleepWell</span>
        </div>
        
        <div className="flex items-center gap-3 text-slate-400">
          <div className="hidden md:flex flex-col items-end mr-1">
            <span className="text-sm font-medium text-white">{user.displayName}</span>
            <span className="text-[10px] uppercase tracking-widest">{user.email}</span>
          </div>
          
          {/* Dark Mode Toggle */}
          <DarkModeToggle />
          
          <button 
            onClick={() => auth.signOut()}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 md:px-10">
        <header className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold mb-3 tracking-tight"
          >
            {getGreeting()}, {user.displayName?.split(' ')[0]}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-base md:text-lg font-light leading-relaxed"
          >
            {logs.length > 0 
              ? `You slept an average of ${calculateAverage(logs)}h this week.`
              : "Let's start tracking your sleep journey today."
            }
          </motion.p>
        </header>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Main Content Area */}
          <section className="col-span-12 lg:col-span-8 space-y-4 md:space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 md:p-8 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-500 uppercase tracking-widest text-xs font-bold">Sleep History (Hours)</h3>
                <div className="flex space-x-2">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase tracking-wider">Weekly</div>
                </div>
              </div>
              <SleepCycleChart logs={logs} />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-slate-500" />
                <h3 className="text-xl font-medium">Recent Cycles</h3>
              </div>
              <SleepLogList logs={logs} />
            </motion.div>
          </section>

          {/* Sidebar Area */}
          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <SleepInsights logs={logs} />
            </motion.div>

            {/* Quick Start Sleep */}
            <QuickStartSleep onStartSleep={handleStartSleep} onEndSleep={handleEndSleep} />

            {/* Bedtime Goal */}
            <BedtimeGoal />

            {/* Sleep Analytics */}
            <SleepAnalytics logs={logs} bedtimeGoal={bedtimeGoal} />

            {/* Monthly Report */}
            <MonthlyReport logs={logs} />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 backdrop-blur-md"
            >
              <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Sleep Score & Stats</h4>
              
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                    <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="285" strokeDashoffset={285 - (parseInt(calculateAvgScore(logs)) / 100 * 285)} className="text-indigo-500 transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold">{calculateAvgScore(logs)}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Score</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Avg Quality</p>
                  <p className="text-xl font-medium">{calculateAvgQuality(logs)} <span className="text-xs text-slate-500">/ 5</span></p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Total Logs</p>
                  <p className="text-xl font-medium">{logs.length}</p>
                </div>
              </div>
            </motion.div>

            {/* PDF Export */}
            <PDFExport logs={logs} />

            {/* Smart Alarm */}
            <SmartAlarm />
          </aside>
        </div>
      </main>

      <SleepLogForm 
        initialStartTime={quickStartTimes.start}
        initialEndTime={quickStartTimes.end}
        onClose={() => setQuickStartTimes({ start: null, end: null })}
      />
    </div>
  );
}

function calculateAvgScore(logs: SleepLog[]) {
  if (logs.length === 0) return '0';
  const sum = logs.reduce((acc, log) => {
    const s = log.startTime.toDate().getTime();
    const e = log.endTime.toDate().getTime();
    const durationHours = (e - s) / (1000 * 60 * 60);
    const durationFactor = Math.min(durationHours / 8, 1);
    return acc + ((log.quality * 10) + (durationFactor * 50));
  }, 0);
  return Math.round(sum / logs.length).toString();
}

function calculateAverage(logs: SleepLog[]) {
  if (logs.length === 0) return '0';
  const recent = logs.slice(0, 7);
  const total = recent.reduce((acc, log) => {
    const s = log.startTime.toDate().getTime();
    const e = log.endTime.toDate().getTime();
    return acc + (e - s);
  }, 0);
  return (total / (recent.length * 1000 * 60 * 60)).toFixed(1);
}

function calculateAvgQuality(logs: SleepLog[]) {
  if (logs.length === 0) return 'N/A';
  const sum = logs.reduce((acc, log) => acc + log.quality, 0);
  return (sum / logs.length).toFixed(1);
}