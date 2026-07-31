# 📊 Project Management System

### *"Streamline Your Projects, Empower Your Team"*

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

A full-featured **Project Management System** built with the MERN stack (MongoDB, Express.js, React, Node.js). This application helps teams collaborate effectively with features like task tracking, sprint management, time logging, and real-time notifications.

> **"From Planning to Delivery - All in One Place"**

---

## 🎯 Features

### Core Features
- ✅ **User Authentication** - JWT-based secure login/registration with role-based access
- ✅ **Project Management** - Create, update, archive projects with team assignments
- ✅ **Task Tracking** - Kanban board with drag-and-drop (Backlog → Todo → In Progress → Review → Done)
- ✅ **Sprint Planning** - Agile sprint management with goal tracking
- ✅ **Time Logging** - Track hours spent on tasks with detailed reports
- ✅ **Real-time Updates** - Socket.io for live notifications and task updates
- ✅ **File Attachments** - Upload and manage files with Multer
- ✅ **Advanced Filtering** - Search, filter, and sort tasks/projects
- ✅ **Role-Based Access** - Admin, Project Manager, Team Member, Viewer

### User Roles
| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, project deletion |
| **Project Manager** | Create/edit projects, assign tasks, manage sprints |
| **Team Member** | Update own tasks, log time, add comments |
| **Viewer** | Read-only access to projects and tasks |

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Socket.io** - Real-time communication
- **Multer** - File uploads
- **Joi** - Input validation

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Query** - Data fetching
- **React Router** - Navigation
- **Zustand** - State management

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/project-management-system.git
cd project-management-system
```

2. **Install backend dependencies**

```
cd backend
npm install
```

3. **Install frontend dependencies**

```
cd ../frontend
npm install
```

4. **Set up environment variables**

```
cd ../backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

5. **Start MongoDB**

```
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use MongoDB Atlas (cloud)
```

6. **Run the application**

```
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

7. **Access the application**

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

## 📚 API Documentation

### Authentication Endpoints

| Method ↕▾ | Endpoint ↕▾ | Description ↕▾ |
|---|---|---|
| −POST | `/api/auth/register` | Register new user |
| −POST | `/api/auth/login` | Login with JWT |
| −GET | `/api/auth/me` | Get current user |
| −PUT | `/api/auth/profile` | Update profile |
⚙

### Project Endpoints

| Method ↕▾ | Endpoint ↕▾ | Description ↕▾ |
|---|---|---|
| −GET | `/api/projects` | List all projects |
| −POST | `/api/projects` | Create project |
| −GET | `/api/projects/:id` | Get project details |
| −PUT | `/api/projects/:id` | Update project |
| −DELETE | `/api/projects/:id` | Archive project |
| −POST | `/api/projects/:id/team` | Add team member |
| −DELETE | `/api/projects/:id/team/:userId` | Remove team member |
⚙

### Task Endpoints

| Method ↕▾ | Endpoint ↕▾ | Description ↕▾ |
|---|---|---|
| −GET | `/api/projects/:projectId/tasks` | List tasks |
| −POST | `/api/projects/:projectId/tasks` | Create task |
| −GET | `/api/tasks/:id` | Get task details |
| −PUT | `/api/tasks/:id` | Update task |
| −DELETE | `/api/tasks/:id` | Delete task |
| −PATCH | `/api/tasks/:id/status` | Update status |
| −POST | `/api/tasks/:id/comments` | Add comment |
| −PUT | `/api/tasks/:id/assign` | Assign task |
⚙

### Sprint Endpoints

| Method ↕▾ | Endpoint ↕▾ | Description ↕▾ |
|---|---|---|
| −GET | `/api/projects/:projectId/sprints` | List sprints |
| −POST | `/api/projects/:projectId/sprints` | Create sprint |
| −PUT | `/api/sprints/:id` | Update sprint |
| −POST | `/api/sprints/:id/tasks` | Add task to sprint |
⚙

---

## 📊 Database Schema

### Users Collection

```
{
  username: String (unique, required),
  email: String (unique, required),
  password_hash: String (required),
  role: String (admin, project_manager, team_member, viewer),
  profile: {
    fullName: String,
    avatar: String,
    bio: String,
    department: String
  },
  preferences: {
    notifications: Boolean,
    theme: String,
    language: String
  },
  created_at: Date,
  updated_at: Date
}
```

### Projects Collection

```
{
  name: String (required),
  description: String,
  project_key: String (unique, auto-generated),
  owner: ObjectId (ref: User),
  team_members: [ObjectId (ref: User)],
  status: String (planning, active, on_hold, completed, archived),
  priority: String (low, medium, high, critical),
  start_date: Date,
  end_date: Date,
  budget: Number,
  tags: [String],
  created_at: Date,
  updated_at: Date
}
```

### Tasks Collection

```
{
  title: String (required),
  description: String,
  task_key: String (unique),
  project: ObjectId (ref: Project),
  assignee: ObjectId (ref: User),
  reporter: ObjectId (ref: User),
  status: String (backlog, todo, in_progress, review, done),
  priority: String (low, medium, high, critical),
  story_points: Number,
  due_date: Date,
  estimated_hours: Number,
  actual_hours: Number,
  parent_task: ObjectId (ref: Task),
  dependencies: [ObjectId (ref: Task)],
  attachments: [{
    name: String,
    url: String,
    uploaded_by: ObjectId,
    uploaded_at: Date
  }],
  comments: [{
    user: ObjectId,
    content: String,
    created_at: Date,
    attachments: [String]
  }],
  labels: [String],
  created_at: Date,
  updated_at: Date
}
```

---

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/project_management

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Client
CLIENT_URL=http://localhost:3000

# File Upload
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Redis (optional for rate limiting)
REDIS_URL=redis://localhost:6379
```

---

## 🚢 Deployment

### Docker Deployment

1. **Build and run with Docker Compose**

```
docker-compose up -d
```

2. **Access the application**

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:5000](http://localhost:5000)
- MongoDB: mongodb://localhost:27017

### Production Build

```
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

### Deployment Checklist

- □  
Set `NODE_ENV=production`
- □  
Use MongoDB Atlas for database
- □  
Configure SSL certificate
- □  
Set up monitoring (LogRocket, Sentry)
- □  
Configure backup strategy
- □  
Set up CI/CD pipeline

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://LICENSE) file for details.

---

## 🙏 Acknowledgments

- **MongoDB** - NoSQL database
- **Express.js** - Backend framework
- **React** - Frontend library
- **Node.js** - Runtime environment
- **[Socket.io](https://Socket.io)** - Real-time communication
- **Tailwind CSS** - UI styling

---

**📊 Project Management System**
*"Streamline Your Projects, Empower Your Team"*

---
<div align="center">
  <p>Made with ❤️ by the Development Team</p>
  <p>
    <img src="https://img.shields.io/badge/Node.js-18%2B-green" alt="Node.js">
    <img src="https://img.shields.io/badge/MongoDB-6.0-brightgreen" alt="MongoDB">
    <img src="https://img.shields.io/badge/React-18-blue" alt="React">
    <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  </p>
</div>
