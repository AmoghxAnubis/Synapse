from jose import jwt
import requests
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

CLERK_JWKS_URL = "https://modern-cow-74.clerk.accounts.dev/.well-known/jwks.json"

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    jwks = requests.get(CLERK_JWKS_URL).json()

    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")