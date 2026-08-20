import requests
import os
key = "AQ.Ab8RN6IJu-ehdSInfdiXukBliLoIl4ewcTpC6RolvCbnch3JCw"
url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={key}"
resp = requests.post(url, json={"model": "models/text-embedding-004", "content": {"parts": [{"text": "Hello world"}]}})
print(resp.status_code)
print(len(resp.json()['embedding']['values']))
