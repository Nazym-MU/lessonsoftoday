import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the user with anon client
    const verifyClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { message, context, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
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

    if (context) {
      // Add recent daily entries context
      if (context.dailyEntries && context.dailyEntries.length > 0) {
        contextPrompt += `\nRecent Journal Entries:\n`;
        context.dailyEntries.slice(0, 5).forEach((entry: any, index: number) => {
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
      if (context.moodEntries && context.moodEntries.length > 0) {
        contextPrompt += `\nRecent Mood Patterns:\n`;
        context.moodEntries.slice(0, 7).forEach((mood: any) => {
          contextPrompt += `${mood.date}: ${mood.mood} (${Math.round(mood.confidence * 100)}% confidence) - ${mood.description || ''}\n`;
        });
      }

      // Add recent accomplishments
      if (context.accomplishments && context.accomplishments.length > 0) {
        contextPrompt += `\nRecent Accomplishments:\n`;
        context.accomplishments.slice(0, 5).forEach((acc: any) => {
          contextPrompt += `- ${acc.accomplishment}\n`;
        });
      }

      // Add lessons learned
      if (context.lessons && context.lessons.length > 0) {
        contextPrompt += `\nRecent Lessons Learned:\n`;
        context.lessons.slice(0, 5).forEach((lesson: any) => {
          contextPrompt += `- ${lesson.lesson}\n`;
        });
      }
    }

    contextPrompt += `\nUser's current message: ${message}\n\nPlease respond with empathy and personalized insights based on their journal history. Keep responses conversational, supportive, and under 300 words.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: contextPrompt,
        },
      ],
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : 'No response';

    return NextResponse.json({ 
      response: aiResponse,
      contextUsed: !!context
    });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}