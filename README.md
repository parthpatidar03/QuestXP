# QuestXP

> **Learning platform first, game second.** QuestXP turns any YouTube playlist into a structured, gamified course — with XP, streaks, AI-generated notes, interactive quizzes, and a contextual Doubt Chatbot.

**Built by Parth Patidar**

---

### 🚀 [Try it out live on Vercel!](https://quest-xp-beta.vercel.app/)

---

## 🌟 Core Features

- **📺 YouTube to Course Conversion:** Paste any YouTube playlist link and QuestXP automatically extracts lecture metadata, thumbnails, and transcripts to build a structured curriculum.
- **🏆 Deep Gamification Engine:** Earn XP for watching lectures, completing quizzes, and maintaining daily streaks. Level up to unlock new platform features (like the AI Chatbot and Study Plans).
- **📝 AI-Generated Study Materials:** Automatically generates concise summaries, key takeaways, and practice quizzes from lecture transcripts using OpenAI GPT models.
- **🤖 Contextual Doubt Chatbot:** An integrated AI tutor that understands exactly which course and lecture you are currently watching to provide highly relevant answers.
- **📅 Smart Study Planner:** Generates an adaptive learning schedule based on your weekly availability and course length.

---

## 🛠️ Technical Architecture

QuestXP is built on a modern, robust, and scalable stack designed to handle heavy background processing for AI generations and transcript extraction.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS (Minimalist Study Theme), Framer Motion, Zustand |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Queue / Cache** | Redis, BullMQ |
| **Authentication**| JWT (HttpOnly cookies), Google OAuth 2.0 |
| **AI & APIs** | OpenAI (GPT-4o-mini, text-embeddings), `youtube-transcript` |

### System Diagram

```mermaid
graph TD
    subgraph Frontend [Frontend Interface]
        React[React / Vite App]
        Zustand[Zustand State Store]
        Tailwind[Tailwind CSS UI]
        React --> Zustand
        React --> Tailwind
    end

    subgraph Backend [Node.js Backend API]
        Express[Express Router]
        Auth[Auth & JWT Middleware]
        Controllers[API Controllers]
        Express --> Auth
        Auth --> Controllers
    end

    subgraph Data & Queue Layer [Infrastructure]
        Mongo[(MongoDB)]
        Redis[(Redis)]
        BullMQ[BullMQ Worker Processes]
    end

    subgraph External APIs
        OpenAI[OpenAI API]
        YouTube[YouTube Transcript API]
        GoogleAuth[Google Auth API]
    end

    %% Connections
    React <==> |REST / JSON| Express
    React --> |OAuth Login| GoogleAuth
    
    Controllers <==> |Read/Write| Mongo
    Controllers --> |Enqueue Jobs| Redis
    
    Redis <--> |Take Jobs| BullMQ
    BullMQ <==> |Update Status| Mongo
    
    BullMQ --> |Fetch Transcripts| YouTube
    BullMQ --> |Generate Quizzes/Notes| OpenAI
    Controllers --> |Chatbot Queries| OpenAI
```

---

## 🚀 How It Works (The Course Processing Pipeline)

Because extracting transcripts and generating AI content takes time, QuestXP utilizes an asynchronous event-driven architecture.

```mermaid
sequenceDiagram
    participant User
    participant API as Backend API
    participant Queue as Redis (BullMQ)
    participant Worker as Background Workers
    participant External as YouTube / OpenAI

    User->>API: POST /api/courses (Playlist URL)
    API->>Database: Save Course (Status: "processing")
    API->>Queue: Enqueue CourseProcessor Job
    API-->>User: HTTP 201 (Course Created)
    
    Note over User,API: User sees "Processing" loading state
    
    Queue->>Worker: Consume Job
    Worker->>External: Fetch Playlist Details & Videos
    Worker->>External: Extract Video Transcripts
    Worker->>Database: Save Lectures & Transcripts
    Worker->>Queue: Enqueue AIGeneration Jobs (Notes/Quizzes)
    
    Worker->>Database: Update Course Status to "ready"
    
    User->>API: Polls /status Endpoint
    API-->>User: Status: "ready" (UI updates)
```

---

## 🎮 Gamification Mechanics

The entire learning experience revolves around progression and rewards. 

| Action | XP Reward |
|---------|----|
| Start a lecture | `+5 XP` |
| Complete a lecture (≥ 80% watched) | `+30 XP` |
| Maintain a daily streak | `+20 XP` |
| Pass a practice quiz | `+40 XP` |
| Ace a practice quiz (100%) | `+75 XP` |
| Meet daily UI goal | `+50 XP` |

**Feature Gating System:**
- Users start at **Level 1**.
- **Level 2** unlocks the AI Doubt Chatbot.
- **Level 3** unlocks AI Practice Quizzes.
- **Level 4** unlocks the Adaptive Study Planner.

---

## 🐳 Running the App (Docker Setup)

QuestXP is fully containerized. The easiest way to get the entire stack (MongoDB, Redis, Backend API, and Frontend SPA) running is using **Docker Compose**.

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
- **API Keys**: OpenAI API Key, Google OAuth Client ID & Secret.

### 2. Environment Variables Setup
Create a `.env` file in the `backend/` directory:

```env
# backend/.env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/questxp
REDIS_URL=redis://redis:6379
JWT_SECRET=your_super_secret_jwt_key

# External APIs
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:8080
```

Create a `.env` file in the `frontend/` directory to point to the dockerized backend:
```env
# frontend/.env
VITE_API_URL=http://localhost:5002/api
```

### 3. Build and Start the Stack
From the root of the project, run:
```bash
docker-compose up --build -d
```
Docker will automatically pull the required images, build the Node.js API, compile the React SPA into static Nginx files, and start all services in the correct order.

### 4. Access the Platform (Local)
- **Frontend App:** http://localhost:8080
- **Backend API:** http://localhost:5002

### 🌐 Production URLs
- **Live Demo:** [https://quest-xp-beta.vercel.app/](https://quest-xp-beta.vercel.app/)
- **Production Backend:** `https://questxp-production.up.railway.app/api`

---

## 💻 Alternative: Manual Setup (No Docker)

<details>
<summary>Click to expand manual setup instructions</summary>

**1. Prerequisites**
- **Node.js** (v18+)
- Local or Cloud instances of **MongoDB** and **Redis**

**2. Installation**
```bash
# Install Backend
cd backend && npm install

# Install Frontend
cd ../frontend && npm install
```

**3. Environment Variables**
**Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/questxp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=http://localhost:5173
```
**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

**4. Running the App**
Open two terminal instances:
```bash
# Terminal 1: Backend
cd backend
npm run dev
```
```bash
# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **http://localhost:5173** in your browser.
</details>

---

## 📄 License
MIT License. Created by **Parth Patidar**.
