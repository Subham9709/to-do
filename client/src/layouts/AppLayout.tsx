import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  ListTodo,
  KanbanSquare,
  Calendar as CalendarIcon,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Laptop,
  CheckSquare,
  User as UserIcon,
  Bell
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification("TaskSync Notifications Enabled", {
            body: "You will now receive desktop alerts for task deadlines and reminders!",
            icon: "/favicon.svg"
          });
        }
      });
    }
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Kanban Board', path: '/kanban', icon: KanbanSquare },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-x-hidden">
      {/* Background glowing bubbles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/5 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Mobile Top Bar */}
      <div className="md:hidden glass border-b border-border flex justify-between items-center px-6 py-4 z-40 relative">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-7 h-7 text-primary" />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            TaskSync
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop and Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 glass border-r border-border flex flex-col p-6
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Logo */}
        <div className="hidden md:flex items-center gap-3 mb-10 mt-2 px-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <CheckSquare className="w-8 h-8 text-primary" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            TaskSync
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2 mt-4 md:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 font-medium group
                  ${active 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer User Profiles & Controls */}
        <div className="border-t border-border/60 pt-6 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="max-w-[120px]">
                <h4 className="font-semibold text-sm truncate">{user?.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                title="Change theme"
              >
                {theme === 'light' && <Sun className="w-5 h-5 text-yellow-500" />}
                {theme === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
                {theme === 'system' && <Laptop className="w-5 h-5 text-muted-foreground" />}
              </button>
              
              {themeMenuOpen && (
                <div className="absolute right-0 bottom-12 w-36 glass rounded-2xl border border-border p-2 shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => { setTheme('light'); setThemeMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-secondary text-left w-full"
                  >
                    <Sun className="w-4 h-4 text-yellow-500" /> Light
                  </button>
                  <button
                    onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-secondary text-left w-full"
                  >
                    <Moon className="w-4 h-4 text-indigo-400" /> Dark
                  </button>
                  <button
                    onClick={() => { setTheme('system'); setThemeMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-secondary text-left w-full"
                  >
                    <Laptop className="w-4 h-4 text-muted-foreground" /> System
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl border border-dashed border-border hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive transition-all duration-300 font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        {/* Header - Desktop */}
        <header className="hidden md:flex justify-between items-center px-10 py-6 border-b border-border/40 glass sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {navItems.find(item => isActive(item.path))?.name || 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.name}! Let's make today productive.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 text-foreground transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass border border-border rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                    <span className="font-semibold text-sm">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-xs text-primary hover:underline">Mark all read</button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto text-xs py-1">
                    <div className="p-2 rounded-xl bg-secondary/30 border border-border/40">
                      <p className="font-medium text-foreground">Welcome to TaskSync!</p>
                      <p className="text-muted-foreground mt-0.5">Explore the dashboard, kanban board, and calendar views.</p>
                    </div>
                    <div className="p-2 rounded-xl bg-secondary/30 border border-border/40">
                      <p className="font-medium text-foreground">Deadline Reminder</p>
                      <p className="text-muted-foreground mt-0.5">You have high priority tasks due today. Check them out.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile Avatar Quick-link */}
            <div 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 cursor-pointer transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-primary" />
                )}
              </div>
              <span className="text-sm font-semibold">{user?.name.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="flex-1 p-6 md:p-10 relative overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
