from pymongo import MongoClient
import certifi

MONGO_URI = "mongodb+srv://yehiarashed2004_db_user:PYQzkc2mUnCLesMW@cluster0.nykfh5s.mongodb.net/?appName=Cluster0"

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.sakina_db

def get_db():
    return db
