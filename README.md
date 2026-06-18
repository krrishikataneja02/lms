# AI-Powered Learning Management System

A full-stack MERN application that provides a role-based Learning Management System with an integrated Google Gemini AI Tutor. Built for schools and institutions, it supports three distinct roles — Admin, Faculty, and Student — each with their own dashboard and feature set.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| AI Integration | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Dev Tooling | Nodemon, Concurrently, ESLint |

---

## Features

### Role-Based Access Control
Three roles are supported — `admin`, `faculty`, and `student` — each gated by JWT middleware.

### Admin
- Manage all users (create, view, delete)
- Manage courses across the institution
- Configure system settings including the Gemini API key

### Faculty
- Create and manage courses with module content
- Post assignments and grade student submissions
- Track student attendance
- Create and manage quizzes

### Student
- Browse and access enrolled courses
- Submit assignments and view grades
- Take quizzes with attempt tracking
- Access the **AI Tutor** — an interactive chat powered by Google Gemini that can explain concepts, generate MCQ quizzes (rendered as interactive widgets), summarize uploaded documents, and create study plans

### AI Tutor (Offline Mode)
If no Gemini API key is configured, the tutor falls back to a built-in offline mode with canned responses for common topics (binary search, graph theory MCQs, document summaries, study plans).

---

## Project Structure

```
lms-bhavya/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── seed.js            # Database seeder
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT auth + role guards
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Assignment.js
│   │   ├── Submission.js
│   │   ├── Quiz.js
│   │   ├── Attempt.js
│   │   ├── Attendance.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── assignmentRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── attendanceRoutes.js
│   │   └── aiRoutes.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Header, Sidebar, Modal
│   │   ├── context/           # AuthContext (global auth state)
│   │   ├── pages/             # Role-specific page components
│   │   ├── utils/             # Axios API helper, toast notifications
│   │   ├── App.jsx            # Routing
│   │   └── main.jsx
│   └── package.json
└── package.json               # Root scripts (runs both servers)
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally on `mongodb://127.0.0.1:27017` (or a MongoDB Atlas URI)

### Installation

Clone the repo and install all dependencies in one command:

```bash
git clone <repo-url>
cd lms-bhavya
npm run install-all
```

This installs dependencies for the root, backend, and frontend simultaneously.

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/aegis_lms
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_google_gemini_api_key   # optional; can be set via Admin UI
PORT=5000
```

### Running the App

```bash
# Run both backend and frontend concurrently
npm run dev

# Or run separately
npm run server    # backend on :5000
npm run client    # frontend on :5173
```

### Seeding the Database

The database is seeded **automatically** on first run if no users exist. To manually re-seed:

```bash
npm run seed --prefix backend
```

---

## Default Credentials

After seeding, these accounts are ready to use:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@school.edu` | `admin123` |
| Faculty | `prof.smith@school.edu` | `faculty123` |
| Student | `alex.jones@school.edu` | `student123` |

> **Note:** Change these credentials before deploying to production.

---

## API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/login` | Login and receive JWT | Public |
| POST | `/api/auth/register` | Register new user | Admin |
| GET | `/api/courses` | List all courses | Private |
| POST | `/api/courses` | Create a course | Faculty/Admin |
| GET | `/api/assignments` | List assignments | Private |
| POST | `/api/assignments` | Create assignment | Faculty |
| POST | `/api/assignments/:id/submit` | Submit assignment | Student |
| GET | `/api/quizzes` | List quizzes | Private |
| POST | `/api/quizzes/:id/attempt` | Submit quiz attempt | Student |
| GET | `/api/attendance` | View attendance | Private |
| POST | `/api/attendance` | Mark attendance | Faculty |
| POST | `/api/ai/chat` | Chat with AI Tutor | Private |

---

## Configuring the AI Tutor

1. Log in as Admin
2. Navigate to **System Settings**
3. Paste your [Google Gemini API key](https://aistudio.google.com/app/apikey)
4. Save — the AI Tutor will immediately use live Gemini responses

Without a key, the tutor runs in offline fallback mode with pre-built responses.

---

## License

This project is for educational and demonstration purposes.
