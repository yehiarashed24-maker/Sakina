import asyncio
import httpx
from app.config import settings

async def main():
    candidate_models = [
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-coder-32b-instruct:free",
        "openrouter/free",
        "google/gemini-2.0-pro-exp-02-05:free"
    ]
    
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Sakina AI RAG Backend",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        for model_name in candidate_models:
            payload = {
                "model": model_name,
                "messages": [{"role": "user", "content": "Hi"}],
                "temperature": 0.1,
                "max_tokens": 650
            }
            try:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                print(f"Model {model_name} status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(data["choices"][0]["message"]["content"])
                else:
                    print(response.text)
            except Exception as err:
                print(f"Model {model_name} failed: {err}")

asyncio.run(main())
