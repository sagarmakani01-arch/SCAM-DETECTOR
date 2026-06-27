from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, jwt, json, re, bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = os.environ.get("JWT_ALGO", "HS256")

app = FastAPI(title="Nexar API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("nexar")


# ============ Models ============
class SignupReq(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str = "user"
    plan: str = "free"
    reputation: int = 0
    badges: List[str] = []
    favorite_categories: List[str] = []
    created_at: str

class AnalyzeReq(BaseModel):
    query: str
    category: Optional[str] = "auto"

class ChatReq(BaseModel):
    message: str
    session_id: Optional[str] = None

class ReviewReq(BaseModel):
    report_id: str
    rating: int
    title: str
    body: str

class ReportScamReq(BaseModel):
    target: str
    category: str
    description: str
    evidence_url: Optional[str] = None


# ============ Helpers ============
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def make_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

async def get_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_user_optional(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds:
        return None
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        return await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    except Exception:
        return None


# ============ AI Analysis ============
ANALYSIS_SYSTEM = """You are Nexar's expert AI Decision Engine. You evaluate products, websites, companies, jobs, apps, courses, services, crypto projects, etc. and produce a precise, structured risk + value assessment to help users decide.

Return ONLY valid JSON (no markdown, no commentary) matching exactly:
{
  "category": "product|website|app|saas|company|store|job|freelancer|agency|course|investment|crypto|subscription|service",
  "title": "Concise canonical title of what was analyzed",
  "summary": "2-3 sentence executive summary",
  "trust_score": 0-100,
  "risk_score": 0-100,
  "value_score": 0-100,
  "recommendation": "strong_buy|buy|caution|avoid|investigate",
  "verdict_line": "One sharp sentence verdict",
  "pros": ["..."],
  "cons": ["..."],
  "hidden_costs": ["..."],
  "common_complaints": ["..."],
  "fake_review_signals": ["..."],
  "scam_indicators": ["..."],
  "alternatives": [{"name":"...","why":"..."}],
  "buying_tips": ["..."],
  "long_term_insights": ["..."],
  "warranty": "string or null",
  "url_safety": {"verdict":"safe|suspicious|dangerous|unknown","notes":"..."},
  "tags": ["..."]
}

Be honest, specific, and useful. If information is uncertain, mark it. If input is a URL, evaluate domain reputation patterns. If it is a job posting / company, evaluate compensation, red flags, ghost listings, payment scams. For crypto/investments, evaluate liquidity, team transparency, audit signals."""

async def run_ai_analysis(query: str, category_hint: str) -> Dict[str, Any]:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"analysis-{uuid.uuid4()}",
        system_message=ANALYSIS_SYSTEM,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    prompt = f"Category hint: {category_hint}\nUser query: {query}\n\nProduce the JSON now."
    resp = await chat.send_message(UserMessage(text=prompt))
    text = resp if isinstance(resp, str) else str(resp)
    # extract JSON
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise HTTPException(500, "AI returned invalid response")
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        raise HTTPException(500, "AI returned invalid JSON")


# ============ Auth ============
@api.post("/auth/signup")
async def signup(body: SignupReq):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id, "email": body.email.lower(), "name": body.name,
        "password": hash_pw(body.password), "role": "user", "plan": "free",
        "reputation": 0, "badges": ["early_adopter"], "favorite_categories": [],
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = make_token(user_id, doc["email"], "user")
    doc.pop("password", None); doc.pop("_id", None)
    return {"token": token, "user": doc}

@api.post("/auth/login")
async def login(body: LoginReq):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_pw(body.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_token(user["id"], user["email"], user.get("role", "user"))
    user.pop("password", None); user.pop("_id", None)
    return {"token": token, "user": user}

@api.get("/auth/me")
async def me(user=Depends(get_user)):
    return user


# ============ Analyze ============
@api.post("/analyze")
async def analyze(body: AnalyzeReq, user=Depends(get_user_optional)):
    if not body.query.strip():
        raise HTTPException(400, "Query is required")
    data = await run_ai_analysis(body.query, body.category or "auto")
    report_id = str(uuid.uuid4())
    doc = {
        "id": report_id,
        "user_id": user["id"] if user else None,
        "query": body.query,
        "category": data.get("category", "service"),
        "data": data,
        "created_at": now_iso(),
        "bookmarked": False,
    }
    await db.reports.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/reports")
async def list_reports(user=Depends(get_user)):
    cur = db.reports.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(100)
    return await cur.to_list(100)

@api.get("/reports/{report_id}")
async def get_report(report_id: str, user=Depends(get_user_optional)):
    r = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not r:
        raise HTTPException(404, "Report not found")
    return r

@api.post("/reports/{report_id}/bookmark")
async def bookmark(report_id: str, user=Depends(get_user)):
    r = await db.reports.find_one({"id": report_id})
    if not r:
        raise HTTPException(404, "Not found")
    new_val = not r.get("bookmarked", False)
    await db.reports.update_one({"id": report_id}, {"$set": {"bookmarked": new_val}})
    return {"bookmarked": new_val}

@api.get("/trending/scams")
async def trending_scams():
    cur = db.reports.find(
        {"data.recommendation": {"$in": ["avoid", "caution"]}},
        {"_id": 0, "id": 1, "query": 1, "category": 1, "data.title": 1, "data.trust_score": 1, "data.risk_score": 1, "created_at": 1},
    ).sort("created_at", -1).limit(8)
    return await cur.to_list(8)

@api.get("/trending/products")
async def trending_products():
    cur = db.reports.find(
        {"data.recommendation": {"$in": ["buy", "strong_buy"]}},
        {"_id": 0, "id": 1, "query": 1, "category": 1, "data.title": 1, "data.trust_score": 1, "data.value_score": 1, "created_at": 1},
    ).sort("created_at", -1).limit(8)
    return await cur.to_list(8)

@api.get("/stats")
async def stats():
    total = await db.reports.count_documents({})
    users = await db.users.count_documents({})
    scams = await db.reports.count_documents({"data.recommendation": "avoid"})
    return {"total_reports": total, "total_users": users, "scams_flagged": scams}


# ============ Chat ============
@api.post("/chat")
async def chat_endpoint(body: ChatReq, user=Depends(get_user)):
    session_id = body.session_id or str(uuid.uuid4())
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=(
            "You are Nexar's AI Decision Assistant. Be concise, expert, and decisive. "
            "Help users vet products, sites, jobs, companies, apps and investments. "
            "Surface scam patterns, hidden costs and alternatives. Keep answers under 220 words unless asked."
        ),
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    resp = await chat.send_message(UserMessage(text=body.message))
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "session_id": session_id,
        "message": body.message, "response": str(resp), "created_at": now_iso(),
    })
    return {"session_id": session_id, "reply": str(resp)}


# ============ Community ============
@api.post("/community/reviews")
async def post_review(body: ReviewReq, user=Depends(get_user)):
    review = {
        "id": str(uuid.uuid4()), "report_id": body.report_id, "user_id": user["id"],
        "user_name": user["name"], "rating": body.rating, "title": body.title, "body": body.body,
        "helpful": 0, "created_at": now_iso(),
    }
    await db.reviews.insert_one(review)
    review.pop("_id", None)
    return review

@api.get("/community/reviews/{report_id}")
async def list_reviews(report_id: str):
    cur = db.reviews.find({"report_id": report_id}, {"_id": 0}).sort("created_at", -1).limit(50)
    return await cur.to_list(50)

@api.post("/community/reviews/{review_id}/helpful")
async def mark_helpful(review_id: str, user=Depends(get_user)):
    await db.reviews.update_one({"id": review_id}, {"$inc": {"helpful": 1}})
    return {"ok": True}

@api.post("/community/scams")
async def report_scam(body: ReportScamReq, user=Depends(get_user)):
    doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "user_name": user["name"],
        "target": body.target, "category": body.category, "description": body.description,
        "evidence_url": body.evidence_url, "status": "pending", "created_at": now_iso(),
    }
    await db.scam_reports.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ============ Admin ============
@api.get("/admin/overview")
async def admin_overview(user=Depends(get_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    return {
        "users": await db.users.count_documents({}),
        "reports": await db.reports.count_documents({}),
        "reviews": await db.reviews.count_documents({}),
        "scam_reports": await db.scam_reports.count_documents({}),
    }


@api.get("/")
async def root():
    return {"name": "Nexar API", "version": "1.0", "status": "live"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
