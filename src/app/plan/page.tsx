'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEntry: boolean;
  fullDate: string;
}

interface DayEntry {
  date: string;
  morningPlan?: string;
  eveningReflection?: string;
  tasks?: {
    priority1: string;
    priority3: string[];
    priority5: string[];
  };
}

export default function PlanPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Sample entries data
  const [entries, setEntries] = useState<DayEntry[]>([
    {
      date: '2024-01-15',
      morningPlan: 'Focus on project presentation and gym session',
      tasks: {
        priority1: 'Complete project presentation',
        priority3: ['Gym workout', 'Review quarterly goals', 'Call family'],
        priority5: ['Organize desk', 'Read 20 pages', 'Meditation', 'Plan tomorrow', 'Grocery shopping']
      }
    },
    {
      date: '2024-01-20',
      morningPlan: 'Deep work on coding project',
      eveningReflection: 'Great productive day, learned new patterns'
    }
  ]);

  // Sample goals and tasks
  const [goals] = useState([
    { id: 1, title: 'Daily Meditation', progress: 80, target: 30 },
    { id: 2, title: 'Read 20 pages', progress: 65, target: 100 },
    { id: 3, title: 'Exercise 3x/week', progress: 40, target: 12 },
  ]);

  const [tasks] = useState([
    { id: 1, text: 'Morning journaling', completed: true },
    { id: 2, text: 'Plan tomorrow\'s priorities', completed: false },
    { id: 3, text: 'Gratitude practice', completed: false },
    { id: 4, text: 'Review weekly goals', completed: true },
  ]);

  // Helper functions
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const hasEntryForDate = (dateStr: string): boolean => {
    return entries.some(entry => entry.date === dateStr);
  };

  const getTodayString = (): string => {
    return formatDate(new Date());
  };

  const handleDateClick = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      const clickedDate = formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day.date));
      setSelectedDate(clickedDate);
      
      // Navigate to entry page for the selected date
      router.push(`/plan/entry?date=${clickedDate}`);
    }
  };

  const handleAddTodayEntry = () => {
    const today = getTodayString();
    router.push(`/plan/entry?date=${today}`);
  };

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = formatDate(currentDate);
      
      days.push({
        date: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        hasEntry: hasEntryForDate(dateStr),
        fullDate: dateStr,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-blue-50 to-green-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl sm:text-4xl font-light text-slate-700 mb-2">Your Plan</h1>
          <p className="text-slate-500">Track your goals and plan your journey</p>
        </div>

        {/* Add Today's Entry Button */}
        <div className="flex justify-center">
          <button
            onClick={handleAddTodayEntry}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Today's Entry</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-slate-700">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-slate-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={`relative p-3 text-center text-sm rounded-lg transition-all duration-200 min-h-[2.5rem] ${
                      day.isToday
                        ? 'bg-blue-500 text-white font-medium shadow-md'
                        : day.isCurrentMonth
                        ? selectedDate === day.fullDate
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'text-slate-700 hover:bg-slate-100 hover:scale-105'
                        : 'text-slate-400 cursor-default'
                    } ${day.hasEntry ? 'ring-2 ring-green-300' : ''}`}
                    disabled={!day.isCurrentMonth}
                  >
                    {day.date}
                    {day.hasEntry && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Calendar Legend */}
              <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Has Entry</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-blue-300 rounded"></div>
                  <span>Selected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Goals and Tasks Sidebar */}
          <div className="space-y-6">
            {/* Goals Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
              <h3 className="text-lg font-medium text-slate-700 mb-4">Current Goals</h3>
              <div className="space-y-4">
                {goals.map(goal => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">{goal.title}</span>
                      <span className="text-xs text-slate-500">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
              <h3 className="text-lg font-medium text-slate-700 mb-4">Today's Tasks</h3>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      task.completed 
                        ? 'bg-green-100 border-green-400' 
                        : 'border-slate-300'
                    }`}>
                      {task.completed && (
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      task.completed ? 'text-slate-500 line-through' : 'text-slate-700'
                    }`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
              <h3 className="text-lg font-medium text-slate-700 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm text-slate-700">Add New Goal</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm text-slate-700">Plan Tomorrow</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}