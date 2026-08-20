import requests

url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
resp = requests.post(url, json={"inputs": ["Hello world"]})
print(resp.status_code)
if resp.status_code == 200:
    print(len(resp.json()[0]))
else:
    print(resp.text)
