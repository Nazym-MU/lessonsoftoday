import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { message, context, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let userContext = context;
    if (!userContext) {
      try {
        const [dailyEntries, moodEntries, accomplishments, lessons] = await Promise.all([
          supabaseAdmin.from('daily_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
          supabaseAdmin.from('mood_entries').select('*').eq('user_id', user.id).gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).order('date', { ascending: false }),
          supabaseAdmin.from('accomplishments').select('*, daily_entries!inner(date)').eq('user_id', user.id).gte('daily_entries.date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).order('created_at', { ascending: false }),
          supabaseAdmin.from('lessons_learned').select('*, daily_entries!inner(date)').eq('user_id', user.id).gte('daily_entries.date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).order('created_at', { ascending: false })
        ]);

        userContext = {
          dailyEntries: dailyEntries.data || [],
          moodEntries: moodEntries.data || [],
          accomplishments: accomplishments.data || [],
          lessons: lessons.data || [],
        };
      } catch (error) {
        userContext = null;
      }
    }

    // Build context-aware prompt
    let contextPrompt = `You are a compassionate AI mental health companion. You have access to the user's journal entries, mood patterns, and personal growth journey. Always respond with empathy, understanding, and therapeutic insights.

Key Guidelines:
- Be supportive and non-judgmental
- Draw insights from their journal patterns
- Provide practical mental health advice
- Encourage positive mental health practices
- Reference their specific experiences when relevant
- Maintain appropriate boundaries (you're a companion, not a replacement for professional therapy)

`;

    if (userContext) {
      // Add recent daily entries context
      if (userContext.dailyEntries && userContext.dailyEntries.length > 0) {
        contextPrompt += `\nRecent Journal Entries:\n`;
        userContext.dailyEntries.slice(0, 5).forEach((entry: any, index: number) => {
          contextPrompt += `${entry.date}: `;
          if (entry.morning_plan) {
            contextPrompt += `Morning plan: ${entry.morning_plan.substring(0, 150)}... `;
          }
          if (entry.evening_reflection) {
            contextPrompt += `Evening reflection: ${entry.evening_reflection.substring(0, 150)}...`;
          }
          contextPrompt += `\n`;
        });
      }

      // Add mood patterns
      if (userContext.moodEntries && userContext.moodEntries.length > 0) {
        contextPrompt += `\nRecent Mood Patterns:\n`;
        userContext.moodEntries.slice(0, 7).forEach((mood: any) => {
          contextPrompt += `${mood.date}: ${mood.mood} (${Math.round(mood.confidence * 100)}% confidence) - ${mood.description || ''}\n`;
        });
      }

      // Add recent accomplishments
      if (userContext.accomplishments && userContext.accomplishments.length > 0) {
        contextPrompt += `\nRecent Accomplishments:\n`;
        userContext.accomplishments.slice(0, 5).forEach((acc: any) => {
          contextPrompt += `- ${acc.accomplishment}\n`;
        });
      }

      // Add lessons learned
      if (userContext.lessons && userContext.lessons.length > 0) {
        contextPrompt += `\nRecent Lessons Learned:\n`;
        userContext.lessons.slice(0, 5).forEach((lesson: any) => {
          contextPrompt += `- ${lesson.lesson}\n`;
        });
      }
    }

    contextPrompt += `\nUser's current message: ${message}\n\nPlease respond with empathy and personalized insights based on their journal history. Keep responses conversational, supportive, and under 300 words.`;

    const response = await model.generateContent(contextPrompt);
    const aiResponse = response.response.text() || 'No response';

    return NextResponse.json({ 
      response: aiResponse,
      contextUsed: !!userContext
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}