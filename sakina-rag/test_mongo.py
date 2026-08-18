import sys
from pymongo import MongoClient
import certifi

MONGO_URI = "mongodb+srv://yehiarashed2004_db_user:PYQzkc2mUnCLesMW@cluster0.nykfh5s.mongodb.net/?appName=Cluster0"

try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
