import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { Category } from '../models/Category';
import { Todo } from '../models/Todo';
import { verifyFirebaseToken } from '../utils/googleAuth';

const generateToken = (id: string, email: string) => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET || 'default_secret_jwt_key_12345',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // Seed some default categories for the user
      const defaultCategories = ['Personal', 'Work', 'College', 'Shopping', 'Health', 'Finance', 'Coding'];
      await Category.insertMany(
        defaultCategories.map((cat) => ({
          name: cat,
          color: getRandomColor(),
          user: user._id,
        }))
      );

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        settings: user.settings,
        token: generateToken(user._id.toString(), user.email),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Helper for colors
const getRandomColor = () => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    if (user && (await (user as any).comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        settings: user.settings,
        token: generateToken(user._id.toString(), user.email),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile & settings
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.avatar !== undefined) {
        user.avatar = req.body.avatar;
      }
      
      if (req.body.settings) {
        user.settings = {
          theme: req.body.settings.theme || user.settings?.theme || 'system',
          timezone: req.body.settings.timezone || user.settings?.timezone || 'UTC',
          language: req.body.settings.language || user.settings?.language || 'en',
        };
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        settings: updatedUser.settings,
        token: generateToken(updatedUser._id.toString(), updatedUser.email),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/profile
// @access  Private
export const deleteUserAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);

    if (user) {
      // Delete user's todos and categories
      await Todo.deleteMany({ user: userId });
      await Category.deleteMany({ user: userId });
      await User.findByIdAndDelete(userId);

      res.json({ message: 'User account and all associated data deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google Sign In / Register
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID Token is required' });
    }

    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
    if (!firebaseProjectId || firebaseProjectId === 'your_firebase_project_id_here') {
      return res.status(500).json({ message: 'Server Firebase project configuration is missing' });
    }

    // Verify token
    const decoded = await verifyFirebaseToken(idToken, firebaseProjectId);
    
    if (!decoded || !decoded.email) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    const email = decoded.email;
    const name = decoded.name || email.split('@')[0];
    const avatar = decoded.picture || '';

    // Find if user already exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Register new user with a secure random password
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      user = await User.create({
        name,
        email,
        password: randomPassword,
        avatar,
      });

      // Seed some default categories
      const defaultCategories = ['Personal', 'Work', 'College', 'Shopping', 'Health', 'Finance', 'Coding'];
      await Category.insertMany(
        defaultCategories.map((cat) => ({
          name: cat,
          color: getRandomColor(),
          user: user!._id,
        }))
      );
    } else if (avatar && !user.avatar) {
      user.avatar = avatar;
      await user.save();
    }

    // Issue JWT token
    const token = generateToken(user._id.toString(), user.email);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      settings: user.settings,
      token,
      isNewUser,
    });
  } catch (error: any) {
    console.error('Google Auth login failed', error);
    res.status(401).json({ message: error.message || 'Google Auth verification failed' });
  }
};
