import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ListTodo, 
  Loader2 
} from 'lucide-react';

interface Todo {
  _id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'pending' | 'in progress' | 'completed' | 'archived';
  deadline: string | null;
}

export const Calendar: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);

  const fetchCalendarTodos = async () => {
    try {
      // Fetch all todos that have a deadline
      const res = await API.get('/todos');
      const filtered = res.data.filter((t: Todo) => t.deadline && t.status !== 'archived');
      setTodos(filtered);
    } catch (err) {
      console.error('Error fetching calendar tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarTodos();
  }, []);

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, todo: Todo) => {
    setDraggedTodo(todo);
    e.dataTransfer.setData('text/plain', todo._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedTodo) return;

    // Preserve the original time if it exists, just update the date
    const updatedDate = new Date(date);
    if (draggedTodo.deadline) {
      const originalTime = new Date(draggedTodo.deadline);
      updatedDate.setHours(originalTime.getHours());
      updatedDate.setMinutes(originalTime.getMinutes());
    } else {
      updatedDate.setHours(12, 0, 0, 0); // Default to noon
    }

    // Optimistic UI update
    const originalDeadline = draggedTodo.deadline;
    const updatedTodos = todos.map(t => 
      t._id === draggedTodo._id ? { ...t, deadline: updatedDate.toISOString() } : t
    );
    setTodos(updatedTodos);

    try {
      await API.put(`/todos/${draggedTodo._id}`, { deadline: updatedDate.toISOString() });
    } catch (err) {
      console.error('Failed to update task deadline on drop', err);
      // Revert if error
      fetchCalendarTodos();
    } finally {
      setDraggedTodo(null);
    }
  };

  // Navigate dates
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'low': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'medium': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      case 'high': return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
      case 'urgent': return 'bg-red-500/20 text-red-700 dark:text-red-300 animate-pulse';
      default: return 'bg-secondary';
    }
  };

  // Month Generation Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 6 is Saturday

    // Number of days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Previous month days to pad start
    const days: { date: Date; currentMonth: boolean }[] = [];
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i),
        currentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true,
      });
    }

    // Next month days to pad end to multiple of 7
    const remaining = 42 - days.length; // standard 6-row calendar
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false,
      });
    }

    return days;
  };

  // Week Generation Helpers
  const getDaysInWeek = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0-6
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek); // Go back to Sunday

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Filters tasks matching a date (ignoring time)
  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => {
      if (!todo.deadline) return false;
      const d = new Date(todo.deadline);
      return d.getDate() === date.getDate() &&
             d.getMonth() === date.getMonth() &&
             d.getFullYear() === date.getFullYear();
    });
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-xs text-muted-foreground">Drag tasks between dates to change deadlines.</p>
          </div>
        </div>

        {/* View Selection & Toggles */}
        <div className="flex items-center gap-2">
          {/* Month / Week selection */}
          <div className="p-1 rounded-xl bg-secondary/60 border border-border/40 flex">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'week' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Week
            </button>
          </div>

          {/* Left / Right arrows */}
          <div className="flex items-center border border-border/60 rounded-xl overflow-hidden bg-card">
            <button
              onClick={handlePrev}
              className="p-2.5 hover:bg-secondary transition-colors border-r border-border/60"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3.5 py-2 hover:bg-secondary text-xs font-bold border-r border-border/60"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 glass border border-border/85 rounded-3xl p-6 overflow-x-auto min-h-[550px] flex flex-col justify-between">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-extrabold uppercase text-muted-foreground tracking-widest border-b border-border/40 pb-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Days cells */}
        {view === 'month' ? (
          <div className="grid grid-cols-7 gap-2 flex-1 grid-rows-6">
            {getDaysInMonth(currentDate).map(({ date, currentMonth }, idx) => {
              const dateTodos = getTodosForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, date)}
                  className={`
                    border rounded-2xl p-2.5 flex flex-col justify-between min-h-[85px] transition-colors relative group
                    ${currentMonth ? 'bg-card border-border/60' : 'bg-secondary/20 border-transparent text-muted-foreground/50'}
                    ${isToday ? 'ring-2 ring-primary/60 border-primary/20' : ''}
                    hover:border-primary/40
                  `}
                >
                  {/* Day Number */}
                  <span className={`
                    text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-lg self-end
                    ${isToday ? 'bg-primary text-primary-foreground font-extrabold shadow' : 'text-foreground/70'}
                  `}>
                    {date.getDate()}
                  </span>

                  {/* Tasks List */}
                  <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 max-h-[75px]">
                    {dateTodos.map((todo) => (
                      <div
                        key={todo._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, todo)}
                        className={`
                          px-2 py-1 rounded-lg text-[10px] font-bold border truncate cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform
                          ${getPriorityColor(todo.priority)}
                          ${todo.status === 'completed' ? 'line-through opacity-50' : ''}
                        `}
                        title={`${todo.title} - ${todo.priority} priority`}
                      >
                        {todo.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-4 flex-1">
            {getDaysInWeek(currentDate).map((date, idx) => {
              const dateTodos = getTodosForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, date)}
                  className={`
                    border rounded-3xl p-4 flex flex-col justify-between min-h-[400px] bg-card border-border/60 transition-colors relative
                    ${isToday ? 'ring-2 ring-primary/60 border-primary/20 bg-primary/[0.01]' : ''}
                    hover:border-primary/40
                  `}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={`
                      text-sm font-extrabold inline-flex items-center justify-center w-7 h-7 rounded-xl
                      ${isToday ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-foreground/80'}
                    `}>
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Tasks List (Weekly layout scroll area) */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px]">
                    {dateTodos.length === 0 ? (
                      <div className="h-full flex items-center justify-center border border-dashed border-border/30 rounded-2xl py-12">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">No Tasks</span>
                      </div>
                    ) : (
                      dateTodos.map((todo) => (
                        <div
                          key={todo._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, todo)}
                          className={`
                            p-2.5 rounded-xl text-xs font-bold border cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform space-y-1
                            ${getPriorityColor(todo.priority)}
                            ${todo.status === 'completed' ? 'line-through opacity-50' : ''}
                          `}
                        >
                          <p className="truncate leading-tight">{todo.title}</p>
                          <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-border/20">
                            {todo.category}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
