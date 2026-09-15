from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pymongo.database import Database
import jwt
from datetime import datetime, timedelta

from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
JWT_SECRET = settings.JWT_SECRET
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

class GoogleLoginRequest(BaseModel):
    credential: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict = None

def create_access_token(data: dict):
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured")
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/google", response_model=TokenResponse)
def google_auth(request: GoogleLoginRequest, db: Database = Depends(get_db)):
    import requests as req
    try:
        # Verify Google access token by fetching user info
        user_info_response = req.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {request.credential}"},
            timeout=10,
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
            
        idinfo = user_info_response.json()
        
        google_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        user = db.users.find_one({"google_id": google_id})
        if not user:
            new_user = {
                "google_id": google_id,
                "email": email,
                "name": name,
                "picture": picture,
                "created_at": datetime.utcnow()
            }
            res = db.users.insert_one(new_user)
            user_id = str(res.inserted_id)
        else:
            user_id = str(user["_id"])
            name = user.get("name", name)
            email = user.get("email", email)
            picture = user.get("picture", picture)

        access_token = create_access_token(data={"sub": user_id})
        return {
            "access_token": access_token,
            "user": {
                "name": name,
                "email": email,
                "picture": picture
            }
        }

    except HTTPException:
        raise
    except req.RequestException as exc:
        raise HTTPException(status_code=503, detail="Google authentication is temporarily unavailable") from exc
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid Google user profile") from exc
