import React, { useState, useEffect, useRef } from 'react';
import { SleepLog } from '../types';
import { getSleepInsights, askSleepQuestion } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw, Volume2, VolumeX, Send, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  logs: SleepLog[];
}

export default function SleepInsights({ logs }: Props) {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speechRate, setSpeechRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Chat states
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string }[]>([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
        setSelectedVoice(englishVoice?.name || availableVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const fetchInsights = async () => {
    if (logs.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const result = await getSleepInsights(logs);
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

  const speakInsights = () => {
    if (!insights || insights.startsWith('⚠️') || insights.startsWith('No sleep logs')) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(insights.replace(/\*/g, '').replace(/#/g, ''));
    
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    
    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Handle chat question
  const handleAskQuestion = async () => {
    if (!chatQuestion.trim() || logs.length === 0) return;

    setChatLoading(true);
    setChatAnswer(null);

    try {
      const answer = await askSleepQuestion(logs, chatQuestion);
      setChatAnswer(answer);
      setChatHistory(prev => [...prev, { question: chatQuestion, answer }]);
      setChatQuestion('');
    } catch (err) {
      console.error('Chat error:', err);
      setChatAnswer('⚠️ Sorry, I could not answer your question. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (logs.length > 0 && !insights && !error) {
      fetchInsights();
    }
  }, [logs]);

  if (logs.length === 0) return null;

  const hasInsights = insights && !insights.startsWith('⚠️') && !insights.startsWith('No sleep logs');

  return (
    <div className="glass-card p-6 backdrop-blur-md relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Sparkles className="w-20 h-20" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold tracking-tight">AI Sleep Insights</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasInsights && (
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="text-[10px] bg-white/5 border border-white/10 rounded px-2 py-1 text-slate-300 max-w-[120px]"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name}
                </option>
              ))}
            </select>
          )}
          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Insights Content */}
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

      {/* Speech Controls */}
      {hasInsights && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3 flex-wrap">
          {!isSpeaking ? (
            <button
              onClick={speakInsights}
              className="text-xs flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Volume2 className="w-4 h-4" /> Read Aloud
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resumeSpeech}
                  className="text-xs flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors"
                >
                  <Volume2 className="w-4 h-4" /> Resume
                </button>
              ) : (
                <button
                  onClick={pauseSpeech}
                  className="text-xs flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  <Volume2 className="w-4 h-4" /> Pause
                </button>
              )}
              <button
                onClick={stopSpeech}
                className="text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors"
              >
                <VolumeX className="w-4 h-4" /> Stop
              </button>
            </>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Speed</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-16 accent-indigo-500"
            />
            <span className="text-[10px] text-slate-400 min-w-[30px]">{speechRate}x</span>
          </div>
        </div>
      )}

      {/* Chat Section */}
      {logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {chatHistory.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-indigo-400">You:</span>
                    <p className="text-xs text-slate-300">{item.question}</p>
                  </div>
                  <div className="flex items-start gap-2 pl-4">
                    <span className="text-xs font-medium text-emerald-400">AI:</span>
                    <p className="text-xs text-slate-400">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !chatLoading) {
                  handleAskQuestion();
                }
              }}
              placeholder={logs.length > 0 ? "Ask about your sleep..." : "Add sleep logs first to ask questions"}
              disabled={logs.length === 0 || chatLoading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500/50 transition-colors text-sm text-white placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              onClick={handleAskQuestion}
              disabled={logs.length === 0 || chatLoading || !chatQuestion.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chatLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          {chatAnswer && !chatLoading && (
            <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-slate-300">{chatAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}