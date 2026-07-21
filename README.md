# TaskSync - Modern Full-Stack Productivity Workspace

TaskSync is a professional, production-ready, full-stack Todo application built with React, Node.js, Express, TypeScript, and MongoDB. It offers an elegant, glassmorphic UI, responsive layouts, a comprehensive statistics dashboard, interactive Kanban columns, a drag-and-drop calendar view, subtasks checklists, custom categories, profile management, and a complete analytics engine.

---

## Technical Stack

### Frontend
- **Framework:** React (18.3.1)
- **Tooling:** Vite, TypeScript
- **Styling:** Tailwind CSS, Custom Glassmorphic Utilities
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Charts:** Recharts
- **Drag & Drop:** `@hello-pangea/dnd` and native HTML5 Drag and Drop API
- **Routing:** React Router DOM (v6)
- **Forms:** React Hook Form & Zod Validation

### Backend
- **Framework:** Node.js, Express.js, TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs password hashing
- **Security:** Helmet, CORS, Express Rate Limiter
- **File Uploads:** Multer

---

## Key Features

- 🔐 **Secure Authentication:** Register, login, and profile tracking via stateful JWT. Password hashing with bcrypt. Protected route redirects.
- 📊 **Interactive Dashboard:** Complete analytics with circular progress gauges, Recharts area and bar graphs, streak calculators (current and longest), average completion speed, and tips.
- 📋 **Advanced CRUD Tasks:** Title, description notes, priority badges (Low, Medium, High, Urgent), custom categories, deadline settings, tags, attachments, checklists, and recurrence patterns.
- 🗂️ **Interactive Kanban Board:** Drag and drop tasks between columns (Pending, In Progress, Completed, Archive) to instantly update database states.
- 📅 **Interactive Calendar:** Monthly and weekly calendars. Drag and drop task cards to different dates to reschedule deadlines on the fly.
- 🏷️ **Custom Categories:** Users can create custom categories with color indicators which automatically group tasks.
- 🔍 **Live Search & Filter:** Filter tasks by status, priority, category, and deadline. Instant debounced search matches title, descriptions, categories, and tags.
- ⚙️ **User Profile Settings:** Update names, change emails, edit profile pictures (via image upload), switch themes, timezones, and languages, or delete the account entirely.
- ⌨️ **Keyboard Shortcuts:** Access quick shortcuts (e.g., `Ctrl+Shift+N` to add tasks, `Ctrl+F` to search, `Esc` to close overlays).
- 💾 **Data Portability:** Export workspace data in JSON/CSV formats or import tasks from a JSON seed file.
- ↩️ **Undo Delete Support:** Deleting a task triggers a 5-second undo toast to instantly restore it.

---

## Folder Structure

```
todo-app/
├── client/
│   ├── src/
│   │   ├── components/      # UI components (e.g., ProtectedRoute)
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── layouts/         # Responsive AppLayout with sidebar
│   │   ├── pages/           # Dashboard, Tasks, Kanban, Calendar, Settings, Login, Register
│   │   ├── services/        # Axios API configurations
│   │   ├── index.css        # Core stylesheet, HSL variables, glassmorphism
│   │   ├── main.tsx         # React entry point
│   │   └── App.tsx          # Route configuration mapping
│   ├── tailwind.config.js   # Tailwind rules & colors
│   ├── postcss.config.js    # PostCSS configs
│   ├── vite.config.ts       # Vite bundler options
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/          # db.ts database setup, seed.ts data scripts
│   │   ├── controllers/     # authController, todoController, categoryController
│   │   ├── middleware/      # authMiddleware, errorHandler
│   │   ├── models/          # User, Todo, Category schema definitions
│   │   ├── routes/          # Express route endpoints
│   │   └── index.ts         # Main server initialization
│   ├── tsconfig.json        # TS compiler configuration
│   └── package.json
│
└── README.md
```

---

## Environment Variables

### Backend (`server/.env`)
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/todo-app
JWT_SECRET=super_secret_jwt_key_change_me_in_production
JWT_REFRESH_SECRET=another_super_secret_jwt_key_for_refresh_tokens
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`client/.env`)
Create a `.env` file in the `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB Atlas connection string

### Step 1: Clone and install dependencies
```bash
# Clone the repository and enter directory
cd todo-app

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Seed the Database (Optional but Recommended)
To start with mock data and a pre-configured user profile, run the database seeder:
```bash
cd server
npm run seed
```
This registers a demo account:
* **Email:** `test@example.com`
* **Password:** `password123`

### Step 3: Run the Servers

**Start the Backend:**
```bash
cd server
npm run dev
```
The server will boot on `http://localhost:5000`.

**Start the Frontend:**
```bash
cd client
npm run dev
```
The frontend dev server will launch on `http://localhost:5173`. Open this URL in your web browser.

---

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create user profile and get JWT.
- `POST /api/auth/login` - Authenticate credentials and return JWT.
- `GET /api/auth/profile` - Fetch current user credentials (Private).
- `PUT /api/auth/profile` - Update user names, settings, avatars, or password (Private).
- `DELETE /api/auth/profile` - Remove account, todos, and custom categories (Private).

### Todo Endpoints
- `GET /api/todos` - Retrieve todos with search, filter, and sorting queries (Private).
- `POST /api/todos` - Create a new todo task (Private).
- `GET /api/todos/dashboard` - Retrieve analytics & efficiency statistics (Private).
- `POST /api/todos/bulk` - Perform batch deletion, completion, or archiving (Private).
- `POST /api/todos/upload` - Upload file attachment returning filepath metadata (Private).
- `GET /api/todos/:id` - Fetch task by ID (Private).
- `PUT /api/todos/:id` - Update task parameters (Private).
- `DELETE /api/todos/:id` - Delete a task (Private).
- `POST /api/todos/:id/duplicate` - Duplicate a task (Private).
- `PATCH /api/todos/:id/status` - Update status field (Private).
- `PATCH /api/todos/:id/favorite` - Toggle favorite boolean (Private).
- `PATCH /api/todos/:id/archive` - Toggle archive/restore states (Private).

### Custom Categories Endpoints
- `GET /api/categories` - Fetch custom user categories (Private).
- `POST /api/categories` - Create custom category (Private).
- `DELETE /api/categories/:id` - Remove custom category (Private).

---

## Deployment Guide

### Backend (Render)
1. Create a Web Service on Render.
2. Link your Github Repository.
3. Configure settings:
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install && npm run build`
   - **Start Command:** `cd server && npm start`
4. Set environment variables on the Render Dashboard (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`).

### Frontend (Vercel)
1. Import project into Vercel.
2. Set configuration settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Configure environment variables (`VITE_API_URL` pointing to the deployed Render API, e.g., `https://your-api.onrender.com/api`).
4. Click **Deploy**.

---

## Future Improvements

1. **Subtask Reminders:** Notify user via Web Push API for individual subtask checklists.
2. **Calendar Sync:** Integrate calendar endpoints directly with Google Calendar or Apple Calendar API.
3. **Collaboration / Shared Workspaces:** Support shared categories, shared todos, and team comments.
