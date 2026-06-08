import React from 'react';
import { signInWithGoogle, auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { Moon, LogIn } from 'lucide-react';

export default function Auth() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 relative overflow-hidden">
      <div className="atmosphere">
        <div className="atmosphere-blob-1" />
        <div className="atmosphere-blob-2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 relative z-10"
      >
        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-indigo-500/20">
          <Moon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold mb-6 tracking-tight">Somnus</h1>
        <p className="text-slate-400 max-w-md mx-auto text-lg font-light leading-relaxed">
          The ultimate sleep companion. Track your cycles, optimize your rest.
        </p>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogin}
        className="flex items-center gap-3 bg-white text-[#070912] px-10 py-4 rounded-full font-bold transition-all hover:bg-slate-200 shadow-xl shadow-white/10 relative z-10"
      >
        <LogIn className="w-5 h-5" />
        Sign in with Google
      </motion.button>
    </div>
  );
}
