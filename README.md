# AI Chat App - Personal Mental Health Companion

A Next.js-powered AI mental health companion that helps users track their daily experiences, achieve goals, analyze mood patterns, and engage in supportive conversations powered by Google Gemini AI.

## Features

### **Morning Planning & Task Generation**
- **Voice-to-Text Planning**: Record your morning intentions using speech recognition
- **AI Task Generation**: Automatically generate prioritized tasks (1-3-5 format) from your morning plans
- **Smart Task Parsing**: Extract meaningful goals from natural language planning
- **Date-based Planning**: Create and view plans for any date

### **Evening Reflection & Analysis**
- **Reflection Recording**: Voice or text-based evening reflections
- **AI-Powered Analysis**: Automatic extraction of accomplishments, mood, and lessons learned
- **Mood Detection**: AI analyzes emotional state from reflections with confidence scoring
- **Progress Tracking**: Visual task completion reviews and daily insights

### **Context-Aware AI Chat**
- **Personal Mental Health Companion**: AI assistant trained on mental health support
- **Context Integration**: Chat responses based on your journal history and mood patterns
- **Conversation Memory**: Maintains context across chat sessions
- **Supportive Guidance**: Provides personalized advice and encouragement

### **Advanced Analytics Dashboard**
- **Progress Tracking**: Consistency scores, mood trends, and reflection quality metrics
- **Mood Pattern Analysis**: 30-day mood distribution and trend analysis
- **Daily Comparisons**: Morning plans vs. evening accomplishments analysis
- **Encouraging Feedback**: Personalized motivational insights

### **Additional Features**
- **Quick Mood Logging**: One-tap mood selection on homepage
- **Speech Recognition**: Full voice support for all input fields
- **Responsive Design**: Beautiful gradients and modern UI across all devices
- **Secure Authentication**: Supabase-powered user authentication
- **Data Privacy**: All personal data secured with row-level security

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI Integration**: Google Gemini 1.5 Flash
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Voice Features**: Web Speech API
- **Deployment**: Vercel-ready

## 📱 How to Use

### **Daily Planning Flow**
1. **Morning**: Visit `/plan/entry` and record your daily intentions
2. **Task Generation**: Let AI generate prioritized tasks from your plans
3. **Evening**: Reflect on your day and analyze accomplishments
4. **Analysis**: Check `/analysis` for insights and progress tracking

### **AI Chat Features**
1. Visit `/chat` for mental health conversations
2. AI responds with context from your journal history
3. Get personalized advice based on your mood patterns
4. Receive encouragement and actionable guidance

### **Progress Tracking**
1. View consistency scores and mood trends on `/analysis`
2. Compare morning plans vs. evening accomplishments
3. Track reflection quality and engagement metrics
4. Receive encouraging feedback based on your progress

## API Endpoints

- `POST /api/chat` - Basic AI chat functionality
- `POST /api/chat/context` - Context-aware chat with user history
- `POST /api/analysis` - Daily analysis and insights generation

## AI Integration Details

### Google Gemini Integration
- **Model**: `gemini-1.5-flash` for fast, high-quality responses
- **Features**: Text generation, JSON parsing, context awareness
- **Cost**: Generous free tier available
- **Performance**: Faster response times than previous models

### AI Capabilities
- **Task Generation**: Convert natural language plans into structured tasks
- **Mood Analysis**: Detect emotional states from text with confidence scores
- **Pattern Recognition**: Identify trends in mood and behavior
- **Personalized Responses**: Contextualized advice based on user history

## Security & Privacy

- **Row-Level Security**: Database policies ensure users only access their own data
- **Authentication**: Secure Supabase Auth with JWT tokens
- **API Protection**: All endpoints require valid authentication
- **Data Encryption**: All data encrypted in transit and at rest

## Database Schema

```sql
-- Core user journal entries
daily_entries (id, user_id, date, morning_plan, evening_reflection, generated_tasks, evening_analysis)

-- Mood tracking
mood_entries (id, user_id, date, mood, confidence, description, source)

-- Generated and tracked tasks
tasks (id, user_id, daily_entry_id, title, completed, priority)

-- Extracted insights
accomplishments (id, user_id, daily_entry_id, accomplishment, category)
lessons_learned (id, user_id, daily_entry_id, lesson, category)

-- Progress metrics
progress (id, user_id, metric_type, value, date)
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
