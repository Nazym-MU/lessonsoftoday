import { supabase } from './supabase';
import { Database } from './database.types';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type DailyEntry = Tables['daily_entries']['Row'];
type DailyEntryInsert = Tables['daily_entries']['Insert'];
type MoodEntry = Tables['mood_entries']['Row'];
type MoodEntryInsert = Tables['mood_entries']['Insert'];
type Profile = Tables['profiles']['Row'];
type ProfileInsert = Tables['profiles']['Insert'];
type ProfileUpdate = Tables['profiles']['Update'];

export class DatabaseService {
  // Helper method to get client (allows overriding for server-side)
  private static getClient(client?: SupabaseClient<Database>): SupabaseClient<Database> {
    return client || supabase;
  }
  // Profile Management
  static async createOrUpdateProfile(profileData: ProfileInsert): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      return null;
    }
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  // Daily Entries
  static async createOrUpdateDailyEntry(entry: DailyEntryInsert): Promise<DailyEntry | null> {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .upsert(
          { ...entry, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/updating daily entry:', error);
      return null;
    }
  }

  static async getDailyEntry(userId: string, date: string, client?: any): Promise<DailyEntry | null> {
    try {
      const supabaseClient = client || supabase;
      const { data, error } = await supabaseClient
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error fetching daily entry:', error);
      return null;
    }
  }

  static async getDailyEntries(userId: string, limit: number = 30, client?: any): Promise<DailyEntry[]> {
    try {
      const supabaseClient = client || supabase;
      const { data, error } = await supabaseClient
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily entries:', error);
      return [];
    }
  }

  // Mood Tracking
  static async createMoodEntry(moodEntry: MoodEntryInsert): Promise<MoodEntry | null> {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert(moodEntry)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating mood entry:', error);
      return null;
    }
  }

  static async getMoodEntries(userId: string, days: number = 30, client?: any): Promise<MoodEntry[]> {
    try {
      const supabaseClient = client || supabase;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabaseClient
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      return [];
    }
  }

  // Accomplishments
  static async createAccomplishments(
    userId: string,
    dailyEntryId: string,
    accomplishments: string[]
  ): Promise<boolean> {
    try {
      const accomplishmentRows = accomplishments.map(accomplishment => ({
        id: uuidv4(),
        user_id: userId,
        daily_entry_id: dailyEntryId,
        accomplishment,
      }));

      const { error } = await supabase
        .from('accomplishments')
        .insert(accomplishmentRows);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating accomplishments:', error);
      return false;
    }
  }

  static async getAccomplishments(userId: string, days: number = 30, client?: any) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const supabaseClient = client || supabase;
      const { data, error } = await supabaseClient
        .from('accomplishments')
        .select(`
          *,
          daily_entries!inner(date)
        `)
        .eq('user_id', userId)
        .gte('daily_entries.date', startDate.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accomplishments:', error);
      return [];
    }
  }

  // Lessons Learned
  static async createLessonsLearned(
    userId: string,
    dailyEntryId: string,
    lessons: string[]
  ): Promise<boolean> {
    try {
      const lessonRows = lessons.map(lesson => ({
        id: uuidv4(),
        user_id: userId,
        daily_entry_id: dailyEntryId,
        lesson,
      }));

      const { error } = await supabase
        .from('lessons_learned')
        .insert(lessonRows);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating lessons learned:', error);
      return false;
    }
  }

  static async getLessonsLearned(userId: string, days: number = 30, client?: any) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const supabaseClient = client || supabase;
      const { data, error } = await supabaseClient
        .from('lessons_learned')
        .select(`
          *,
          daily_entries!inner(date)
        `)
        .eq('user_id', userId)
        .gte('daily_entries.date', startDate.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lessons learned:', error);
      return [];
    }
  }

  // Chat Sessions
  static async createChatSession(userId: string, title?: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title: title || `Chat ${new Date().toLocaleDateString()}`,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  }

  static async getChatSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      return [];
    }
  }

  static async createChatMessage(
    sessionId: string,
    userId: string,
    message: string,
    response: string,
    messageType: 'user' | 'assistant',
    contextUsed?: any
  ) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          message,
          response,
          message_type: messageType,
          context_used: contextUsed,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat message:', error);
      return null;
    }
  }

  static async getChatMessages(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  }

  // Progress Tracking
  static async updateProgress(
    userId: string,
    metricType: 'mood_score' | 'task_completion' | 'reflection_quality' | 'consistency',
    value: number,
    date: string,
    client?: SupabaseClient<Database>
  ): Promise<boolean> {
    try {
      const supabaseClient = this.getClient(client);
      const { error } = await supabaseClient
        .from('progress_tracking')
        .upsert(
          {
            user_id: userId,
            metric_type: metricType,
            value,
            date,
          },
          { onConflict: 'user_id,metric_type,date' }
        );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating progress:', error);
      return false;
    }
  }

  static async getProgressData(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching progress data:', error);
      return [];
    }
  }

  // Random Quotes
  static async getRandomQuote() {
    try {
      const { data, error } = await supabase
        .from('inspirational_quotes')
        .select('*')
        .limit(50); // Get more rows to have better randomness

      if (error) throw error;
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching random quote:', error);
      return null;
    }
  }

  // User Context for AI
  static async getUserContext(userId: string, days: number = 7, client?: any) {
    try {
      const [dailyEntries, moodEntries, accomplishments, lessons] = await Promise.all([
        this.getDailyEntries(userId, days, client),
        this.getMoodEntries(userId, days, client),
        this.getAccomplishments(userId, days, client),
        this.getLessonsLearned(userId, days, client),
      ]);

      return {
        dailyEntries,
        moodEntries,
        accomplishments,
        lessons,
      };
    } catch (error) {
      console.error('Error fetching user context:', error);
      return null;
    }
  }
}