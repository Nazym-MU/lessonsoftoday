export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          morning_plan: string | null;
          morning_transcript: string | null;
          evening_reflection: string | null;
          evening_transcript: string | null;
          generated_tasks: Json | null;
          evening_analysis: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          morning_plan?: string | null;
          morning_transcript?: string | null;
          evening_reflection?: string | null;
          evening_transcript?: string | null;
          generated_tasks?: Json | null;
          evening_analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          morning_plan?: string | null;
          morning_transcript?: string | null;
          evening_reflection?: string | null;
          evening_transcript?: string | null;
          generated_tasks?: Json | null;
          evening_analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mood: string;
          confidence: number;
          description: string | null;
          source: 'manual' | 'ai_detected';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          mood: string;
          confidence: number;
          description?: string | null;
          source: 'manual' | 'ai_detected';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          mood?: string;
          confidence?: number;
          description?: string | null;
          source?: 'manual' | 'ai_detected';
          created_at?: string;
        };
      };
      lessons_learned: {
        Row: {
          id: string;
          user_id: string;
          daily_entry_id: string;
          lesson: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_entry_id: string;
          lesson: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_entry_id?: string;
          lesson?: string;
          category?: string | null;
          created_at?: string;
        };
      };
      accomplishments: {
        Row: {
          id: string;
          user_id: string;
          daily_entry_id: string;
          accomplishment: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_entry_id: string;
          accomplishment: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_entry_id?: string;
          accomplishment?: string;
          category?: string | null;
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          context_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          context_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          context_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          message: string;
          response: string;
          message_type: 'user' | 'assistant';
          context_used: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          message: string;
          response: string;
          message_type: 'user' | 'assistant';
          context_used?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          message?: string;
          response?: string;
          message_type?: 'user' | 'assistant';
          context_used?: Json | null;
          created_at?: string;
        };
      };
      progress_tracking: {
        Row: {
          id: string;
          user_id: string;
          metric_type: 'mood_score' | 'task_completion' | 'reflection_quality' | 'consistency';
          value: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          metric_type: 'mood_score' | 'task_completion' | 'reflection_quality' | 'consistency';
          value: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          metric_type?: 'mood_score' | 'task_completion' | 'reflection_quality' | 'consistency';
          value?: number;
          date?: string;
          created_at?: string;
        };
      };
      inspirational_quotes: {
        Row: {
          id: string;
          quote: string;
          author: string;
          category: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote: string;
          author: string;
          category?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote?: string;
          author?: string;
          category?: string | null;
          source?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];