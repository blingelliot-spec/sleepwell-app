import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Volume2, VolumeX } from 'lucide-react';

export default function SmartAlarm() {
  const [alarmTime, setAlarmTime] = useState('07:30');
  const [isOn, setIsOn] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isRinging, setIsRinging] = useState(false);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const playAlarmSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      // A single bell chime — sine + triangle layered for warmth
      const chime = (startTime, freq, duration = 1.8) => {
        [
          { type: 'sine', gainMul: 1.0 },
          { type: 'triangle', gainMul: 0.4 },
        ].forEach(({ type, gainMul }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = type;
          osc.frequency.value = freq;

          // Bell-like envelope: instant attack, long natural decay
          gain.gain.setValueAtTime(0.0, startTime);
          gain.gain.linearRampToValueAtTime(0.8 * gainMul, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.3 * gainMul, startTime + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      };

      // A soft reverb-like effect using delayed copies
      const chimeWithEcho = (startTime, freq) => {
        chime(startTime, freq, 2.0);
        chime(startTime + 0.18, freq * 0.998, 1.6); // slight detune echo
      };

      // Pleasant ascending chime sequence — C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.50];

      // Play the sequence 3 times, getting gently louder
      for (let round = 0; round < 3; round++) {
        const roundStart = ctx.currentTime + round * 3.5;
        notes.forEach((freq, i) => {
          chimeWithEcho(roundStart + i * 0.55, freq);
        });
      }

    } catch (e) {
      console.log('Web Audio not available:', e);
    }
  };

  const stopAlarmSound = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    if (isOn && currentTime === alarmTime && !isRinging) {
      setIsRinging(true);
      playAlarmSound();

      if (Notification.permission === 'granted') {
        new Notification('🌅 Time to wake up!', {
          body: 'Good morning! Time to start your day.',
        });
      }
    }
  }, [currentTime, alarmTime, isOn, isRinging]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleTimeChange = (e) => {
    setAlarmTime(e.target.value);
    setIsRinging(false);
    stopAlarmSound();
  };

  const toggleAlarm = () => {
    setIsOn(prev => !prev);
    setIsRinging(false);
    stopAlarmSound();
  };

  const stopRinging = () => {
    setIsRinging(false);
    stopAlarmSound();
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl shadow-indigo-900/20">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" /> Smart Alarm
        </span>
        <button
          onClick={toggleAlarm}
          className={`text-[10px] px-3 py-1 rounded-full transition-colors ${
            isOn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {isOn ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <Clock className="w-5 h-5 opacity-70" />
        <input
          type="time"
          value={alarmTime}
          onChange={handleTimeChange}
          disabled={!isOn}
          className="text-4xl font-light bg-transparent border-none outline-none w-40 disabled:opacity-50"
        />
        {isRinging && (
          <button
            onClick={stopRinging}
            className="ml-auto text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors flex items-center gap-1"
          >
            <VolumeX className="w-3 h-3" /> Stop
          </button>
        )}
      </div>
      <div className="flex justify-between items-center">
        <div className="text-[10px] opacity-70 uppercase tracking-wider">
          {isOn ? `Alarm set for ${alarmTime}` : 'Alarm disabled'}
        </div>
        {isRinging && (
          <div className="text-[10px] text-yellow-300 animate-pulse flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> RINGING
          </div>
        )}
      </div>
    </div>
  );
}