'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { DatabaseService } from '@/lib/database';

interface Task {
  priority1: string;
  priority3: string[];
  priority5: string[];
}

interface EveningAnalysis {
  accomplishments: string[];
  mood: {
    detected: string;
    confidence: number;
    description: string;
  };
  lessonsLearned: string[];
  reflection: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function EntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const { user, isLoading } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [morningPlan, setMorningPlan] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [generatedTasks, setGeneratedTasks] = useState<Task | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [supportsWebSpeech, setSupportsWebSpeech] = useState<boolean>(false);
  
  // Evening specific states
  const [eveningTranscript, setEveningTranscript] = useState<string>('');
  const [isEveningRecording, setIsEveningRecording] = useState<boolean>(false);
  const [isEveningTranscribing, setIsEveningTranscribing] = useState<boolean>(false);
  const [eveningReflection, setEveningReflection] = useState<string>('');
  const [eveningAnalysis, setEveningAnalysis] = useState<EveningAnalysis | null>(null);
  const [isAnalyzingEvening, setIsAnalyzingEvening] = useState<boolean>(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const eveningRecognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam);
    } else {
      // Default to today if no date provided
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [dateParam]);

  useEffect(() => {
    if (!isLoading && user && selectedDate) {
      loadExistingEntry();
    }
  }, [isLoading, user, selectedDate]);

  const loadExistingEntry = async () => {
    if (!user || !selectedDate) return;
    
    try {
      const entry = await DatabaseService.getDailyEntry(user.id, selectedDate);
      if (entry) {
        setMorningPlan(entry.morning_plan || '');
        setTranscript(entry.morning_transcript || '');
        setEveningReflection(entry.evening_reflection || '');
        setEveningTranscript(entry.evening_transcript || '');
        
        if (entry.generated_tasks) {
          setGeneratedTasks(entry.generated_tasks as unknown as Task);
        }
        
        if (entry.evening_analysis) {
          setEveningAnalysis(entry.evening_analysis as unknown as EveningAnalysis);
        }
      }
    } catch (error) {
      console.error('Error loading existing entry:', error);
    }
  };

  useEffect(() => {
    // Check for Web Speech API support
    const checkWebSpeechSupport = () => {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSupportsWebSpeech(!!SpeechRecognition);
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsTranscribing(true);
        };
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
            setMorningPlan(prev => prev + finalTranscript);
          }
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsTranscribing(false);
          
          // Handle specific error types
          let errorMessage = '';
          switch (event.error) {
            case 'network':
              errorMessage = 'Network error. Please check your internet connection and try again.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking again.';
              break;
            case 'audio-capture':
              errorMessage = 'Audio capture failed. Please check your microphone and try again.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service not available. Please try again later.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
          }
          
          // Show error to user
          setTimeout(() => {
            alert(errorMessage);
          }, 100);
        };
        
        recognition.onend = () => {
          setIsTranscribing(false);
          if (isRecording) {
            recognition.start();
          }
        };
        
        recognitionRef.current = recognition;

        // Setup evening recognition
        const eveningRecognition = new SpeechRecognition();
        eveningRecognition.continuous = true;
        eveningRecognition.interimResults = true;
        eveningRecognition.lang = 'en-US';
        
        eveningRecognition.onstart = () => {
          setIsEveningTranscribing(true);
        };
        
        eveningRecognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setEveningTranscript(prev => prev + finalTranscript);
            setEveningReflection(prev => prev + finalTranscript);
          }
        };
        
        eveningRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Evening speech recognition error:', event.error);
          setIsEveningRecording(false);
          setIsEveningTranscribing(false);
          
          // Handle specific error types
          let errorMessage = '';
          switch (event.error) {
            case 'network':
              errorMessage = 'Network error. Please check your internet connection and try again.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking again.';
              break;
            case 'audio-capture':
              errorMessage = 'Audio capture failed. Please check your microphone and try again.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service not available. Please try again later.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
          }
          
          setTimeout(() => {
            alert(errorMessage);
          }, 100);
        };
        
        eveningRecognition.onend = () => {
          setIsEveningTranscribing(false);
          if (isEveningRecording) {
            eveningRecognition.start();
          }
        };
        
        eveningRecognitionRef.current = eveningRecognition;
      }
    };
    
    checkWebSpeechSupport();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (eveningRecognitionRef.current) {
        eveningRecognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, isEveningRecording]);

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

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && (isRecording || isEveningRecording)) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const handleGenerateTasks = async () => {
    if (!morningPlan.trim()) return;

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on this morning plan: "${morningPlan}", please generate prioritized tasks in this EXACT format. Do not add any other text or explanation:

1 BIG GOAL: [Extract or create ONE most important task from the morning plan]

3 MEDIUM TASKS:
- [Important task 1 based on the plan]
- [Important task 2 based on the plan] 
- [Important task 3 based on the plan]

5 SMALL TASKS:
- [Supporting task 1 based on the plan]
- [Supporting task 2 based on the plan]
- [Supporting task 3 based on the plan]
- [Supporting task 4 based on the plan]
- [Supporting task 5 based on the plan]

Make sure to extract specific goals and tasks mentioned in: "${morningPlan}"`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data?.response || data?.message || data?.content || '';
        
        if (!aiResponse) {
          throw new Error('Empty response from AI');
        }
        
        const parsedTasks = parseAIResponse(aiResponse);
        setGeneratedTasks(parsedTasks);
        
        // Save to database
        await saveDailyEntry({
          morning_plan: morningPlan,
          morning_transcript: transcript,
          generated_tasks: parsedTasks,
        });
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to generate tasks: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      // Fallback to sample tasks
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
    } finally {
      setIsGenerating(false);
    }
  };

  const parseAIResponse = (response: string | undefined): Task => {
    // Handle undefined or null response
    if (!response || typeof response !== 'string') {
      return {
        priority1: 'Focus on your most important task',
        priority3: ['Complete important work', 'Take breaks', 'Connect with others'],
        priority5: ['Organize workspace', 'Read', 'Plan ahead', 'Self-care', 'Reflect']
      };
    }

    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
    let priority1 = '';
    const priority3: string[] = [];
    const priority5: string[] = [];
    
    let currentSection = '';
    
    for (const line of lines) {
      if (line.includes('1 BIG GOAL') || line.includes('BIG GOAL') || line.includes('MOST IMPORTANT')) {
        currentSection = 'big';
        // Look for content after the colon
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const extracted = line.substring(colonIndex + 1).trim();
          // Remove brackets and extract content
          const cleaned = extracted.replace(/^\[|\]$/g, '').trim();
          if (cleaned && cleaned.length > 3 && !cleaned.toLowerCase().includes('extract') && !cleaned.toLowerCase().includes('create')) {
            priority1 = cleaned;
          }
        }
      } else if (line.includes('3 MEDIUM TASKS') || line.includes('MEDIUM TASKS') || line.includes('IMPORTANT TASKS')) {
        currentSection = 'medium';
      } else if (line.includes('5 SMALL TASKS') || line.includes('SMALL TASKS') || line.includes('SUPPORTING TASKS')) {
        currentSection = 'small';
      } else if (line.startsWith('-') || line.startsWith('•')) {
        let task = line.replace(/^[-•]\s*/, '').trim();
        // Remove brackets and placeholder text
        task = task.replace(/^\[|\]$/g, '').trim();
        
        // Skip placeholder text
        if (task && 
            !task.toLowerCase().includes('important task') && 
            !task.toLowerCase().includes('supporting task') &&
            !task.toLowerCase().includes('based on') &&
            task.length > 5) {
          
          if (currentSection === 'medium' && priority3.length < 3) {
            priority3.push(task);
          } else if (currentSection === 'small' && priority5.length < 5) {
            priority5.push(task);
          }
        }
      }
    }
    
    // If no main goal was extracted, try to create one from the morning plan
    if (!priority1 && morningPlan) {
      const planWords = morningPlan.toLowerCase();
      if (planWords.includes('presentation')) {
        priority1 = 'Complete and deliver presentation';
      } else if (planWords.includes('meeting')) {
        priority1 = 'Attend and contribute to important meetings';
      } else if (planWords.includes('project')) {
        priority1 = 'Make significant progress on main project';
      } else if (planWords.includes('work')) {
        priority1 = 'Focus on most important work tasks';
      } else if (planWords.includes('exercise') || planWords.includes('gym')) {
        priority1 = 'Complete workout and exercise routine';
      } else {
        // Extract first meaningful sentence or phrase
        const sentences = morningPlan.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 10);
        priority1 = sentences[0] || 'Focus on your most important task';
      }
    }
    
    return {
      priority1: priority1 || 'Focus on your most important task',
      priority3: priority3.length > 0 ? priority3 : ['Complete important work', 'Take breaks', 'Connect with others'],
      priority5: priority5.length > 0 ? priority5 : ['Organize workspace', 'Read', 'Plan ahead', 'Self-care', 'Reflect']
    };
  };

  const handleVoiceRecord = async () => {
    if (!supportsWebSpeech) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for voice features.');
      return;
    }

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioLevel(0);
    } else {
      try {
        // Check for microphone permissions first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
        
        // Start recording
        setIsRecording(true);
        setTranscript('');
        
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setIsRecording(false);
            alert('Failed to start speech recognition. Please try again.');
            return;
          }
        }
        
        // Start audio visualization
        await startAudioVisualization();
      } catch (error) {
        console.error('Microphone access error:', error);
        setIsRecording(false);
        
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            alert('Microphone access denied. Please allow microphone permissions in your browser settings and try again.');
          } else if (error.name === 'NotFoundError') {
            alert('No microphone found. Please connect a microphone and try again.');
          } else {
            alert('Error accessing microphone. Please check your microphone settings and try again.');
          }
        } else {
          alert('Error starting voice recording. Please try again.');
        }
      }
    }
  };

  const handleEveningVoiceRecord = async () => {
    if (!supportsWebSpeech) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for voice features.');
      return;
    }

    if (isEveningRecording) {
      // Stop recording
      setIsEveningRecording(false);
      if (eveningRecognitionRef.current) {
        eveningRecognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioLevel(0);
    } else {
      try {
        // Check for microphone permissions first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
        
        // Start recording
        setIsEveningRecording(true);
        setEveningTranscript('');
        
        if (eveningRecognitionRef.current) {
          try {
            eveningRecognitionRef.current.start();
          } catch (error) {
            console.error('Failed to start evening speech recognition:', error);
            setIsEveningRecording(false);
            alert('Failed to start speech recognition. Please try again.');
            return;
          }
        }
        
        // Start audio visualization
        await startAudioVisualization();
      } catch (error) {
        console.error('Evening microphone access error:', error);
        setIsEveningRecording(false);
        
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            alert('Microphone access denied. Please allow microphone permissions in your browser settings and try again.');
          } else if (error.name === 'NotFoundError') {
            alert('No microphone found. Please connect a microphone and try again.');
          } else {
            alert('Error accessing microphone. Please check your microphone settings and try again.');
          }
        } else {
          alert('Error starting voice recording. Please try again.');
        }
      }
    }
  };

  const saveDailyEntry = async (partialData: any) => {
    if (!user || !selectedDate) return;
    
    try {
      const entryData = {
        user_id: user.id,
        date: selectedDate,
        ...partialData,
      };
      
      await DatabaseService.createOrUpdateDailyEntry(entryData);
    } catch (error) {
      console.error('Error saving daily entry:', error);
    }
  };

  const analyzeEveningReflection = async () => {
    if (!eveningReflection.trim()) return;

    setIsAnalyzingEvening(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Please analyze this evening reflection and extract the following information in this exact JSON format:

{
  "accomplishments": ["list of 3-5 key accomplishments mentioned"],
  "mood": {
    "detected": "primary emotion (happy/satisfied/frustrated/tired/motivated/etc)",
    "confidence": 0.8,
    "description": "brief description of the emotional state"
  },
  "lessonsLearned": ["list of 2-4 key lessons or insights mentioned"],
  "reflection": "a brief summary of the overall day"
}

Evening reflection: "${eveningReflection}"

Please ensure the response is valid JSON only, no additional text.`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data?.response || data?.message || data?.content || '';
        
        if (!aiResponse) {
          throw new Error('Empty response from AI');
        }
        
        try {
          // Try to parse the JSON response
          const analysis = JSON.parse(aiResponse);
          setEveningAnalysis(analysis);
          
          // Save to database
          await saveDailyEntry({
            evening_reflection: eveningReflection,
            evening_transcript: eveningTranscript,
            evening_analysis: analysis,
          });
          
          // Save mood entry
          if (user && analysis.mood) {
            await DatabaseService.createMoodEntry({
              user_id: user.id,
              date: selectedDate,
              mood: analysis.mood.detected,
              confidence: analysis.mood.confidence,
              description: analysis.mood.description,
              source: 'ai_detected',
            });
          }
          
          // Save accomplishments and lessons
          if (user && analysis.accomplishments && analysis.lessonsLearned) {
            const entry = await DatabaseService.getDailyEntry(user.id, selectedDate);
            if (entry) {
              await DatabaseService.createAccomplishments(user.id, entry.id, analysis.accomplishments);
              await DatabaseService.createLessonsLearned(user.id, entry.id, analysis.lessonsLearned);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
          // Fallback analysis if JSON parsing fails
          const fallbackAnalysis: EveningAnalysis = {
            accomplishments: [
              'Completed daily reflection',
              'Shared thoughts about the day',
              'Took time for self-reflection'
            ],
            mood: {
              detected: 'reflective',
              confidence: 0.7,
              description: 'Taking time to think about the day'
            },
            lessonsLearned: [
              'Reflection is important for growth',
              'Every day brings new experiences'
            ],
            reflection: 'A day of learning and reflection'
          };
          setEveningAnalysis(fallbackAnalysis);
        }
      } else {
        throw new Error('Failed to analyze evening reflection');
      }
    } catch (error) {
      console.error('Error analyzing evening reflection:', error);
      // Fallback analysis
      const fallbackAnalysis: EveningAnalysis = {
        accomplishments: [
          'Completed daily tasks',
          'Engaged in reflection',
          'Documented the day'
        ],
        mood: {
          detected: 'content',
          confidence: 0.6,
          description: 'A balanced day overall'
        },
        lessonsLearned: [
          'Each day offers opportunities to learn',
          'Reflection helps process experiences'
        ],
        reflection: 'A productive day with valuable insights'
      };
      setEveningAnalysis(fallbackAnalysis);
    } finally {
      setIsAnalyzingEvening(false);
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
                {!supportsWebSpeech && (
                  <p className="text-xs text-amber-600 mt-2">
                    💡 For voice features, please use Chrome or Edge browser
                  </p>
                )}
              </div>

              {/* Voice Recording Section */}
              <div className="space-y-4">
                {/* Recording Button with Audio Visualization */}
                <div className="flex flex-col items-center space-y-4">
                  <button
                    onClick={handleVoiceRecord}
                    disabled={!supportsWebSpeech}
                    className={`relative flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : supportsWebSpeech 
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {/* Audio Level Indicator */}
                    {isRecording && (
                      <div 
                        className="absolute inset-0 bg-red-400 rounded-xl opacity-30 transition-all duration-100"
                        style={{ 
                          transform: `scale(${1 + audioLevel * 0.3})`,
                          opacity: 0.3 + audioLevel * 0.4
                        }}
                      />
                    )}
                    
                    <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="relative z-10">
                      {isRecording ? 'Stop Recording' : 
                       supportsWebSpeech ? 'Start Voice Note' : 'Voice Not Supported'}
                    </span>
                  </button>

                  {/* Audio Visualization Bars */}
                  {isRecording && (
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-500 rounded-full transition-all duration-100"
                          style={{
                            height: `${8 + Math.random() * audioLevel * 20}px`,
                            opacity: 0.7 + audioLevel * 0.3
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Recording Status */}
                  {isRecording && (
                    <div className="flex items-center space-x-2 text-sm text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span>
                        {isTranscribing ? 'Listening...' : 'Starting...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Live Transcription Display */}
                {(transcript || isRecording) && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-700">Live Transcription</span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {transcript || (isRecording ? 'Start speaking...' : '')}
                      {isTranscribing && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />}
                    </p>
                  </div>
                )}
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

          {/* Evening Section */}
          <div className={`backdrop-blur-sm rounded-2xl shadow-sm border p-6 transition-all duration-300 ${
            generatedTasks 
              ? 'bg-white/70 border-white/50 opacity-100' 
              : 'bg-white/30 border-white/30 opacity-60'
          }`}>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full"></div>
              <h2 className="text-xl font-medium text-slate-700">Evening</h2>
              {!generatedTasks && (
                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">Complete Morning First</span>
              )}
            </div>

            {generatedTasks ? (
              <div className="space-y-6">
                {/* Evening Reflection Prompt */}
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-slate-700 font-medium mb-2">How did your day go?</p>
                  <p className="text-sm text-slate-500">Reflect on your accomplishments and learnings</p>
                </div>

                {/* Evening Voice Recording Section */}
                <div className="space-y-4">
                  {/* Recording Button with Audio Visualization */}
                  <div className="flex flex-col items-center space-y-4">
                    <button
                      onClick={handleEveningVoiceRecord}
                      disabled={!supportsWebSpeech}
                      className={`relative flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isEveningRecording
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : supportsWebSpeech 
                          ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {/* Audio Level Indicator */}
                      {isEveningRecording && (
                        <div 
                          className="absolute inset-0 bg-purple-400 rounded-xl opacity-30 transition-all duration-100"
                          style={{ 
                            transform: `scale(${1 + audioLevel * 0.3})`,
                            opacity: 0.3 + audioLevel * 0.4
                          }}
                        />
                      )}
                      
                      <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="relative z-10">
                        {isEveningRecording ? 'Stop Recording' : 
                         supportsWebSpeech ? 'Record Reflection' : 'Voice Not Supported'}
                      </span>
                    </button>

                    {/* Audio Visualization Bars */}
                    {isEveningRecording && (
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-purple-500 rounded-full transition-all duration-100"
                            style={{
                              height: `${8 + Math.random() * audioLevel * 20}px`,
                              opacity: 0.7 + audioLevel * 0.3
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Recording Status */}
                    {isEveningRecording && (
                      <div className="flex items-center space-x-2 text-sm text-purple-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        <span>
                          {isEveningTranscribing ? 'Listening...' : 'Starting...'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Live Transcription Display */}
                  {(eveningTranscript || isEveningRecording) && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                        </svg>
                        <span className="text-sm font-medium text-purple-700">Evening Transcription</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {eveningTranscript || (isEveningRecording ? 'Start speaking about your day...' : '')}
                        {isEveningTranscribing && <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1" />}
                      </p>
                    </div>
                  )}
                </div>

                {/* Text Input Alternative */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Or type your evening reflection
                  </label>
                  <textarea
                    value={eveningReflection}
                    onChange={(e) => setEveningReflection(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent bg-white/80 text-slate-700 placeholder-slate-400"
                    placeholder="What went well today? What did you learn? What would you do differently tomorrow?"
                  />
                </div>

                {/* Analyze Reflection Button */}
                <button
                  onClick={analyzeEveningReflection}
                  disabled={!eveningReflection.trim() || isAnalyzingEvening}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzingEvening ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing Reflection...</span>
                    </div>
                  ) : (
                    'Analyze My Day'
                  )}
                </button>

                {/* Evening Analysis Results */}
                {eveningAnalysis && (
                  <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <h3 className="font-medium text-slate-700 text-center">Day Analysis</h3>
                    
                    {/* Accomplishments */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-green-700 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Accomplishments</span>
                      </h4>
                      <div className="pl-5 space-y-1">
                        {eveningAnalysis.accomplishments.map((accomplishment, index) => (
                          <p key={index} className="text-sm text-slate-700 p-2 bg-white rounded-lg">{accomplishment}</p>
                        ))}
                      </div>
                    </div>

                    {/* Mood */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-purple-700 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Detected Mood</span>
                      </h4>
                      <div className="pl-5">
                        <div className="p-3 bg-white rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize text-slate-700">{eveningAnalysis.mood.detected}</span>
                            <span className="text-xs text-slate-500">{Math.round(eveningAnalysis.mood.confidence * 100)}% confidence</span>
                          </div>
                          <p className="text-sm text-slate-600">{eveningAnalysis.mood.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Lessons Learned */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-blue-700 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>Lessons Learned</span>
                      </h4>
                      <div className="pl-5 space-y-1">
                        {eveningAnalysis.lessonsLearned.map((lesson, index) => (
                          <p key={index} className="text-sm text-slate-700 p-2 bg-white rounded-lg">{lesson}</p>
                        ))}
                      </div>
                    </div>

                    {/* Daily Summary */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Day Summary</span>
                      </h4>
                      <div className="pl-5">
                        <p className="text-sm text-slate-700 p-3 bg-white rounded-lg italic">{eveningAnalysis.reflection}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Review Checklist */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-700">Review Your Tasks</h3>
                  
                  {/* Big Goal Review */}
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-green-700">Most Important Goal</p>
                        <p className="text-sm text-slate-700">{generatedTasks.priority1}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medium Tasks Review */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-700">Important Tasks</p>
                    {generatedTasks.priority3.map((task, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-blue-50 rounded">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <p className="text-sm text-slate-700">{task}</p>
                      </div>
                    ))}
                  </div>

                  {/* Small Tasks Review */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-purple-700">Supporting Tasks</p>
                    {generatedTasks.priority5.map((task, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-purple-50 rounded">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <p className="text-sm text-slate-700">{task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-12">
                <svg className="w-16 h-16 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-600">Evening Reflection</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Complete your morning planning first. Evening reflection will be available after you generate your tasks.
                </p>
              </div>
            )}
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