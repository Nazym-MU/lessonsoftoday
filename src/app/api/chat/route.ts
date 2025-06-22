import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    return NextResponse.json({ 
      response: response.content[0].type === 'text' ? response.content[0].text : 'No response' 
    });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}