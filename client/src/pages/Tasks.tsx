import React, { useEffect, useState, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Pin,
  Star,
  Archive,
  Trash2,
  Copy,
  RotateCcw,
  Check,
  CheckSquare,
  Square,
  Paperclip,
  Calendar,
  AlertCircle,
  MoreVertical,
  Download,
  Upload,
  Keyboard,
  History,
  X,
  Sparkles,
  FileText,
  Bookmark,
  Loader2
} from 'lucide-react';

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

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filters & Sorting
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending'); // default: pending
  const [selectedDeadline, setSelectedDeadline] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Task Drawer & Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [viewingHistoryTodo, setViewingHistoryTodo] = useState<Todo | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState('Personal');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [reminder, setReminder] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // Checklist State in Form
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  // Attachments State in Form
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recurrence
  const [recurringType, setRecurringType] = useState<Todo['recurring']['type']>('none');
  const [recurringInterval, setRecurringInterval] = useState(1);

  // Undo Delete Tracker
  const [lastDeletedTodo, setLastDeletedTodo] = useState<Todo | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut instructions modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch todos & categories
  const fetchData = async () => {
    try {
      const res = await API.get('/todos', {
        params: {
          search,
          priority: selectedPriority || undefined,
          category: selectedCategory || undefined,
          status: selectedStatus || undefined,
          deadline: selectedDeadline || undefined,
          sort: selectedSort,
        },
      });
      setTodos(res.data);

      const catRes = await API.get('/categories');
      setCategories(catRes.data.map((c: any) => c.name));
    } catch (err) {
      console.error('Failed fetching tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedPriority, selectedCategory, selectedStatus, selectedDeadline, selectedSort]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open New Task Modal: Ctrl + Shift + N
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        openCreateModal();
      }
      // Focus Search: Ctrl + F
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Close active modals: Escape
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setViewingHistoryTodo(null);
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal Openers
  const openCreateModal = () => {
    setEditingTodo(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory(categories[0] || 'Personal');
    setDeadline('');
    setReminder('');
    setTags([]);
    setChecklist([]);
    setAttachments([]);
    setRecurringType('none');
    setRecurringInterval(1);
    setIsModalOpen(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setPriority(todo.priority || 'medium');
    setCategory(todo.category || 'Personal');
    setDeadline(todo.deadline ? todo.deadline.substring(0, 16) : '');
    setReminder(todo.reminder ? todo.reminder.substring(0, 16) : '');
    setTags(todo.tags || []);
    setChecklist(todo.checklist || []);
    setAttachments(todo.attachments || []);
    setRecurringType(todo.recurring?.type || 'none');
    setRecurringInterval(todo.recurring?.interval || 1);
    setIsModalOpen(true);
  };

  // Checklist Helpers
  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([...checklist, { text: newChecklistItem.trim(), completed: false }]);
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (index: number) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    setChecklist(updated);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  // Tags Helpers
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Category Helpers
  const addCustomCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await API.post('/categories', { name: newCategoryName.trim() });
      setCategories([...categories, newCategoryName.trim()]);
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      console.error(err);
      alert('Category already exists or failed to add');
    }
  };

  // File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await API.post('/todos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachments([...attachments, res.data]);
    } catch (err) {
      console.error('File upload failed', err);
      alert('File upload failed. Max size is 5MB.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit Task Form
  const handleSaveTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description,
      priority,
      category,
      deadline: deadline || null,
      reminder: reminder || null,
      tags,
      checklist,
      attachments,
      recurring: { type: recurringType, interval: recurringInterval },
    };

    try {
      if (editingTodo) {
        await API.put(`/todos/${editingTodo._id}`, payload);
      } else {
        await API.post('/todos', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving todo', err);
    }
  };

  // CRUD Toggles
  const handleToggleFavorite = async (todo: Todo) => {
    try {
      const res = await API.patch(`/todos/${todo._id}/favorite`);
      setTodos(todos.map((t) => (t._id === todo._id ? res.data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleArchive = async (todo: Todo) => {
    try {
      const res = await API.patch(`/todos/${todo._id}/archive`);
      setTodos(todos.map((t) => (t._id === todo._id ? res.data : t)));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async (todo: Todo) => {
    try {
      const res = await API.put(`/todos/${todo._id}`, { pinned: !todo.pinned });
      setTodos(todos.map((t) => (t._id === todo._id ? res.data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (todo: Todo) => {
    try {
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      const res = await API.patch(`/todos/${todo._id}/status`, { status: newStatus });
      setTodos(todos.map((t) => (t._id === todo._id ? res.data : t)));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateTodo = async (todo: Todo) => {
    try {
      const res = await API.post(`/todos/${todo._id}/duplicate`);
      setTodos([res.data, ...todos]);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Inline checklist item complete toggle (inside list view)
  const handleToggleTodoChecklistItem = async (todo: Todo, itemIndex: number) => {
    const updatedChecklist = [...(todo.checklist || [])];
    if (updatedChecklist[itemIndex]) {
      updatedChecklist[itemIndex].completed = !updatedChecklist[itemIndex].completed;
    }
    try {
      const res = await API.put(`/todos/${todo._id}`, { checklist: updatedChecklist });
      setTodos(todos.map((t) => (t._id === todo._id ? res.data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete & Undo Delete logic
  const handleDeleteTodo = async (todo: Todo) => {
    try {
      const res = await API.delete(`/todos/${todo._id}`);
      
      // Store in memory for undo
      setLastDeletedTodo(res.data.deletedTodo);
      setShowUndoToast(true);
      
      // Auto-hide toast after 5s
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setShowUndoToast(false);
        setLastDeletedTodo(null);
      }, 5000);

      setTodos(todos.filter((t) => t._id !== todo._id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedTodo) return;
    try {
      await API.post('/todos', lastDeletedTodo);
      setShowUndoToast(false);
      setLastDeletedTodo(null);
      fetchData();
    } catch (err) {
      console.error('Failed to undo delete', err);
    }
  };

  // Bulk Actions
  const handleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === todos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(todos.map((t) => t._id));
    }
  };

  const handleBulkAction = async (action: 'complete' | 'delete' | 'archive' | 'restore') => {
    if (selectedIds.length === 0) return;
    try {
      await API.post('/todos/bulk', { ids: selectedIds, action });
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Import / Export JSON / CSV
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(todos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "tasks_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Description', 'Priority', 'Category', 'Status', 'Deadline', 'Tags'];
    const rows = todos.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.priority,
      t.category,
      t.status,
      t.deadline || '',
      `"${t.tags.join(', ')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(","))].join("\n");
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", "tasks_export.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          alert('Invalid JSON structure. Needs to be a list of tasks.');
          return;
        }

        // Loop through and seed
        for (const item of parsed) {
          await API.post('/todos', {
            title: item.title,
            description: item.description || '',
            priority: item.priority || 'medium',
            category: item.category || 'Personal',
            deadline: item.deadline || null,
            tags: item.tags || [],
            checklist: item.checklist || [],
          });
        }
        fetchData();
        alert(`Successfully imported ${parsed.length} tasks!`);
      } catch (err) {
        console.error(err);
        alert('Failed parsing JSON file');
      }
    };
    reader.readAsText(file);
  };

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'medium': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'urgent': return 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative pb-20">
      {/* Quick Access Menu Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Live search by title, tags, category... (Ctrl + F)"
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-secondary/30 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl border border-border/80 flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${showFilters ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-secondary/40'}`}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
          
          <button
            onClick={openCreateModal}
            className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 text-sm transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </button>

          <button
            onClick={() => setShowShortcuts(true)}
            className="p-3 rounded-2xl border border-border/80 bg-card text-foreground hover:bg-secondary/40 transition-colors"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </button>

          <button
            onClick={handleExportJSON}
            className="p-3 rounded-2xl border border-border/80 bg-card text-foreground hover:bg-secondary/40 transition-colors"
            title="Export JSON"
          >
            <Download className="w-5 h-5" />
          </button>

          <label 
            className="p-3 rounded-2xl border border-border/80 bg-card text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
            title="Import JSON"
          >
            <Upload className="w-5 h-5" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass border border-border/80 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Status filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-secondary/30 border border-border/60 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                  <option value="">All Statuses</option>
                </select>
              </div>

              {/* Priority filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-secondary/30 border border-border/60 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Category filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-secondary/30 border border-border/60 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Deadline filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deadline</label>
                <select
                  value={selectedDeadline}
                  onChange={(e) => setSelectedDeadline(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-secondary/30 border border-border/60 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Any Date</option>
                  <option value="today">Due Today</option>
                  <option value="overdue">Overdue</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="no-deadline">No Deadline</option>
                </select>
              </div>

              {/* Sorting option */}
              <div className="space-y-2 md:col-span-4 border-t border-border/40 pt-4 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Sort By:</span>
                  {['newest', 'oldest', 'alphabetical', 'priority', 'deadline', 'recentlyUpdated'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSort(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${selectedSort === s ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground hover:bg-secondary'}`}
                    >
                      {s === 'recentlyUpdated' ? 'recently updated' : s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setSelectedPriority('');
                    setSelectedCategory('');
                    setSelectedStatus('pending');
                    setSelectedDeadline('');
                    setSelectedSort('newest');
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk actions tools overlay */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.length === todos.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
            />
            <span className="text-sm font-bold">{selectedIds.length} tasks selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('complete')}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Complete
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            {selectedStatus === 'archived' && (
              <button
                onClick={() => handleBulkAction('restore')}
                className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore
              </button>
            )}
          </div>
        </div>
      )}

      {/* Todo List / Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-semibold">Loading your workspace...</p>
        </div>
      ) : todos.length === 0 ? (
        <div className="glass border border-dashed border-border/80 rounded-3xl p-16 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-xl font-bold">No tasks found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You don't have any tasks matching your filters. Create a new task to get started!
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg hover:shadow-primary/20 transition-all duration-200"
          >
            Create First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {todos.map((todo) => (
            <motion.div
              layoutId={todo._id}
              key={todo._id}
              className={`
                glass rounded-3xl p-6 border relative transition-all duration-300 flex flex-col justify-between group h-full
                ${todo.pinned ? 'border-primary/40 bg-primary/[0.02]' : 'border-border/80'}
              `}
            >
              {/* Top Row Indicators */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(todo._id)}
                    onChange={() => handleSelectId(todo._id)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border/80 cursor-pointer"
                  />
                  
                  {/* Category color indicator */}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-secondary/80 text-foreground border border-border/40">
                    {todo.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 opacity-90">
                  <button
                    onClick={() => handleTogglePin(todo)}
                    className={`p-1.5 rounded-lg hover:bg-secondary/80 transition-colors ${todo.pinned ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <Pin className="w-4 h-4 fill-current opacity-70" />
                  </button>
                  <button
                    onClick={() => handleToggleFavorite(todo)}
                    className={`p-1.5 rounded-lg hover:bg-secondary/80 transition-colors ${todo.favorite ? 'text-yellow-500' : 'text-muted-foreground'}`}
                  >
                    <Star className="w-4 h-4 fill-current opacity-70" />
                  </button>
                </div>
              </div>

              {/* Task Info */}
              <div className="space-y-2 flex-1 cursor-pointer" onClick={() => openEditModal(todo)}>
                <h4 className={`font-bold text-lg leading-tight transition-all duration-200 ${todo.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {todo.title}
                </h4>
                {todo.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {todo.description}
                  </p>
                )}
              </div>

              {/* Checklist Progress */}
              {(todo.checklist || []).length > 0 && (
                <div className="my-4 space-y-1.5 border-t border-border/40 pt-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                    <span>Checklist</span>
                    <span>
                      {(todo.checklist || []).filter((c) => c.completed).length}/{(todo.checklist || []).length}
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${((todo.checklist || []).filter((c) => c.completed).length / (todo.checklist || []).length) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Minified checklists checks */}
                  <div className="space-y-1 max-h-24 overflow-y-auto pt-1.5">
                    {(todo.checklist || []).map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleToggleTodoChecklistItem(todo, idx)}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5"
                      >
                        {item.completed ? (
                          <CheckSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span className={item.completed ? 'line-through opacity-70' : ''}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Row */}
              <div className="border-t border-border/40 pt-4 mt-4 flex items-center justify-between gap-4 flex-wrap">
                {/* Due Date & Attachments Indicators */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {todo.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(todo.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {(todo.attachments || []).length > 0 && (
                    <div className="flex items-center gap-1" title={`${(todo.attachments || []).length} files attached`}>
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{(todo.attachments || []).length}</span>
                    </div>
                  )}
                </div>

                {/* Priority Badge */}
                <span className={`text-[10px] font-extrabold uppercase border px-2 py-1 rounded-full ${getPriorityBadgeColor(todo.priority)}`}>
                  {todo.priority}
                </span>
              </div>

              {/* Hover Actions Menu */}
              <div className="border-t border-border/40 pt-3 mt-3 flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(todo)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all duration-200
                    ${todo.status === 'completed' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' 
                      : 'bg-secondary/40 border-border/80 hover:bg-secondary text-foreground'
                    }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{todo.status === 'completed' ? 'Completed' : 'Complete'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateTodo(todo)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    title="Duplicate Task"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewingHistoryTodo(todo)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    title="View Task History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleArchive(todo)}
                    className={`p-2 rounded-xl hover:bg-secondary/50 ${todo.status === 'archived' ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}
                    title={todo.status === 'archived' ? 'Restore Task' : 'Archive Task'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Task Creation & Editing Modal Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-xl bg-background rounded-3xl border border-border h-full flex flex-col shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-border/60">
                <h3 className="text-xl font-bold">{editingTodo ? 'Edit Task Details' : 'Create New Task'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveTodo} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Complete redesign proposal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-secondary/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Description</label>
                  <textarea
                    placeholder="Write details or markdown formatting..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-secondary/30 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                  ></textarea>
                </div>

                {/* Grid (Category & Priority) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-foreground/80">Category</label>
                      <button 
                        type="button" 
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        + Create Custom
                      </button>
                    </div>
                    
                    {showAddCategory ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-secondary/30 border border-border text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={addCustomCategory}
                          className="px-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3.5 rounded-2xl bg-secondary/30 border border-border text-sm focus:outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full p-3.5 rounded-2xl bg-secondary/30 border border-border text-sm focus:outline-none"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Priority</option>
                    </select>
                  </div>
                </div>

                {/* Deadlines & Reminders */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Deadline</label>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-secondary/30 border border-border text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/80">Remind Me</label>
                    <input
                      type="datetime-local"
                      value={reminder}
                      onChange={(e) => setReminder(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-secondary/30 border border-border text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Recurring task settings */}
                <div className="p-4 rounded-2xl bg-secondary/20 border border-border space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recurrence Pattern</label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={recurringType}
                      onChange={(e) => setRecurringType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none"
                    >
                      <option value="none">No Recurrence</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom Days</option>
                    </select>
                    {recurringType === 'custom' && (
                      <input
                        type="number"
                        min="1"
                        placeholder="Interval in days"
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                        className="w-full p-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Checklist Section */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Checklist Subtasks</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add subtask..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-secondary/30 border border-border text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      className="px-4 py-2 bg-secondary hover:bg-secondary-foreground hover:text-secondary rounded-2xl text-xs font-bold transition-all"
                    >
                      Add
                    </button>
                  </div>
                  {checklist.length > 0 && (
                    <div className="space-y-2 mt-3 p-3 bg-secondary/20 rounded-2xl border border-border/40">
                      {checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleChecklistItem(idx)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              {item.completed ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(idx)}
                            className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Tags</label>
                  <input
                    type="text"
                    placeholder="Type tag name and press Enter or comma..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full p-3 rounded-2xl bg-secondary/30 border border-border text-sm focus:outline-none"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-foreground text-xs font-bold rounded-full border border-border/40">
                          <span>{tag}</span>
                          <button type="button" onClick={() => removeTag(idx)} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attachments Section */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80 flex justify-between items-center">
                    <span>Attachments (Images/Files)</span>
                    <button
                      type="button"
                      disabled={uploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{uploadingFile ? 'Uploading...' : 'Attach File'}</span>
                    </button>
                  </label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />

                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/30 border border-border/40 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <a href={`http://localhost:5000${file.path}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate font-semibold">
                              {file.name}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                            className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>

              {/* Footer */}
              <div className="p-6 border-t border-border flex justify-end gap-3 bg-secondary/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border border-border/80 bg-card hover:bg-secondary/40 font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTodo}
                  className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] text-sm transition-all"
                >
                  Save Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task History Drawer */}
      <AnimatePresence>
        {viewingHistoryTodo && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-background rounded-3xl border border-border h-full flex flex-col shadow-2xl relative"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                <h3 className="text-lg font-bold">Task Log History</h3>
                <button onClick={() => setViewingHistoryTodo(null)} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h4 className="font-bold text-foreground">{viewingHistoryTodo.title}</h4>
                <div className="relative pl-6 border-l-2 border-primary/20 space-y-6 mt-4">
                  {viewingHistoryTodo.history.map((log, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-background"></span>
                      <p className="text-xs font-semibold text-foreground/90">{log.action}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-background border border-border rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  Keyboard Shortcuts
                </h3>
                <button onClick={() => setShowShortcuts(false)} className="p-1 hover:bg-secondary rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm py-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Open Create Modal</span>
                  <kbd className="px-2 py-1 rounded bg-secondary text-xs border border-border font-bold">Ctrl+Shift+N</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Focus Search Input</span>
                  <kbd className="px-2 py-1 rounded bg-secondary text-xs border border-border font-bold">Ctrl+F</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Close Active Overlay</span>
                  <kbd className="px-2 py-1 rounded bg-secondary text-xs border border-border font-bold">Esc</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Undo Delete Toast */}
      <AnimatePresence>
        {showUndoToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-6 duration-200">
            <div className="p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700/60 max-w-sm">
              <div className="flex-1 text-xs">
                <p className="font-semibold text-slate-100">Task Deleted</p>
                <p className="text-slate-400 mt-0.5 truncate max-w-[200px]">"{lastDeletedTodo?.title}" has been deleted.</p>
              </div>
              <button
                onClick={handleUndoDelete}
                className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Undo
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
