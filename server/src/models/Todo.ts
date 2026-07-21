import { Schema, model, Types } from 'mongoose';

const checklistSchema = new Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const attachmentSchema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, required: true },
});

const recurringSchema = new Schema({
  type: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'],
    default: 'none',
  },
  interval: {
    type: Number, // In days if custom, or interval count
    default: 1,
  },
});

const historySchema = new Schema({
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const todoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String, // Storing as string (name of category) for simplicity or reference
      default: 'Personal',
    },
    status: {
      type: String,
      enum: ['pending', 'in progress', 'completed', 'archived'],
      default: 'pending',
    },
    deadline: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reminder: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    favorite: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    checklist: [checklistSchema],
    attachments: [attachmentSchema],
    recurring: {
      type: recurringSchema,
      default: () => ({ type: 'none', interval: 1 }),
    },
    history: [historySchema],
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimization
todoSchema.index({ user: 1, status: 1 });
todoSchema.index({ user: 1, deadline: 1 });

export const Todo = model('Todo', todoSchema);
