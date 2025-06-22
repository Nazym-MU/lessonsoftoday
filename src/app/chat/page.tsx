'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { DatabaseService } from '@/lib/database';
import { supabaseClient } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  messageType: 'user' | 'assistant';
  timestamp: string;
}

export default function ChatPage() {
  const { user, session, isLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (!isLoading && user) {
      loadChatSessions();
    }
  }, [isLoading, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSessions = async () => {
    if (!user) return;
    
    try {
      const sessions = await DatabaseService.getChatSessions(user.id);
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const startNewChat = async () => {
    if (!user) return;

    try {
      const sessionId = await DatabaseService.createChatSession(user.id);
      if (sessionId) {
        setCurrentSessionId(sessionId);
        setChatHistory([]);
        loadChatSessions();
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      const messages = await DatabaseService.getChatMessages(sessionId);
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        response: msg.response,
        messageType: msg.message_type,
        timestamp: msg.created_at,
      }));
      setChatHistory(formattedMessages);
      setCurrentSessionId(sessionId);
      setShowSidebar(false);
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setLoading(true);
    const userMessage = message;
    setMessage('');

    try {
      // Create new session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await DatabaseService.createChatSession(user.id);
        if (sessionId) {
          setCurrentSessionId(sessionId);
          loadChatSessions();
        }
      }

      // Add user message to chat
      const userChatMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        message: userMessage,
        response: '',
        messageType: 'user',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, userChatMessage]);

      // Get auth token for API call
      const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
      if (!currentSession) {
        throw new Error('No authentication session');
      }

      // Call AI with context
      const res = await fetch('/api/chat/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ 
          message: userMessage,
          sessionId: sessionId,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response to chat
      const aiChatMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        message: userMessage,
        response: data.response,
        messageType: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, aiChatMessage]);

      // Save to database
      if (sessionId) {
        await DatabaseService.createChatMessage(
          sessionId,
          user.id,
          userMessage,
          data.response,
          'assistant'
        );
      }

    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: userMessage,
        response: 'Sorry, I encountered an error. Please try again.',
        messageType: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errorMessage]);
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
            <p className="text-slate-600">Please sign in to access the chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50">
      <Navigation />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'block' : 'hidden'} lg:block w-80 bg-white/70 backdrop-blur-sm border-r border-white/50 p-4 overflow-y-auto`}>
          <div className="space-y-4">
            <button
              onClick={startNewChat}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            >
              + New Chat
            </button>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-700">Recent Chats</h3>
              {chatSessions.length > 0 ? (
                chatSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadChatSession(session.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      currentSessionId === session.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white/50 hover:bg-white/80 text-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      {session.title || 'Untitled Chat'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">No chats yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm border-b border-white/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-xl font-medium text-slate-700">Mental Health Companion</h1>
              </div>
              <div className="text-sm text-slate-500">
                Context-aware AI powered by your journal entries
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">Start a conversation</h3>
                <p className="text-slate-500 mb-4">
                  I'm here to support your mental health journey. I'm aware of your journal entries and can provide personalized guidance.
                </p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>💭 Ask about your mood patterns</p>
                  <p>🎯 Discuss your goals and progress</p>
                  <p>🌱 Get suggestions for personal growth</p>
                  <p>🤝 Receive emotional support and guidance</p>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div key={msg.id} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    index % 2 === 0
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white/70 text-slate-700 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">
                      {index % 2 === 0 ? msg.message : msg.response}
                    </p>
                    <div className={`text-xs mt-2 ${
                      index % 2 === 0 ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/70 text-slate-700 p-4 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white/70 backdrop-blur-sm border-t border-white/50 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white/80 text-slate-700 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}