'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface Task {
  priority1: string;
  priority3: string[];
  priority5: string[];
}

function EntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [morningPlan, setMorningPlan] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [generatedTasks, setGeneratedTasks] = useState<Task | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam);
    } else {
      // Default to today if no date provided
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [dateParam]);

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const handleGenerateTasks = async () => {
    if (!morningPlan.trim()) return;

    setIsGenerating(true);
    
    // Simulate AI task generation (replace with actual API call)
    setTimeout(() => {
      const sampleTasks: Task = {
        priority1: 'Complete the most important project milestone',
        priority3: [
          'Review and respond to important emails',
          'Have focused work session on main project',
          'Take a proper lunch break and walk'
        ],
        priority5: [
          'Organize workspace for better productivity',
          'Read industry articles for 20 minutes',
          'Update project documentation',
          'Plan tomorrow\'s priorities',
          'Practice gratitude journaling'
        ]
      };
      setGeneratedTasks(sampleTasks);
      setIsGenerating(false);
    }, 2000);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Placeholder for voice recording functionality
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setMorningPlan(prev => prev + " [Voice note: Focus on deep work and important meetings today]");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header with Date */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl sm:text-4xl font-light text-slate-700">
              {formatDisplayDate(selectedDate)}
            </h1>
            <div className="w-9"></div>
          </div>
          <p className="text-slate-500">Plan your day mindfully</p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Morning Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
              <h2 className="text-xl font-medium text-slate-700">Morning</h2>
            </div>

            <div className="space-y-6">
              {/* Planning Prompt */}
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-slate-700 font-medium mb-2">Tell me about your plans for today</p>
                <p className="text-sm text-slate-500">Share your intentions, goals, or what's on your mind</p>
              </div>

              {/* Voice Recording Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleVoiceRecord}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>{isRecording ? 'Recording...' : 'Voice Note'}</span>
                </button>
              </div>

              {/* Text Input Alternative */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Or type your thoughts
                </label>
                <textarea
                  value={morningPlan}
                  onChange={(e) => setMorningPlan(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white/80 text-slate-700 placeholder-slate-400"
                  placeholder="What are your intentions for today? What would make today meaningful and productive?"
                />
              </div>

              {/* Generate Tasks Button */}
              <button
                onClick={handleGenerateTasks}
                disabled={!morningPlan.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Generating Tasks...</span>
                  </div>
                ) : (
                  'Generate My Tasks'
                )}
              </button>

              {/* Generated Tasks Display (1-3-5 Format) */}
              {generatedTasks && (
                <div className="space-y-4 p-4 bg-green-50 rounded-xl">
                  <h3 className="font-medium text-slate-700 text-center">Your Prioritized Tasks</h3>
                  
                  {/* Priority 1 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-700 flex items-center space-x-1">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Most Important</span>
                    </h4>
                    <div className="pl-7">
                      <p className="text-sm text-slate-700 p-2 bg-white rounded-lg">{generatedTasks.priority1}</p>
                    </div>
                  </div>

                  {/* Priority 3 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-700 flex items-center space-x-1">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Important Tasks</span>
                    </h4>
                    <div className="pl-7 space-y-1">
                      {generatedTasks.priority3.map((task, index) => (
                        <p key={index} className="text-sm text-slate-700 p-2 bg-white rounded-lg">{task}</p>
                      ))}
                    </div>
                  </div>

                  {/* Priority 5 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-purple-700 flex items-center space-x-1">
                      <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                      <span>Supporting Tasks</span>
                    </h4>
                    <div className="pl-7 space-y-1">
                      {generatedTasks.priority5.map((task, index) => (
                        <p key={index} className="text-sm text-slate-700 p-2 bg-white rounded-lg">{task}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Evening Section (Disabled) */}
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl shadow-sm border border-white/30 p-6 opacity-60">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full"></div>
              <h2 className="text-xl font-medium text-slate-700">Evening</h2>
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">Coming Later</span>
            </div>

            <div className="space-y-4 text-center py-12">
              <svg className="w-16 h-16 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-600">Evening Reflection</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Complete your morning planning first. Evening reflection will be available at the end of the day.
              </p>
            </div>
          </div>
        </div>

        {/* Save Entry Button */}
        <div className="flex justify-center">
          <button
            onClick={() => router.back()}
            className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
          >
            Save & Return to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading entry...</p>
        </div>
      </div>
    }>
      <EntryContent />
    </Suspense>
  );
}