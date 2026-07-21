import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { 
  Calendar, 
  Check, 
  Clock, 
  AlertTriangle, 
  Star, 
  Pin,
  Loader2
} from 'lucide-react';

interface Todo {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'pending' | 'in progress' | 'completed' | 'archived';
  deadline: string | null;
  favorite: boolean;
  pinned: boolean;
}

interface Column {
  id: Todo['status'];
  title: string;
  color: string;
  tasks: Todo[];
}

export const Kanban: React.FC = () => {
  const [columns, setColumns] = useState<{ [key in Todo['status']]: Column }>({
    'pending': { id: 'pending', title: 'Pending', color: 'border-blue-500/40 bg-blue-500/5', tasks: [] },
    'in progress': { id: 'in progress', title: 'In Progress', color: 'border-amber-500/40 bg-amber-500/5', tasks: [] },
    'completed': { id: 'completed', title: 'Completed', color: 'border-emerald-500/40 bg-emerald-500/5', tasks: [] },
    'archived': { id: 'archived', title: 'Archive', color: 'border-slate-500/40 bg-slate-500/5', tasks: [] }
  });
  const [loading, setLoading] = useState(true);

  const fetchKanbanTodos = async () => {
    try {
      const res = await API.get('/todos', { params: { sort: 'priority' } });
      const todos: Todo[] = res.data;

      // Group todos by status
      const grouped: { [key in Todo['status']]: Todo[] } = {
        'pending': [],
        'in progress': [],
        'completed': [],
        'archived': []
      };

      todos.forEach(todo => {
        if (grouped[todo.status]) {
          grouped[todo.status].push(todo);
        } else {
          // fallback
          grouped['pending'].push(todo);
        }
      });

      setColumns({
        'pending': { ...columns['pending'], tasks: grouped['pending'] },
        'in progress': { ...columns['in progress'], tasks: grouped['in progress'] },
        'completed': { ...columns['completed'], tasks: grouped['completed'] },
        'archived': { ...columns['archived'], tasks: grouped['archived'] }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKanbanTodos();
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Check if item was dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColId = source.droppableId as Todo['status'];
    const destColId = destination.droppableId as Todo['status'];

    const sourceCol = columns[sourceColId];
    const destCol = columns[destColId];

    const sourceTasks = Array.from(sourceCol.tasks);
    const destTasks = Array.from(destCol.tasks);

    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (sourceColId === destColId) {
      // Reordered within the same column
      sourceTasks.splice(destination.index, 0, movedTask);
      setColumns({
        ...columns,
        [sourceColId]: { ...sourceCol, tasks: sourceTasks }
      });
    } else {
      // Moved to a different column
      movedTask.status = destColId;
      destTasks.splice(destination.index, 0, movedTask);
      
      setColumns({
        ...columns,
        [sourceColId]: { ...sourceCol, tasks: sourceTasks },
        [destColId]: { ...destCol, tasks: destTasks }
      });

      // Sync status change to backend
      try {
        if (destColId === 'archived') {
          await API.patch(`/todos/${draggableId}/archive`);
        } else {
          await API.patch(`/todos/${draggableId}/status`, { status: destColId });
        }
      } catch (err) {
        console.error('Failed syncing drag position to backend', err);
        // revert
        fetchKanbanTodos();
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'medium': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'urgent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-bold">Interactive Kanban Board</h2>
        <p className="text-sm text-muted-foreground">Drag and drop cards to update task status instantly.</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 items-start min-h-[60vh]">
          {(Object.keys(columns) as Array<Todo['status']>).map((colId) => {
            const column = columns[colId];
            return (
              <div 
                key={colId} 
                className={`glass border rounded-3xl p-5 flex flex-col max-h-[75vh] ${column.color}`}
              >
                {/* Column Title */}
                <div className="flex justify-between items-center mb-4 px-1.5">
                  <h3 className="font-bold text-sm tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                    {column.title}
                  </h3>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-secondary/80 text-muted-foreground border border-border/40">
                    {column.tasks.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={colId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        flex-1 overflow-y-auto space-y-4 min-h-[150px] rounded-2xl p-1 transition-colors duration-200
                        ${snapshot.isDraggingOver ? 'bg-secondary/40' : ''}
                      `}
                    >
                      {column.tasks.map((todo, index) => (
                        <Draggable key={todo._id} draggableId={todo._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                              className={`
                                p-4 bg-card rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing select-none relative
                                ${snapshot.isDragging ? 'shadow-2xl border-primary scale-[1.02] rotate-1' : ''}
                              `}
                            >
                              {/* Glowing Accent for Pinned */}
                              {todo.pinned && (
                                <div className="absolute top-0 left-4 right-4 h-[2px] bg-primary/80 rounded-full"></div>
                              )}

                              {/* Card Header indicators */}
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-secondary border border-border/40 max-w-[120px] truncate">
                                  {todo.category}
                                </span>
                                <div className="flex gap-1">
                                  {todo.pinned && <Pin className="w-3.5 h-3.5 text-primary fill-current" />}
                                  {todo.favorite && <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />}
                                </div>
                              </div>

                              {/* Title */}
                              <h4 className="font-bold text-sm text-foreground/90 leading-tight">
                                {todo.title}
                              </h4>

                              {/* Description snippet */}
                              {todo.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-normal">
                                  {todo.description}
                                </p>
                              )}

                              {/* Card Footer */}
                              <div className="flex items-center justify-between mt-4 border-t border-border/40 pt-3 text-[10px]">
                                {/* Deadline indicator */}
                                {todo.deadline ? (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(todo.deadline).toLocaleDateString()}</span>
                                  </div>
                                ) : (
                                  <span></span>
                                )}

                                {/* Priority badge */}
                                <span className={`font-extrabold uppercase border px-2 py-0.5 rounded-md ${getPriorityColor(todo.priority)}`}>
                                  {todo.priority}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
