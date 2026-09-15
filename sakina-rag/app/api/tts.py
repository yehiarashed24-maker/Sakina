from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
import edge_tts
import logging

router = APIRouter(tags=["TTS"])
logger = logging.getLogger(__name__)

@router.get("/tts")
async def get_tts(text: str = Query(..., description="Text to synthesize"), lang: str = Query("ar", description="Language code (ar or en)")):
    """Stream high-quality neural TTS audio."""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    voice = "ar-EG-SalmaNeural" if lang == "ar" else "en-US-AriaNeural"
    
    async def audio_stream():
        try:
            communicate = edge_tts.Communicate(text, voice)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except Exception as e:
            logger.error(f"TTS Streaming Error: {e}")
            # If an error happens midway, it'll close the stream

    return StreamingResponse(audio_stream(), media_type="audio/mp3")
