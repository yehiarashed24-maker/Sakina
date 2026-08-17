from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router

app = FastAPI(
    title="Sakina AI RAG Backend",
    description="Egyptian Arabic Mental Wellness AI Companion RAG Backend",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

@app.get("/")
def root():
    return {"status": "online", "message": "Sakina AI RAG Backend API is running"}
