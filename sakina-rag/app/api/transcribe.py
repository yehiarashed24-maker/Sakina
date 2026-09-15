from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import settings
import httpx
import base64

router = APIRouter(tags=["Transcribe"])

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio using Google Gemini multimodal audio transcription."""
    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        raw_mime = audio.content_type or "audio/webm"
        clean_mime = raw_mime.split(";")[0].strip().lower()
        if clean_mime in ["audio/x-m4a", "audio/m4a"]:
            clean_mime = "audio/mp4"

        gemini_key = settings.GEMINI_API_KEY
        if not gemini_key:
            raise HTTPException(status_code=500, detail="Gemini API key is not configured")

        prompt = (
            "You are an accurate real-time speech transcriber for a therapeutic AI companion. "
            "Transcribe the audio exactly as spoken by the user. "
            "Preserve Egyptian colloquial Arabic nuances, words, and phrasing accurately. "
            "If the user speaks English, transcribe in English. "
            "If the audio is silence, background noise, or contains no distinct spoken words, respond ONLY with 'NO_SPEECH'. "
            "Return ONLY the plain transcribed words. Do NOT add notes, quotes, or markdown."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": clean_mime,
                                "data": audio_b64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 1000
            }
        }

        # Priority list of audio-capable models
        models = [ "gemini-3.5-transcribe", "gemini-3.6-flash", "gemini-3.1-flash-lite",]

        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_name in models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                    resp = await client.post(url, json=payload)

                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                transcribed = parts[0].get("text", "").strip()
                                # Filter out silence signals
                                if transcribed in ["NO_SPEECH", "NO_SPEECH.", "SILENCE", "SILENCE.", "<SILENCE>", ""]:
                                    return {"text": ""}
                                return {"text": transcribed}
                        return {"text": ""}
                    else:
                        print(f"Transcribe {model_name} error: {resp.status_code} {resp.text[:200]}")
                except Exception as model_err:
                    print(f"Transcribe {model_name} exception: {model_err}")
                    continue

        raise HTTPException(status_code=502, detail="Audio transcription service failed")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Transcribe endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
