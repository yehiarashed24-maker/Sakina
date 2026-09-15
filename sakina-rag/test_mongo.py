import sys
import os
from pymongo import MongoClient
import certifi

MONGO_URI = os.environ.get("MONGO_URI", "").strip()
if not MONGO_URI:
    raise SystemExit("MONGO_URI is not configured")

try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
