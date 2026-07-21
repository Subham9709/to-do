import { Response } from 'express';
import { Category } from '../models/Category';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all user categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.find({ user: req.user?.id });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a custom category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists for user
    const exists = await Category.findOne({ name, user: req.user?.id });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      color: color || '#3b82f6',
      user: req.user?.id,
    });

    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user?.id });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
