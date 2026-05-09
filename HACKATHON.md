# QuestXP: The AI-Powered Learning RPG
**Turning Passive Content into Active Mastery**

## 🚀 FlowZint AI Hackathon 2026 Submission

### 1. Innovation & Creativity
QuestXP isn't just a chatbot; it's an **Autonomous Educational Ecosystem**. While other apps just summarize videos, QuestXP creates a living, breathing course. 
- **The "Recalculating" Planner**: The first study planner that acts like Google Maps for your brain. If you miss a study session, the AI automatically recalculates your entire roadmap to keep your deadline realistic without the guilt.
- **Gamified RPG Layer**: We’ve integrated a full RPG engine (XP, Levels, Streaks, Badges) directly into the learning pipeline, turning the "chore" of studying into a quest for glory.

### 2. Real-World Problem Solving
**The Problem**: "Tutorial Hell." Millions of students watch educational YouTube videos but forget 90% of the content because of passive consumption and lack of practice.
**The Solution**: QuestXP forces active engagement. By instantly turning any playlist into a structured curriculum with:
- **Auto-Quizzing**: Validating knowledge immediately after watching.
- **RAG-Powered Doubt Bot**: A 24/7 tutor that knows the exact context of the video you just watched.
- **Interactive Notes**: AI-distilled insights that link directly to key moments in the video.

### 3. Technical Architecture (The "Power" Layer)
Built for extreme scalability and reliability:
- **Distributed Worker Pipeline**: Uses **BullMQ & Redis** to handle heavy AI tasks (Transcription, Embeddings, Summarization) in the background. This ensures the main UI is always 100% lag-free.
- **Multi-Model Intelligence**: Primary processing via **Gemini 1.5 Flash** for speed, with an automatic failover to **OpenRouter (Llama 3.2)** for maximum uptime.
- **Vectorized Knowledge**: Uses **Pinecone** to index lecture transcripts, enabling high-precision RAG (Retrieval-Augmented Generation) for the chatbot.
- **State-of-the-Art Security**: Role-Based Access Control (RBAC), JWT session rotation, and strict NoSQL injection guards.

### 4. Technical Stack
- **Frontend**: React.js, TailwindCSS (Plus Jakarta Sans & Outfit Typography)
- **Backend**: Node.js, Express, MongoDB (Atlas)
- **Caching/Queue**: Redis
- **AI/LLM**: Google Generative AI (Gemini), OpenRouter
- **Vector DB**: Pinecone
- **Deployment**: Vercel (Frontend), Railway (Backend)

---

## 🛠️ How to Judge QuestXP
1. **Paste a YouTube Playlist**: Watch the AI Workers spin up and build your course in real-time.
2. **Set a Deadline**: Create a study plan and watch the AI calculate your daily targets.
3. **Ask the Bot**: Question the AI about a specific timestamp in the video—it knows the answer.
4. **Level Up**: Take a quiz, get a perfect score, and watch your XP bar climb.

---
**Proof of Usefulness**: QuestXP transforms YouTube from an entertainment site into a personalized university.
