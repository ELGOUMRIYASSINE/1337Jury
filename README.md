# 1337Jury - Project Overview

## 🚀 Platform Name: **1337Jury**

A collaborative platform for 42/1337 students navigating the new Python common core.

---

## 💡 Project Idea

**1337Jury** is a community-driven platform where 42/1337 students can:

1. **Resolve Subject Ambiguities** - When the project subject is unclear, students can create a vote to clarify what's allowed or not. The community votes, but **staff decisions are FINAL**.

2. **Settle Correction Disputes** - During peer evaluations, disagreements happen. Students can report disputes where the community votes for either the corrector or corrected. **Staff can override any decision**.

3. **Share Learning Resources** - A hub where students share tutorials, documentation, videos, and articles with upvote/downvote system.

4. **Share Test Cases** - Repository of community-contributed tests with staff approval system.

---

## 🎯 Key Feature: Staff Override

The unique value proposition of 1337Jury:
- When a **staff member** makes a decision on any vote or dispute
- The decision is **immediately FINAL**
- Even if 100 students voted differently, staff wins
- This ensures official rulings are respected

---

## 👥 Team Roles & Responsibilities

| Developer | Role | Responsibilities | Time |
|-----------|------|------------------|------|
| **YASSINE** | Backend Dev 3 (Database) | Supabase setup, create all tables, seed data | 4-6h |
| **ADMIRAL** | Backend Dev 1 | Auth, Users, Voting, Disputes API | 11-16h |
| **ZERO** | Backend Dev 2 | Resources, Tests API | 9-12h |
| **FATYZA** | Frontend Dev | Complete React UI | 13-16h |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + Vite + TailwindCSS |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | 42 OAuth API |

---

## 🔄 Development Order

```
1. YASSINE: Database Setup (START FIRST - others depend on this!)
   ↓
2. ADMIRAL: Auth & Users (needs DB connection)
   ↓
3. ADMIRAL: Voting & Disputes (after auth works)
   ZERO: Resources & Tests (can work in parallel)
   ↓
4. FATYZA: Frontend (can start with mock data, integrate when APIs ready)
```

---

## 🚦 How To Run

### 1. Database (YASSINE)
```bash
# Go to https://supabase.com
# Create new project "1337jury"
# Run database/init.sql in SQL Editor
# Share connection string with team
```

### 2. Backend (ADMIRAL & ZERO)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with DB credentials from YASSINE
uvicorn app.main:app --reload
```

### 3. Frontend (FATYZA)
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
1337Jury/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── config.py         # Environment config
│   │   ├── database.py       # DB connection
│   │   ├── api/routes/       # API endpoints
│   │   ├── models/           # SQLAlchemy models
│   │   ├── services/         # Business logic
│   │   └── middleware/       # Auth middleware
│   ├── requirements.txt
│   └── .env.example
├── database/
│   └── init.sql              # Database schema
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # Reusable components
│   │   ├── store/            # Zustand stores
│   │   └── services/         # API calls
│   └── package.json
└── README.md
```

---

## 🗄️ Database Tables (10 total)

1. `users` - 42 user accounts
2. `projects` - Python common core projects
3. `resources` - Learning materials
4. `resource_votes` - Upvotes/downvotes
5. `tests` - Test cases
6. `subject_votes` - Clarification questions
7. `vote_options` - Answer options
8. `user_votes` - User's answers
9. `disputes` - Correction disagreements
10. `dispute_votes` - Dispute votes

---

## 📋 Core Features

### 1. 🔐 Authentication
- Login with 42 OAuth
- Student vs Staff roles

### 2. 📚 Resources Hub
- Share learning materials
- Upvote/downvote system

### 3. 🗳️ Subject Votes
- Ask clarification questions
- Community votes on answers
- **Staff Override**: Staff decision is FINAL

### 4. ⚡ Live Disputes
- Real-time correction disagreements
- Vote for corrector or corrected
- **Staff Override**: Staff decision is FINAL

### 5. 🧪 Tests Repository
- Share test cases
- Download counter
- Staff approval system

---

Good luck team! 🏆
