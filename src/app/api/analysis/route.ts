import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from '@/lib/database';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Create admin client for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    const verifyClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { type, date } = await request.json();

    switch (type) {
      case 'daily_comparison':
        return handleDailyComparison(user.id, date, supabaseAdmin);
      case 'progress_tracking':
        return handleProgressTracking(user.id, supabaseAdmin);
      case 'mood_patterns':
        return handleMoodPatterns(user.id, supabaseAdmin);
      case 'encouraging_feedback':
        return handleEncouragingFeedback(user.id, date, supabaseAdmin);
      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleDailyComparison(userId: string, date: string, supabase: any) {
  try {
    const dailyEntry = await DatabaseService.getDailyEntry(userId, date);
    
    if (!dailyEntry) {
      return NextResponse.json({ error: 'No entry found for this date' }, { status: 404 });
    }

    // Extract planned tasks from morning plan
    const morningPlan = dailyEntry.morning_plan || '';
    const eveningReflection = dailyEntry.evening_reflection || '';
    const generatedTasks = dailyEntry.generated_tasks as any;
    const eveningAnalysis = dailyEntry.evening_analysis as any;

    // Get accomplishments from evening analysis
    const accomplishments = eveningAnalysis?.accomplishments || [];

    // Generate comparison using AI
    const comparisonPrompt = `
    Compare the morning plans vs evening accomplishments for today:

    Morning Plan: "${morningPlan}"
    Generated Tasks: ${JSON.stringify(generatedTasks, null, 2)}
    Evening Accomplishments: ${JSON.stringify(accomplishments, null, 2)}

    Please provide:
    1. Task completion percentage
    2. What was accomplished vs planned
    3. Unexpected achievements
    4. Areas for improvement
    5. Encouraging insights

    Format as JSON:
    {
      "completion_percentage": 75,
      "completed_tasks": ["task1", "task2"],
      "missed_tasks": ["task3"],
      "unexpected_achievements": ["surprise accomplishment"],
      "insights": "Encouraging insight about the day",
      "improvement_suggestions": ["suggestion1", "suggestion2"]
    }
    `;

    const response = await model.generateContent(comparisonPrompt);
    const aiResponse = response.response.text();
    
    let analysis;
    try {
      analysis = JSON.parse(aiResponse);
    } catch {
      analysis = {
        completion_percentage: 60,
        completed_tasks: accomplishments.slice(0, 3),
        missed_tasks: [],
        unexpected_achievements: [],
        insights: "You made progress today! Every step forward counts.",
        improvement_suggestions: ["Continue with your current approach", "Celebrate your wins"]
      };
    }

    // Update progress tracking
    await DatabaseService.updateProgress(userId, 'task_completion', analysis.completion_percentage, date, supabaseAdmin);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error in daily comparison:', error);
    return NextResponse.json({ error: 'Failed to generate comparison' }, { status: 500 });
  }
}

async function handleProgressTracking(userId: string, supabase: any) {
  try {
    const progressData = await DatabaseService.getProgressData(userId, 30);
    const dailyEntries = await DatabaseService.getDailyEntries(userId, 30);
    const moodEntries = await DatabaseService.getMoodEntries(userId, 30);

    // Calculate consistency score
    const consistencyScore = (dailyEntries.length / 30) * 100;
    
    // Calculate average mood score
    const avgMoodScore = moodEntries.length > 0 
      ? moodEntries.reduce((sum, mood) => {
          const moodValue = getMoodScore(mood.mood);
          return sum + moodValue;
        }, 0) / moodEntries.length
      : 50;

    // Calculate reflection quality (based on length and content)
    const avgReflectionQuality = dailyEntries.length > 0
      ? dailyEntries.reduce((sum, entry) => {
          const reflectionLength = (entry.evening_reflection || '').length;
          const quality = Math.min(100, (reflectionLength / 100) * 100); // 100 chars = 100%
          return sum + quality;
        }, 0) / dailyEntries.length
      : 0;

    // Update today's progress
    const today = new Date().toISOString().split('T')[0];
    await DatabaseService.updateProgress(userId, 'consistency', consistencyScore, today, supabaseAdmin);
    await DatabaseService.updateProgress(userId, 'mood_score', avgMoodScore, today, supabaseAdmin);
    await DatabaseService.updateProgress(userId, 'reflection_quality', avgReflectionQuality, today, supabaseAdmin);

    return NextResponse.json({
      progress: {
        consistency: consistencyScore,
        mood_score: avgMoodScore,
        reflection_quality: avgReflectionQuality,
        total_entries: dailyEntries.length,
        total_moods: moodEntries.length,
      },
      historical_data: progressData,
    });
  } catch (error) {
    console.error('Error in progress tracking:', error);
    return NextResponse.json({ error: 'Failed to calculate progress' }, { status: 500 });
  }
}

async function handleMoodPatterns(userId: string, supabase: any) {
  try {
    const moodEntries = await DatabaseService.getMoodEntries(userId, 30);
    
    if (moodEntries.length === 0) {
      return NextResponse.json({ patterns: null, insights: "Not enough mood data yet" });
    }

    // Group moods by type
    const moodCounts: { [key: string]: number } = {};
    moodEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    // Find most common mood
    const mostCommonMood = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Calculate mood trend (last 7 days vs previous 7 days)
    const recent7Days = moodEntries.slice(0, 7);
    const previous7Days = moodEntries.slice(7, 14);

    const recentAvg = recent7Days.length > 0 
      ? recent7Days.reduce((sum, mood) => sum + getMoodScore(mood.mood), 0) / recent7Days.length
      : 50;
    
    const previousAvg = previous7Days.length > 0
      ? previous7Days.reduce((sum, mood) => sum + getMoodScore(mood.mood), 0) / previous7Days.length
      : 50;

    const trend = recentAvg > previousAvg ? 'improving' : recentAvg < previousAvg ? 'declining' : 'stable';

    return NextResponse.json({
      patterns: {
        most_common_mood: mostCommonMood,
        mood_distribution: moodCounts,
        trend: trend,
        recent_average: recentAvg,
        previous_average: previousAvg,
      },
      insights: generateMoodInsights(mostCommonMood, trend, recentAvg),
    });
  } catch (error) {
    console.error('Error in mood patterns:', error);
    return NextResponse.json({ error: 'Failed to analyze mood patterns' }, { status: 500 });
  }
}

async function handleEncouragingFeedback(userId: string, date: string, supabase: any) {
  try {
    const userContext = await DatabaseService.getUserContext(userId, 7);
    const todayEntry = await DatabaseService.getDailyEntry(userId, date);

    const feedbackPrompt = `
    Based on this user's recent mental health journey, provide encouraging and supportive feedback:

    Recent entries: ${JSON.stringify(userContext?.dailyEntries?.slice(0, 3), null, 2)}
    Recent moods: ${JSON.stringify(userContext?.moodEntries?.slice(0, 5), null, 2)}
    Recent accomplishments: ${JSON.stringify(userContext?.accomplishments?.slice(0, 5), null, 2)}
    
    Today's entry: ${JSON.stringify(todayEntry, null, 2)}

    Provide encouraging feedback that:
    1. Acknowledges their progress
    2. Highlights positive patterns
    3. Offers gentle motivation
    4. Provides specific, actionable encouragement

    Keep it warm, personal, and under 200 words.
    `;

    const response = await model.generateContent(feedbackPrompt);
    const feedback = response.response.text() || 
      "You're doing great! Every day you show up for yourself is a victory. Keep going! 🌟";

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error generating encouraging feedback:', error);
    return NextResponse.json({ 
      feedback: "You're making progress every day! Your commitment to self-reflection shows real strength. Keep believing in yourself! 💪" 
    });
  }
}

function getMoodScore(mood: string): number {
  const moodScores: { [key: string]: number } = {
    'happy': 90,
    'content': 80,
    'satisfied': 75,
    'calm': 70,
    'neutral': 50,
    'tired': 40,
    'stressed': 30,
    'anxious': 25,
    'frustrated': 20,
    'sad': 15,
    'angry': 10,
  };
  return moodScores[mood.toLowerCase()] || 50;
}

function generateMoodInsights(mostCommonMood: string, trend: string, recentAverage: number): string {
  let insight = `Your most common mood lately has been "${mostCommonMood}". `;
  
  if (trend === 'improving') {
    insight += "Great news - your mood has been trending upward! ";
  } else if (trend === 'declining') {
    insight += "Your mood has dipped recently, but this is temporary. ";
  } else {
    insight += "Your mood has been stable. ";
  }

  if (recentAverage >= 70) {
    insight += "You're in a really positive space right now! 🌟";
  } else if (recentAverage >= 50) {
    insight += "You're maintaining a balanced emotional state. 💙";
  } else {
    insight += "Remember that difficult emotions are temporary. You're stronger than you know. 💪";
  }

  return insight;
}