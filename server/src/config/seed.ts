import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Todo } from '../models/Todo';
import { Category } from '../models/Category';

dotenv.config();

const seedDatabase = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todo-app';
    console.log('Connecting to database for seeding...');
    await mongoose.connect(connStr);

    console.log('Clearing existing seed user data (test@example.com)...');
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      await Todo.deleteMany({ user: existingUser._id });
      await Category.deleteMany({ user: existingUser._id });
      await User.findByIdAndDelete(existingUser._id);
    }

    console.log('Creating seed user...');
    const user = await User.create({
      name: 'Demo User',
      email: 'test@example.com',
      password: 'password123', // Hashed automatically by pre-save middleware
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    });

    console.log('Seeding custom categories...');
    const categoriesData = [
      { name: 'Work', color: '#3b82f6', user: user._id },
      { name: 'Personal', color: '#10b981', user: user._id },
      { name: 'Coding', color: '#8b5cf6', user: user._id },
      { name: 'Finance', color: '#f59e0b', user: user._id },
      { name: 'Health', color: '#ef4444', user: user._id },
    ];
    await Category.insertMany(categoriesData);

    console.log('Seeding todos...');
    const now = new Date();
    
    // Deadlines
    const today = new Date(now);
    today.setHours(17, 0, 0, 0);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 5);

    const todosData = [
      {
        title: 'Review landing page redesign mockups',
        description: 'Read feedback from stakeholders and prepare adjustments for the design review meeting.',
        priority: 'high',
        category: 'Work',
        status: 'pending',
        deadline: today,
        pinned: true,
        checklist: [
          { text: 'Check typography alignment', completed: true },
          { text: 'Verify dark mode contrast ratios', completed: false },
          { text: 'Add interactive animations specs', completed: false },
        ],
        history: [{ action: 'Task created via seeding', timestamp: new Date() }],
        user: user._id,
      },
      {
        title: 'Implement Kanban drag-and-drop state sync',
        description: 'Sync status updates in Hello Pangea DnD on the frontend using Axios to the server endpoints.',
        priority: 'urgent',
        category: 'Coding',
        status: 'in progress',
        deadline: tomorrow,
        favorite: true,
        checklist: [
          { text: 'Set up columns layout structure', completed: true },
          { text: 'Add endpoint connection in todo service', completed: true },
          { text: 'Write error catch rollback states', completed: false },
        ],
        history: [{ action: 'Task created and set in progress', timestamp: new Date() }],
        user: user._id,
      },
      {
        title: 'Submit monthly financial reports',
        description: 'Compile spreadsheet expenses sheet and send draft to accounting department.',
        priority: 'medium',
        category: 'Finance',
        status: 'pending',
        deadline: yesterday, // Overdue
        checklist: [],
        history: [{ action: 'Task created via seeding', timestamp: new Date() }],
        user: user._id,
      },
      {
        title: 'Cardio workout training session',
        description: '30 minutes high intensity training on treadmill or outdoor trail.',
        priority: 'low',
        category: 'Health',
        status: 'completed',
        deadline: yesterday,
        completedAt: yesterday,
        checklist: [],
        history: [{ action: 'Task created and completed', timestamp: new Date() }],
        user: user._id,
      },
      {
        title: 'Draft weekly marketing email campaign copy',
        description: 'Write copy highlighting new product releases and workspace streak incentives.',
        priority: 'medium',
        category: 'Work',
        status: 'completed',
        deadline: today,
        completedAt: now,
        checklist: [],
        history: [{ action: 'Task completed', timestamp: new Date() }],
        user: user._id,
      },
      {
        title: 'Read Chapter 4 of Clean Architecture book',
        description: 'Take notes on dependency inversion principles and clean routing architectures.',
        priority: 'low',
        category: 'Personal',
        status: 'pending',
        deadline: nextWeek,
        checklist: [],
        history: [{ action: 'Task created', timestamp: new Date() }],
        user: user._id,
      }
    ];

    await Todo.insertMany(todosData);
    console.log('Database successfully seeded!');
    
    console.log('\n--- DEMO CREDENTIALS ---');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('------------------------\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
