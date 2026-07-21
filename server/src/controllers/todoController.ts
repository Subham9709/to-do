import { Response } from 'express';
import { Todo } from '../models/Todo';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all user todos (with search, filter, sort)
// @route   GET /api/todos
// @access  Private
export const getTodos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      search,
      priority,
      category,
      status,
      favorite,
      archived,
      pinned,
      deadline,
      sort,
    } = req.query;

    const query: any = { user: userId };

    // Search filters
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // Direct filters
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (status) {
      query.status = status;
    } else {
      // By default, exclude archived unless explicitly requested
      if (archived === 'true') {
        query.status = 'archived';
      } else {
        query.status = { $ne: 'archived' };
      }
    }

    if (favorite !== undefined) query.favorite = favorite === 'true';
    if (pinned !== undefined) query.pinned = pinned === 'true';

    // Deadline filters
    if (deadline) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (deadline === 'today') {
        query.deadline = { $gte: startOfDay, $lte: endOfDay };
      } else if (deadline === 'overdue') {
        query.deadline = { $lt: startOfDay };
        query.status = { $ne: 'completed' };
      } else if (deadline === 'upcoming') {
        query.deadline = { $gt: endOfDay };
      } else if (deadline === 'no-deadline') {
        query.deadline = null;
      }
    }

    // Build query execution
    let queryExec = Todo.find(query);

    // Sorting
    if (sort) {
      switch (sort) {
        case 'oldest':
          queryExec = queryExec.sort({ createdAt: 1 });
          break;
        case 'alphabetical':
          queryExec = queryExec.sort({ title: 1 });
          break;
        case 'priority':
          // Sort by urgent -> high -> medium -> low
          // Mongoose doesn't support custom enum ordering natively in simple sort,
          // so we can fetch and sort in memory, or use aggregation, or do default
          queryExec = queryExec.sort({ priority: 1 }); // alphabetical by default, we can sort in JS if needed
          break;
        case 'deadline':
          queryExec = queryExec.sort({ deadline: 1 });
          break;
        case 'recentlyUpdated':
          queryExec = queryExec.sort({ updatedAt: -1 });
          break;
        case 'newest':
        default:
          queryExec = queryExec.sort({ createdAt: -1 });
          break;
      }
    } else {
      // Default: pinned tasks first, then newest
      queryExec = queryExec.sort({ pinned: -1, createdAt: -1 });
    }

    const todos = await queryExec;

    // Handle priority custom sort in JS if needed
    if (sort === 'priority') {
      const priorityOrder: { [key: string]: number } = { urgent: 4, high: 3, medium: 2, low: 1 };
      todos.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }

    res.json(todos);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single todo by ID
