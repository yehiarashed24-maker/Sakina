from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import settings
import httpx
import base64

router = APIRouter(tags=["Transcribe"])

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio using Gemini via OpenAI-compatible endpoint."""
    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        mime_type = audio.content_type or "audio/webm"

        gemini_key = settings.GEMINI_API_KEY

        # Use the same OpenAI-compatible endpoint that works in openrouter.py
        payload = {
            "model": "gemini-1.5-flash",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Transcribe the audio exactly as spoken. Return ONLY the transcribed text, no explanations. Keep the original language (Arabic or English)."
                        },
                        {
                            "type": "image_url",  # Gemini treats audio as inline data this way
                            "image_url": {
                                "url": f"data:{mime_type};base64,{audio_b64}"
                            }
                        }
                    ]
                }
            ],
            "temperature": 0,
            "max_tokens": 500
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                headers={
                    "Authorization": f"Bearer {gemini_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )

        print(f"Gemini transcribe: {resp.status_code}")

        if resp.status_code == 200:
            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            return {"text": text}

        print(f"Gemini error: {resp.text[:300]}")

        # Fallback: try OpenRouter
        openrouter_key = settings.OPENROUTER_API_KEY
        payload2 = {
            "model": "google/gemini-flash-1.5",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Transcribe the audio exactly as spoken. Return ONLY the transcribed text. Keep the original language (Arabic or English)."},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{audio_b64}"}}
                    ]
                }
            ],
            "temperature": 0,
            "max_tokens": 500
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp2 = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json"
                },
                json=payload2
            )

        print(f"OpenRouter transcribe: {resp2.status_code}")
        if resp2.status_code == 200:
            data2 = resp2.json()
            text2 = data2["choices"][0]["message"]["content"].strip()
            return {"text": text2}

        raise HTTPException(status_code=502, detail="Both transcription services failed")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Transcribe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
