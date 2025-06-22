'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { supabaseClient } from '@/lib/supabase';

interface AnalysisData {
  daily_comparison: any;
  progress: any;
  mood_patterns: any;
  encouraging_feedback: string;
}

export default function AnalysisPage() {
  const { user, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadAnalysis();
    }
  }, [isLoading, user, selectedDate]);

  const loadAnalysis = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get auth token
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      };

      const [comparison, progress, moodPatterns, feedback] = await Promise.all([
        fetch('/api/analysis', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ type: 'daily_comparison', date: selectedDate }),
        }).then(res => res.json()),
        
        fetch('/api/analysis', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ type: 'progress_tracking' }),
        }).then(res => res.json()),
        
        fetch('/api/analysis', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ type: 'mood_patterns' }),
        }).then(res => res.json()),
        
        fetch('/api/analysis', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ type: 'encouraging_feedback', date: selectedDate }),
        }).then(res => res.json()),
      ]);

      setAnalysisData({
        daily_comparison: comparison,
        progress: progress,
        mood_patterns: moodPatterns,
        encouraging_feedback: feedback.feedback,
      });
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Please sign in to view your analysis</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl sm:text-4xl font-light text-slate-700 mb-2">Your Journey Analysis</h1>
          <p className="text-slate-500">Insights into your mental health and progress</p>
        </div>

        {/* Date Selector */}
        <div className="flex justify-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : analysisData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Comparison */}
            {analysisData.daily_comparison?.analysis && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
                <h2 className="text-xl font-medium text-slate-700 mb-4">Morning vs Evening</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Task Completion</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
                          style={{ width: `${analysisData.daily_comparison.analysis.completion_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analysisData.daily_comparison.analysis.completion_percentage}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-green-700 mb-2">✅ Completed Tasks</h3>
                    <ul className="space-y-1">
                      {analysisData.daily_comparison.analysis.completed_tasks?.map((task: string, index: number) => (
                        <li key={index} className="text-sm text-slate-600">• {task}</li>
                      ))}
                    </ul>
                  </div>

                  {analysisData.daily_comparison.analysis.unexpected_achievements?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-purple-700 mb-2">🌟 Unexpected Achievements</h3>
                      <ul className="space-y-1">
                        {analysisData.daily_comparison.analysis.unexpected_achievements.map((achievement: string, index: number) => (
                          <li key={index} className="text-sm text-slate-600">• {achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Tracking */}
            {analysisData.progress && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
                <h2 className="text-xl font-medium text-slate-700 mb-4">Progress Overview</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600">Consistency</span>
                      <span className="text-sm font-medium">{Math.round(analysisData.progress.consistency)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-400 to-green-400 rounded-full"
                        style={{ width: `${analysisData.progress.consistency}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600">Mood Score</span>
                      <span className="text-sm font-medium">{Math.round(analysisData.progress.mood_score)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-yellow-400 to-green-400 rounded-full"
                        style={{ width: `${analysisData.progress.mood_score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600">Reflection Quality</span>
                      <span className="text-sm font-medium">{Math.round(analysisData.progress.reflection_quality)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                        style={{ width: `${analysisData.progress.reflection_quality}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-medium text-blue-600">{analysisData.progress.total_entries}</div>
                      <div className="text-xs text-slate-500">Total Entries</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-medium text-green-600">{analysisData.progress.total_moods}</div>
                      <div className="text-xs text-slate-500">Mood Records</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mood Patterns */}
            {analysisData.mood_patterns?.patterns && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
                <h2 className="text-xl font-medium text-slate-700 mb-4">Mood Patterns</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Most Common</span>
                    <span className="text-lg capitalize font-medium text-blue-600">
                      {analysisData.mood_patterns.patterns.most_common_mood}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Trend</span>
                    <span className={`text-sm font-medium ${
                      analysisData.mood_patterns.patterns.trend === 'improving' ? 'text-green-600' :
                      analysisData.mood_patterns.patterns.trend === 'declining' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {analysisData.mood_patterns.patterns.trend === 'improving' ? '📈 Improving' :
                       analysisData.mood_patterns.patterns.trend === 'declining' ? '📉 Declining' :
                       '➡️ Stable'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {analysisData.mood_patterns.insights}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Encouraging Feedback */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-200/50 p-6">
              <h2 className="text-xl font-medium text-slate-700 mb-4">🌟 Encouraging Words</h2>
              <p className="text-slate-700 leading-relaxed">
                {analysisData.encouraging_feedback}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No analysis data available for the selected date.</p>
          </div>
        )}
      </div>
    </div>
  );
}