// @route   GET /api/todos/:id
// @access  Private
export const getTodoById = async (req: AuthRequest, res: Response) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user?.id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(todo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new todo
// @route   POST /api/todos
// @access  Private
export const createTodo = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      deadline,
      reminder,
      tags,
      checklist,
      recurring,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const history = [{ action: 'Task created', timestamp: new Date() }];

    const todo = await Todo.create({
      title,
      description,
      priority: priority || 'medium',
      category: category || 'Personal',
      deadline: deadline || null,
      reminder: reminder || null,
      tags: tags || [],
      checklist: checklist || [],
      recurring: recurring || { type: 'none', interval: 1 },
      history,
      user: req.user?.id,
    });

    res.status(201).json(todo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a todo
// @route   PUT /api/todos/:id
// @access  Private
export const updateTodo = async (req: AuthRequest, res: Response) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user?.id });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const updates = req.body;
    const historyActions: string[] = [];

    // Track historical updates
    if (updates.title && updates.title !== todo.title) historyActions.push(`Title changed from "${todo.title}" to "${updates.title}"`);
    if (updates.status && updates.status !== todo.status) {
      historyActions.push(`Status changed from "${todo.status}" to "${updates.status}"`);
      if (updates.status === 'completed') {
        updates.completedAt = new Date();
      } else {
        updates.completedAt = null;
      }
    }
    if (updates.priority && updates.priority !== todo.priority) historyActions.push(`Priority changed from "${todo.priority}" to "${updates.priority}"`);

    // Merge changes
    Object.keys(updates).forEach((key) => {
      if (key !== 'history') {
        (todo as any)[key] = updates[key];
      }
    });

    // Append history
    historyActions.forEach((act) => {
      todo.history.push({ action: act, timestamp: new Date() });
    });

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a todo (with optional undo logs or simply hard delete)
// @route   DELETE /api/todos/:id
// @access  Private
export const deleteTodo = async (req: AuthRequest, res: Response) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user?.id });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully', deletedTodo: todo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Patch status of a todo
// @route   PATCH /api/todos/:id/status
// @access  Private
export const patchTodoStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in progress', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const todo = await Todo.findOne({ _id: req.params.id, user: req.user?.id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const oldStatus = todo.status;
    todo.status = status;
    
    if (status === 'completed') {
      todo.completedAt = new Date();
    } else {
      todo.completedAt = null;
    }

    todo.history.push({
      action: `Status updated from "${oldStatus}" to "${status}"`,
      timestamp: new Date(),
    });

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Patch favorite status
// @route   PATCH /api/todos/:id/favorite
// @access  Private
export const patchTodoFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user?.id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.favorite = !todo.favorite;
    todo.history.push({
      action: todo.favorite ? 'Marked as favorite' : 'Removed from favorites',
      timestamp: new Date(),
    });

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Patch archive status
// @route   PATCH /api/todos/:id/archive
// @access  Private
export const patchTodoArchive = async (req: AuthRequest, res: Response) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user?.id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.archived = !todo.archived;
    todo.status = todo.archived ? 'archived' : 'pending';

    todo.history.push({
      action: todo.archived ? 'Archived task' : 'Restored task from archive',
      timestamp: new Date(),
    });

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Duplicate a todo
// @route   POST /api/todos/:id/duplicate
// @access  Private
export const duplicateTodo = async (req: AuthRequest, res: Response) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user?.id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const duplicatedTodo = await Todo.create({
      title: `${todo.title} (Copy)`,
      description: todo.description,
      priority: todo.priority,
      category: todo.category,
      status: 'pending',
      deadline: todo.deadline,
      tags: todo.tags,
      checklist: todo.checklist.map((item: any) => ({ text: item.text, completed: false })),
      history: [{ action: `Duplicated from "${todo.title}"`, timestamp: new Date() }],
      user: req.user?.id,
    });

    res.status(201).json(duplicatedTodo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk actions (complete, delete, archive)
// @route   POST /api/todos/bulk
// @access  Private
export const bulkTodoAction = async (req: AuthRequest, res: Response) => {
  try {
    const { ids, action } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty IDs array' });
    }

    const userId = req.user?.id;

    if (action === 'delete') {
      await Todo.deleteMany({ _id: { $in: ids }, user: userId });
      return res.json({ message: `Successfully deleted ${ids.length} todos` });
    }

    let updateDoc: any = {};
    let actionLabel = '';

    if (action === 'complete') {
      updateDoc = { status: 'completed', completedAt: new Date() };
      actionLabel = 'Bulk marked as completed';
    } else if (action === 'archive') {
      updateDoc = { status: 'archived', archived: true };
      actionLabel = 'Bulk archived';
    } else if (action === 'restore') {
      updateDoc = { status: 'pending', archived: false };
      actionLabel = 'Bulk restored';
    } else {
      return res.status(400).json({ message: 'Invalid bulk action' });
    }

    await Todo.updateMany(
      { _id: { $in: ids }, user: userId },
      {
        $set: updateDoc,
        $push: { history: { action: actionLabel, timestamp: new Date() } },
      }
    );

    res.json({ message: `Successfully executed ${action} for ${ids.length} todos` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard metrics & analytics
// @route   GET /api/todos/dashboard
// @access  Private
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const allTodos = await Todo.find({ user: userId });

    const total = allTodos.length;
    const completed = allTodos.filter(t => t.status === 'completed').length;
    const pending = allTodos.filter(t => t.status === 'pending' || t.status === 'in progress').length;
    const archived = allTodos.filter(t => t.status === 'archived').length;

    // Overdue tasks
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const overdue = allTodos.filter(t => t.status !== 'completed' && t.status !== 'archived' && t.deadline && new Date(t.deadline) < todayEnd).length;

    // Today's tasks
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todaysTasks = allTodos.filter(t => t.deadline && new Date(t.deadline) >= startOfToday && new Date(t.deadline) <= todayEnd).length;

    // High/Urgent tasks
    const urgentCount = allTodos.filter(t => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed' && t.status !== 'archived').length;

    // Completion %
    const completionRate = total > 0 ? Math.round((completed / (total - archived || 1)) * 100) : 0;

    // Grouping by Category
    const categoryStats: { [key: string]: number } = {};
    allTodos.forEach(t => {
      if (t.status !== 'archived') {
        categoryStats[t.category] = (categoryStats[t.category] || 0) + 1;
      }
    });

    // Grouping by Priority
    const priorityStats = {
      low: allTodos.filter(t => t.priority === 'low' && t.status !== 'archived').length,
      medium: allTodos.filter(t => t.priority === 'medium' && t.status !== 'archived').length,
      high: allTodos.filter(t => t.priority === 'high' && t.status !== 'archived').length,
      urgent: allTodos.filter(t => t.priority === 'urgent' && t.status !== 'archived').length,
    };

    // Calculate streaks
    // Sort completed tasks by completedAt date
    const completedTasks = allTodos
      .filter(t => t.status === 'completed' && t.completedAt)
      .map(t => new Date(t.completedAt!).toDateString());
    
    // De-duplicate completed dates
    const uniqueDates = Array.from(new Set(completedTasks)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // newest first

    let currentStreak = 0;
    let longestStreak = 0;

    if (uniqueDates.length > 0) {
      // Check current streak
      let tempStreak = 0;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const checkDate = new Date(uniqueDates[0]);
      // If the most recent completion is today or yesterday
      if (checkDate.toDateString() === today.toDateString() || checkDate.toDateString() === yesterday.toDateString()) {
        tempStreak = 1;
        let lastDate = checkDate;
        for (let i = 1; i < uniqueDates.length; i++) {
          const diffTime = Math.abs(lastDate.getTime() - uniqueDates[i].getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
            lastDate = uniqueDates[i];
          } else if (diffDays > 1) {
            break;
          }
        }
        currentStreak = tempStreak;
      }

      // Check longest streak
      let maxStreak = 0;
      if (uniqueDates.length > 0) {
        let runningStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const diffTime = Math.abs(uniqueDates[i].getTime() - uniqueDates[i+1].getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            runningStreak++;
          } else if (diffDays > 1) {
            if (runningStreak > maxStreak) maxStreak = runningStreak;
            runningStreak = 1;
          }
        }
        if (runningStreak > maxStreak) maxStreak = runningStreak;
        longestStreak = maxStreak;
      }
    }

    // Average completion time
    const completionTimes = allTodos
      .filter(t => t.status === 'completed' && t.completedAt)
      .map(t => {
        const created = new Date(t.createdAt).getTime();
        const completedDate = new Date(t.completedAt!).getTime();
        return (completedDate - created) / (1000 * 60 * 60); // In hours
      });
    const avgCompletionTime = completionTimes.length > 0
      ? parseFloat((completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1))
      : 0;

    // Weekly completion stats (last 7 days)
    const weeklyProductivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toDateString();
      const count = allTodos.filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt).toDateString() === dateString).length;
      weeklyProductivity.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: count,
      });
    }

    res.json({
      total,
      completed,
      pending,
      overdue,
      todaysTasks,
      highPriority: urgentCount,
      completionRate,
      categoryStats,
      priorityStats,
      streaks: {
        current: currentStreak,
        longest: longestStreak,
      },
      avgCompletionTime,
      weeklyProductivity,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
