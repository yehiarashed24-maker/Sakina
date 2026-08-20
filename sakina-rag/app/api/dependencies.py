from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.database import Database
from bson.objectid import ObjectId
import jwt
from ..database import get_db
from .auth import JWT_SECRET, ALGORITHM

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Database = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError as e:
        print(f"JWT Decode Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    from bson.errors import InvalidId
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except InvalidId:
        raise HTTPException(status_code=401, detail="Invalid token format")
    except Exception as e:
        print(f"MongoDB Find Error: {e}")
        raise HTTPException(status_code=503, detail="Database connection error")

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    user["id"] = str(user["_id"])
    return user
