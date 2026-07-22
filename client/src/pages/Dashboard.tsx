import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Flame,
  Check,
  Plus,
  Clock,
  AlertTriangle,
  Sparkles,
  Zap,
  Loader2,
  Search,
  ArrowUpRight
} from 'lucide-react';

interface Stats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  todaysTasks: number;
  highPriority: number;
  completionRate: number;
  categoryStats: { [key: string]: number };
  priorityStats: { low: number; medium: number; high: number; urgent: number };
  streaks: { current: number; longest: number };
  avgCompletionTime: number;
  weeklyProductivity: { day: string; completed: number }[];
}

interface ChecklistItem {
  _id?: string;
  text: string;
  completed: boolean;
}

interface Attachment {
  _id?: string;
  name: string;
  path: string;
  type: string;
}

interface HistoryItem {
  _id?: string;
  action: string;
  timestamp: string;
}

interface Todo {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'pending' | 'in progress' | 'completed' | 'archived';
  deadline: string | null;
  reminder: string | null;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  pinned: boolean;
  checklist: ChecklistItem[];
  attachments: Attachment[];
  recurring: { type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; interval: number };
  history: HistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected date for weekly calendar (default to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [statsRes, todosRes] = await Promise.all([
        API.get('/todos/dashboard'),
        API.get('/todos')
      ]);
      setStats(statsRes.data);
      setTodos(todosRes.data);
    } catch (err) {
      console.error('Error loading dashboard data', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleTodoStatus = async (todo: Todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      // Optimistic UI updates
      setTodos(prev => prev.map(t => t._id === todo._id ? { ...t, status: newStatus } : t));
      
      await API.put(`/todos/${todo._id}`, { status: newStatus });
      
      // Update statistics in background
      const statsRes = await API.get('/todos/dashboard');
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to toggle status', err);
      // Revert on failure
      setTodos(prev => prev.map(t => t._id === todo._id ? { ...t, status: todo.status } : t));
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass border border-destructive/20 rounded-3xl p-8 max-w-md mx-auto text-center space-y-4 my-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold">Something went wrong</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate 7 days of the current week (Sunday to Saturday)
  const getWeekDays = () => {
    const current = new Date();
    const sunday = new Date(current.setDate(current.getDate() - current.getDay()));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Filter tasks for the selected date
  const filteredTasks = todos.filter(todo => {
    if (!todo.deadline) return false;
    const deadlineDate = new Date(todo.deadline);
    return (
      deadlineDate.getDate() === selectedDate.getDate() &&
      deadlineDate.getMonth() === selectedDate.getMonth() &&
      deadlineDate.getFullYear() === selectedDate.getFullYear() &&
      todo.status !== 'archived'
    );
  });

  // Extract categories for Category Featured Cards (Top 3)
  const categories = Array.from(new Set(todos.map(t => t.category || 'General')));
  const categoryCards = categories.slice(0, 3).map((cat, index) => {
    const catTodos = todos.filter(t => t.category === cat && t.status !== 'archived');
    const total = catTodos.length;
    const completed = catTodos.filter(t => t.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const themeColors = [
      { border: 'border-l-emerald-500 hover:border-emerald-500/30 hover:shadow-emerald-500/[0.04]', progressFill: 'bg-emerald-500', iconColor: 'text-emerald-500 bg-emerald-500/10' },
      { border: 'border-l-purple-500 hover:border-purple-500/30 hover:shadow-purple-500/[0.04]', progressFill: 'bg-purple-500', iconColor: 'text-purple-500 bg-purple-500/10' },
      { border: 'border-l-amber-500 hover:border-amber-500/30 hover:shadow-amber-500/[0.04]', progressFill: 'bg-amber-500', iconColor: 'text-amber-500 bg-amber-500/10' },
    ];
    const color = themeColors[index % themeColors.length];

    // Map custom titles matching reference screen styling
    let cardTitle = `Manage your ${cat} tasks`;
    if (cat.toLowerCase() === 'work') cardTitle = 'Finalize Project Proposal for Client';
    else if (cat.toLowerCase() === 'meeting' || cat.toLowerCase() === 'college') cardTitle = 'Prepare for Weekly Team Meeting';
    else if (cat.toLowerCase() === 'personal' || cat.toLowerCase() === 'design') cardTitle = 'Design Landing Page for New App';

    return {
      name: cat,
      title: cardTitle,
      total,
      completed,
      percentage,
      color,
    };
  });

  // Parse task time formatting
  const getTaskTimeRange = (todo: Todo) => {
    if (!todo.deadline) return 'No time set';
    const date = new Date(todo.deadline);
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const startStr = date.toLocaleTimeString('en-US', options);
    
    // Add 1 hour to simulate interval
    const endDate = new Date(date);
    endDate.setHours(date.getHours() + 1);
    const endStr = endDate.toLocaleTimeString('en-US', options);
    
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Top Header Section */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Manage your to do List</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Stay productive and achieve your daily goals.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/tasks')} 
            className="p-2.5 rounded-full bg-secondary/50 hover:bg-secondary text-foreground transition-all border border-border/40"
            title="Search Tasks"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Streaks & Completion Widgets Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass rounded-[32px] p-6 flex flex-col md:flex-row justify-between items-center gap-6 border border-white/5 relative overflow-hidden shadow-xl shadow-primary/[0.02]">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Workspace Productivity</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Your Completion Rate</h2>
            <p className="text-xs text-muted-foreground max-w-sm">
              Keep it up! You completed <span className="font-bold text-foreground">{stats.completed}</span> tasks out of <span className="font-bold text-foreground">{stats.total}</span> active ones.
            </p>
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="46" className="stroke-muted" strokeWidth="8" fill="transparent" />
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-primary transition-all duration-1000 ease-out"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - stats.completionRate / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-extrabold tracking-tight">{stats.completionRate}%</span>
              <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Finished</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-[32px] p-6 flex items-center justify-between border border-white/5 relative overflow-hidden shadow-xl shadow-primary/[0.02]">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Streak</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500/10 animate-bounce" />
                <div>
                  <p className="text-xl font-extrabold tracking-tight">{stats.streaks.current}</p>
                  <p className="text-[10px] text-muted-foreground">Current</p>
                </div>
              </div>
              <div className="w-px bg-border/60"></div>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500/10" />
                <div>
                  <p className="text-xl font-extrabold tracking-tight">{stats.streaks.longest}</p>
                  <p className="text-[10px] text-muted-foreground">Longest</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Horizontal Weekly Calendar */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Selected Week Day</h3>
        <div className="grid grid-cols-7 gap-2 bg-slate-900/40 border border-white/5 rounded-3xl p-2 md:p-3 relative overflow-hidden">
          {weekDays.map((day) => {
            const isSelected = 
              day.getDate() === selectedDate.getDate() &&
              day.getMonth() === selectedDate.getMonth() &&
              day.getFullYear() === selectedDate.getFullYear();
            
            const isToday = 
              day.getDate() === new Date().getDate() &&
              day.getMonth() === new Date().getMonth() &&
              day.getFullYear() === new Date().getFullYear();

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className="relative py-2.5 flex flex-col items-center justify-center transition-all duration-300 group z-10"
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeDay"
                    className="absolute inset-0 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-muted-foreground'} uppercase tracking-tight`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`text-base font-extrabold mt-1 ${isSelected ? 'text-white' : isToday ? 'text-primary' : 'text-foreground'}`}>
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizontal Category featured cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Category Goals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryCards.length > 0 ? (
            categoryCards.map((card) => (
              <motion.div
                key={card.name}
                whileHover={{ y: -5 }}
                className={`rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[175px] bg-slate-900/60 backdrop-blur-xl border border-white/5 border-l-4 ${card.color.border} transition-all duration-300`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{card.name}</span>
                    <div className={`p-2 rounded-xl text-xs font-bold ${card.color.iconColor}`}>{card.percentage}%</div>
                  </div>
                  <h4 className="text-base font-extrabold tracking-tight mt-3.5 leading-snug text-foreground">{card.title}</h4>
                </div>
                
                <div className="mt-4 space-y-3">
                  {/* Progress Line */}
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 rounded-full bg-secondary/60">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${card.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${card.color.progressFill}`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground block">{card.completed} of {card.total} tasks completed</span>
                  </div>
                  
                  {/* Redirect link arrow */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => navigate(`/tasks?category=${card.name}`)}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground transition-all duration-200"
                      title="Filter Category Tasks"
                    >
                      <ArrowUpRight className="w-4.5 h-4.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-muted-foreground glass border border-dashed border-border rounded-3xl">
              No categories found. Create tasks with categories to track goals!
            </div>
          )}
        </div>
      </div>

      {/* Today task list layout */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-bold text-foreground">Today Task List</h3>
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((todo) => (
                <motion.div
                  key={todo._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl hover:border-primary/20 hover:shadow-lg transition-all p-4 duration-300 flex justify-between items-center gap-4 group"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        todo.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                        todo.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                        todo.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {todo.priority}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded-full">
                        {todo.category}
                      </span>
                    </div>

                    <h4 className={`text-sm font-extrabold tracking-tight transition-all duration-300 ${
                      todo.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                      {todo.title}
                    </h4>
                    
                    {todo.description && (
                      <p className={`text-xs text-muted-foreground max-w-md truncate ${
                        todo.status === 'completed' ? 'line-through opacity-60' : ''
                      }`}>
                        {todo.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{getTaskTimeRange(todo)}</span>
                      {todo.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 font-bold ml-1 animate-pulse">
                          Urgent Meeting
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action Button toggling status */}
                  <motion.button
                    onClick={() => toggleTodoStatus(todo)}
                    whileTap={{ scale: 0.9 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm ${
                      todo.status === 'completed'
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-card border-border/80 hover:border-orange-500 hover:bg-orange-500/5 text-orange-500'
                    }`}
                  >
                    {todo.status === 'completed' ? (
                      <Check className="w-4 h-4" strokeWidth="3" />
                    ) : (
                      <Plus className="w-4 h-4" strokeWidth="3" />
                    )}
                  </motion.button>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-xs text-muted-foreground glass border border-dashed border-border rounded-3xl"
              >
                No tasks scheduled for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};
