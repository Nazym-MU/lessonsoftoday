'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { DatabaseService } from '@/lib/database';
import { supabaseClient } from '@/lib/supabase';

interface Quote {
  quote: string;
  author: string;
  category: string;
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [progress, setProgress] = useState(65);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '🤔', label: 'Thoughtful' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '😟', label: 'Anxious' },
    { emoji: '🙂', label: 'Neutral' },
  ];

  useEffect(() => {
    loadQuote();
    if (!isLoading && user) {
      loadUserProgress();
    }
  }, [isLoading, user]);

  const loadQuote = async () => {
    try {
      const randomQuote = await DatabaseService.getRandomQuote();
      setQuote(randomQuote);
    } catch (error) {
      console.error('Error loading quote:', error);
    }
  };

  const loadUserProgress = async () => {
    if (!user) return;
    
    try {
      // Get auth token
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: 'progress_tracking' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress(Math.round(data.progress.consistency));
        setAnalysis(data.progress);
      } else {
        console.error('Failed to load progress:', response.status);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    
    if (user) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await DatabaseService.createMoodEntry({
          user_id: user.id,
          date: today,
          mood: mood.toLowerCase(),
          confidence: 0.8,
          description: `User selected ${mood} from home page`,
          source: 'manual',
        });
      } catch (error) {
        console.error('Error saving mood:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Inspirational Quote Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-slate-600 mb-3">Daily Inspiration</h2>
            {quote ? (
              <>
                <blockquote className="text-slate-700 italic text-base leading-relaxed">
                  "{quote.quote}"
                </blockquote>
                <p className="text-sm text-slate-500 mt-3">- {quote.author}</p>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {/* Welcome Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl sm:text-4xl font-light text-slate-700 mb-2">Welcome Back</h1>
          <p className="text-slate-500">How are you feeling today?</p>
        </div>

        {/* Main Navigation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/chat" className="group bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 rounded-2xl p-8 shadow-sm border border-blue-200/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-blue-300/50 rounded-full flex items-center justify-center group-hover:bg-blue-400/50 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-700">Chat</h3>
              <p className="text-sm text-slate-600 text-center">Talk with your AI companion</p>
            </div>
          </Link>

          <Link href="/plan" className="group bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 rounded-2xl p-8 shadow-sm border border-green-200/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-green-300/50 rounded-full flex items-center justify-center group-hover:bg-green-400/50 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-700">Plan</h3>
              <p className="text-sm text-slate-600 text-center">Set goals and track progress</p>
            </div>
          </Link>
        </div>

        {/* Progress Bar Component */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-slate-700">Daily Progress</h3>
            <span className="text-sm font-medium text-slate-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-500 mt-2">Keep going! You're doing great today.</p>
        </div>

        {/* Mood Tracker Component */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
          <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">How are you feeling?</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.label}
                onClick={() => handleMoodSelect(mood.label)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                  selectedMood === mood.label
                    ? 'bg-blue-100 border-2 border-blue-300 shadow-sm scale-105'
                    : 'bg-white/50 border border-slate-200 hover:bg-white/80 hover:scale-105'
                }`}
              >
                <span className="text-2xl mb-1">{mood.emoji}</span>
                <span className="text-xs text-slate-600 font-medium">{mood.label}</span>
              </button>
            ))}
          </div>
          {selectedMood && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl text-center">
              <p className="text-sm text-slate-600">
                You're feeling <span className="font-medium text-blue-600">{selectedMood.toLowerCase()}</span> today. 
                That's perfectly okay.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
