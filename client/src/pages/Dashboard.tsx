import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Trophy,
  Flame,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

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

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/todos/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

  // Formatting data for Charts
  const categoryData = Object.entries(stats.categoryStats).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const priorityData = [
    { name: 'Low', count: stats.priorityStats.low, fill: '#3b82f6' },
    { name: 'Medium', count: stats.priorityStats.medium, fill: '#10b981' },
    { name: 'High', count: stats.priorityStats.high, fill: '#f59e0b' },
    { name: 'Urgent', count: stats.priorityStats.urgent, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Welcome & Streaks Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Rate Card */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden border border-border/80">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace productivity</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Your Completion Rate</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Keep it up! You completed <span className="font-bold text-foreground">{stats.completed}</span> tasks out of <span className="font-bold text-foreground">{stats.total}</span> active ones.
            </p>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center z-10">
            {/* Circular progress SVG */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                className="stroke-muted"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                className="stroke-primary transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - stats.completionRate / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold tracking-tight">{stats.completionRate}%</span>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Finished</p>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="glass rounded-3xl p-6 flex items-center justify-between border border-border/80 relative overflow-hidden">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Daily Streak</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Flame className="w-7 h-7 text-orange-500 fill-orange-500/10 animate-bounce" />
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">{stats.streaks.current}</p>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>
              </div>
              <div className="w-px bg-border/60"></div>
              <div className="flex items-center gap-2">
                <Trophy className="w-7 h-7 text-yellow-500 fill-yellow-500/10" />
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">{stats.streaks.longest}</p>
                  <p className="text-xs text-muted-foreground">Longest Streak</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <Zap className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Grid of Key Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => navigate('/tasks')}
          className="glass rounded-3xl p-6 border border-border/80 hover:border-primary/30 hover:scale-[1.02] cursor-pointer transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Tasks</span>
            <div className="p-2 bg-primary/10 rounded-xl"><CheckCircle className="w-5 h-5 text-primary" /></div>
          </div>
          <h4 className="text-3xl font-extrabold tracking-tight">{stats.total}</h4>
          <p className="text-xs text-muted-foreground mt-2">Active + Completed</p>
        </div>

        <div 
          onClick={() => navigate('/tasks?status=pending')}
          className="glass rounded-3xl p-6 border border-border/80 hover:border-amber-500/30 hover:scale-[1.02] cursor-pointer transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending</span>
            <div className="p-2 bg-amber-500/10 rounded-xl"><Clock className="w-5 h-5 text-amber-500" /></div>
          </div>
          <h4 className="text-3xl font-extrabold tracking-tight">{stats.pending}</h4>
          <p className="text-xs text-muted-foreground mt-2">Needs action</p>
        </div>

        <div 
          onClick={() => navigate('/tasks?deadline=overdue')}
          className="glass rounded-3xl p-6 border border-border/80 hover:border-red-500/30 hover:scale-[1.02] cursor-pointer transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Overdue</span>
            <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          </div>
          <h4 className="text-3xl font-extrabold tracking-tight text-red-500">{stats.overdue}</h4>
          <p className="text-xs text-muted-foreground mt-2">Pass deadline</p>
        </div>

        <div 
          onClick={() => navigate('/calendar')}
          className="glass rounded-3xl p-6 border border-border/80 hover:border-indigo-500/30 hover:scale-[1.02] cursor-pointer transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today's Due</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl"><Calendar className="w-5 h-5 text-indigo-500" /></div>
          </div>
          <h4 className="text-3xl font-extrabold tracking-tight">{stats.todaysTasks}</h4>
          <p className="text-xs text-muted-foreground mt-2">Due before midnight</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Productivity Area Chart */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 border border-border/80 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Productivity Trends
              </h3>
              <p className="text-xs text-muted-foreground">Completed tasks over the last 7 days</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyProductivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                  }}
                  itemStyle={{ color: 'black' }}
                />
                <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProductivity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority distribution Bar Chart */}
        <div className="glass rounded-3xl p-6 border border-border/80 flex flex-col space-y-4">
          <div>
            <h3 className="text-lg font-bold">Priority Breakdown</h3>
            <p className="text-xs text-muted-foreground">Distribution of active tasks</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {stats.total === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks to chart</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      borderRadius: '16px',
                    }}
                    itemStyle={{ color: 'black' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={36}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="glass rounded-3xl p-6 border border-border/80 flex flex-col space-y-4">
          <div>
            <h3 className="text-lg font-bold">Categories Breakdown</h3>
            <p className="text-xs text-muted-foreground">Tasks grouped by custom category</p>
          </div>
          <div className="h-60 w-full relative flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks in categories</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-around w-full gap-4">
                <div className="h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs space-y-1.5 max-h-40 overflow-y-auto pr-2">
                  {categoryData.slice(0, 5).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="font-semibold">{entry.name}</span>
                      <span className="text-muted-foreground">({entry.value})</span>
                    </div>
                  ))}
                  {categoryData.length > 5 && (
                    <p className="text-[10px] text-muted-foreground pl-4">+{categoryData.length - 5} more...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avg Completion time and efficiency metrics */}
        <div className="glass rounded-3xl p-6 border border-border/80 flex flex-col justify-between lg:col-span-2">
          <div>
            <h3 className="text-lg font-bold">Efficiency Insights</h3>
            <p className="text-xs text-muted-foreground">Analysis of your task-handling efficiency</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border/60 space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Completion Speed</span>
              <h5 className="text-2xl font-extrabold tracking-tight flex items-baseline gap-1">
                {stats.avgCompletionTime}
                <span className="text-xs text-muted-foreground font-normal">hours</span>
              </h5>
              <p className="text-[10px] text-muted-foreground mt-1">Average time elapsed between creation and completion</p>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border/60 space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Streaks & consistency</span>
              <h5 className="text-2xl font-extrabold tracking-tight text-primary flex items-baseline gap-1">
                {stats.streaks.current > 0 ? 'Consistent' : 'Idle'}
              </h5>
              <p className="text-[10px] text-muted-foreground mt-1">Streaks grow by completing at least one task daily</p>
            </div>
          </div>

          <div className="text-xs p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">Tip:</span> Breaking tasks down into smaller steps, attaching clear deadlines, and prioritizing urgent jobs boosts your completion speeds!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
