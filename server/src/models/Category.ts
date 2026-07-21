import { Schema, model, Types } from 'mongoose';

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6', // Tailwind Blue default
    },
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

// Unique combination of user and category name
categorySchema.index({ name: 1, user: 1 }, { unique: true });

export const Category = model('Category', categorySchema);
