from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.auth import router as auth_router
from app.api.history import router as history_router
from app.api.transcribe import router as transcribe_router
from fastapi.staticfiles import StaticFiles
import os

from slowapi import _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter

app = FastAPI(
    title="Sakina AI RAG Backend",
    description="Egyptian Arabic Mental Wellness AI Companion RAG Backend",
    version="1.0.0"
)

# Setup Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "microphone=*, camera=(), geolocation=()"
    
    # Content Security Policy (CSP)
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://accounts.google.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "media-src 'self' blob: https://stream.mux.com https://*.cloudfront.net; "
        "connect-src 'self' https://formspree.io https://accounts.google.com; "
        "frame-src https://accounts.google.com;"
    )
    response.headers["Content-Security-Policy"] = csp
    return response

# Configure Restricted CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(transcribe_router, prefix="/api")

# Serve PDFs directory from the raw data folder
pdf_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "raw")
if os.path.exists(pdf_dir):
    app.mount("/pdfs", StaticFiles(directory=pdf_dir), name="pdfs")

@app.get("/api")
@limiter.limit("5/minute")
def root(request: Request):
    return {"status": "online", "message": "Sakina AI Secure Backend API is running"}

# Serve frontend build (Single Page Application)
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dist")

if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")
    
    # Static files at root of dist (e.g., vite.svg, etc)
    @app.get("/{file_name:path}")
    async def serve_static_root(file_name: str):
        from fastapi.responses import FileResponse
        file_path = os.path.join(frontend_dir, file_name)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Fallback to index.html for SPA routing
        return FileResponse(os.path.join(frontend_dir, "index.html"))
else:
    print(f"Warning: Frontend build directory not found at {frontend_dir}")
