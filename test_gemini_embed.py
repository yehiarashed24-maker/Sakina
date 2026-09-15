import requests
import os

key = os.environ.get("GEMINI_API_KEY", "").strip()
if not key:
    raise SystemExit("GEMINI_API_KEY is not configured")

model = os.environ.get("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={key}"
resp = requests.post(
    url,
    json={"model": f"models/{model}", "content": {"parts": [{"text": "Hello world"}]}},
    timeout=20,
)
resp.raise_for_status()
print(resp.status_code)
print(len(resp.json()['embedding']['values']))
