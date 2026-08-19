from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.auth import router as auth_router
from app.api.history import router as history_router
from app.api.transcribe import router as transcribe_router
from fastapi.staticfiles import StaticFiles
import os

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
app.include_router(auth_router)
app.include_router(history_router)
app.include_router(transcribe_router)

# Serve PDFs directory
pdf_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge", "pdfs")
if os.path.exists(pdf_dir):
    app.mount("/pdfs", StaticFiles(directory=pdf_dir), name="pdfs")

@app.get("/")
def root():
    return {"status": "online", "message": "Sakina AI RAG Backend API is running"}
