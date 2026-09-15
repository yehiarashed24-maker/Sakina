from pymongo import MongoClient
import certifi
from app.config import settings

client = None
db = None

def get_db():
    global client, db
    if db is None:
        if not settings.MONGO_URI.strip():
            raise RuntimeError("MONGO_URI is not configured")
        client = MongoClient(settings.MONGO_URI, tlsCAFile=certifi.where())
        db = client.sakina_db
    return db
