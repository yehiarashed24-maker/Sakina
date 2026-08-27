# 🌸 Sakina AI (سكينة)
> **An Intelligent AI Psychological & Emotional Wellness Companion**  
> رفيق ذكاء اصطناعي متخصص في الصحة النفسية، الدعم العاطفي، والمكالمات الصوتية الحية.

---

## 🌟 Overview (نظرة عامة)
**Sakina AI** is a mental wellness platform that combines advanced psychological retrieval-augmented generation (RAG), empathetic conversational intelligence, and a full-viewport cinematic voice call experience (`/talk`).

### Key Features:
1. **🎙️ Cinematic Voice Call (`/talk`)**:
   - Real-time speech recognition (supports Arabic & English).
   - Natural female voice synthesis calibrated for gentle, therapeutic empathy.
   - Dynamic Web Audio reactive visualizer with low CPU/battery footprint.
   - Speech interruption (`✋ مقاطعة`) and manual submission (`✓ خلصت كلام`).
   - High-contrast realtime dialogue console.
2. **🔒 Protected Therapy Session (`/chat`)**:
   - Private, secure therapy sessions protected by Google Sign-In Auth Gate.
   - Grounded psychological knowledge using RAG vector search over curated PDFs.
   - Dynamic mood analysis and conversation history.
   - Strict guardrails against non-psychological topics with warm Egyptian/Arabic greeting handling.
3. **🎬 Cinematic About & Presentation Page (`/about`)**:
   - HD streaming video presentations powered by Mux.
   - Smooth mouse wheel scrolling, mobile swipe gestures, and floating arrow navigation.
4. **⚡ Single-Port Unified Architecture**:
   - FastAPI serves both the built React SPA and API endpoints under a single port (`http://localhost:8000`), eliminating CORS issues in production and local development.

---

## 🚀 Quick Start (دليل التشغيل السريع)

### 1. Prerequisites (المتطلبات)
- **Node.js**: `v18.0.0` or higher
- **Python**: `3.10` or higher
- **npm** or **yarn**

---

### 2. Installation (تثبيت الحزم)

#### Step A: Clone the Repository
```bash
git clone https://github.com/yehiarashed24-maker/Sakina.git
cd Sakina
```

#### Step B: Install & Build Frontend
```bash
npm install
npm run build
```

#### Step C: Set Up Python Backend Environment
```bash
cd sakina-rag
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

### 3. Environment Variables (إعداد المتغيرات)
Create your `.env` file in the `sakina-rag/` directory:
```bash
cp .env.example .env
```
Open `sakina-rag/.env` and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
BACKEND_URL=http://localhost:8000
```
*(Note: If Gemini API quota is exhausted, the system automatically falls back to OpenRouter free models).*

---

### 4. Run the Project (تشغيل المشروع)
Run the unified FastAPI server from the `sakina-rag` directory:
```bash
cd sakina-rag
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser and navigate to:
- **Home Page**: [http://localhost:8000](http://localhost:8000)
- **Therapy Session**: [http://localhost:8000/chat](http://localhost:8000/chat)
- **Voice Call (Talk)**: [http://localhost:8000/talk](http://localhost:8000/talk)
- **About Page**: [http://localhost:8000/about](http://localhost:8000/about)

---

## 📂 Project Structure (هيكلية المشروع)
```
sakinaia/
├── index.html                   # HTML entry with Cairo Google Fonts preconnect
├── package.json                 # Frontend dependencies (React 19, Vite, Tailwind v4)
├── vite.config.ts               # Vite configuration
├── src/
│   ├── App.tsx                  # React Router routes (/ , /chat, /talk, /about, /pricing)
│   ├── components/
│   │   ├── HeroSection.tsx      # Landing hero with Enter Therapy Session CTA
│   │   ├── ChatPage.tsx         # Google Sign-In Auth Gate & Session container
│   │   ├── talk/                # Sakina Voice Call Interface & Robot Entity
│   │   │   ├── SakinaTalkView.tsx
│   │   │   └── SakinaRobotEntity.tsx
│   │   └── chat/                # Text chat, Message bubbles, Sidebar, Mood tracker
│   ├── context/
│   │   ├── ChatContext.tsx      # Conversation state & backend history sync
│   │   └── LanguageContext.tsx  # Arabic/English translations & RTL support
│   ├── hooks/
│   │   ├── useVoiceSession.ts   # Web Speech recognition, Female TTS & Audio Analyser
│   │   └── useVoice.ts          # Speech synthesis utility for chat bubbles
│   └── pages/
│       ├── AboutPage.tsx        # Wheel & swipe cinematic presentation
│       ├── PricingPage.tsx
│       └── ContactPage.tsx
└── sakina-rag/                  # Python FastAPI Backend
    ├── requirements.txt         # FastAPI, Uvicorn, Sentence-Transformers, ChromaDB
    ├── app/
    │   ├── main.py              # Single-port SPA server & Security CSP headers
    │   ├── prompts/
    │   │   └── sakina_prompt.py # Sakina female persona & Egyptian greeting rules
    │   ├── llm/
    │   │   └── openrouter.py    # Multi-model fallback (Gemini + OpenRouter)
    │   ├── api/                 # Endpoints (/api/chat, /api/auth, /api/history)
    │   └── vectorstore/         # Local vector store & ChromaDB retrieval
    └── knowledge/pdfs/          # Medical mental health PDF documents
```

---

## 🔒 Security & Privacy (الأمان والخصوصية)
- All conversations are private and secured.
- Strict Content Security Policy (CSP) protects streaming media and authentication frames.
- Sensitive environment files (`.env`, `.venv`) are strictly excluded from git tracking.
