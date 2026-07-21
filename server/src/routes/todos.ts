import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  patchTodoStatus,
  patchTodoFavorite,
  patchTodoArchive,
  duplicateTodo,
  bulkTodoAction,
  getDashboardStats,
} from '../controllers/todoController';
import { authMiddleware } from '../middleware/auth';

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up disk storage for attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

router.use(authMiddleware);

// Dashboard stats route (needs to be defined before /:id)
router.get('/dashboard', getDashboardStats);

// Bulk actions route
router.post('/bulk', bulkTodoAction);

// File upload route
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // Return the file details. The path is relative to the server URL
  const filePath = `/uploads/${req.file.filename}`;
  res.json({
    name: req.file.originalname,
    path: filePath,
    type: req.file.mimetype,
  });
});

// Duplicate route
router.post('/:id/duplicate', duplicateTodo);

// Patch specific fields
router.patch('/:id/status', patchTodoStatus);
router.patch('/:id/favorite', patchTodoFavorite);
router.patch('/:id/archive', patchTodoArchive);

// Standard CRUD routes
router.route('/')
  .get(getTodos)
  .post(createTodo);

router.route('/:id')
  .get(getTodoById)
  .put(updateTodo)
  .delete(deleteTodo);

export default router;
