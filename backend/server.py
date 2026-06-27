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


# ============ Demo Seed (idempotent) ============
DEMO_REPORTS = [
    {
        "query": "WhatsApp group 'Crypto Gold Alerts' promising 40% monthly returns",
        "category": "investment",
        "data": {
            "category": "investment", "title": "Crypto Gold Alerts (WhatsApp pump group)",
            "summary": "A WhatsApp group claiming guaranteed 40% monthly crypto returns. Classic pump-and-dump pattern: paid signals, anonymous admins, fake P&L screenshots, and pressure to deposit on an unregulated foreign exchange.",
            "trust_score": 6, "risk_score": 96, "value_score": 4,
            "recommendation": "avoid",
            "verdict_line": "Textbook pump-and-dump. Anyone promising fixed monthly crypto returns is lying.",
            "pros": ["None — the only winners are the admins"],
            "cons": ["No SEBI registration", "Admins are anonymous", "Screenshots are recycled from other groups", "Pressure to deposit immediately"],
            "hidden_costs": ["100% of deposited capital at risk", "Hidden 'withdrawal fees' once you try to exit", "Exchange charges to convert losses"],
            "common_complaints": ["Withdrawals blocked after 7 days", "Account 'frozen for KYC' indefinitely", "Admins remove you when you ask questions"],
            "fake_review_signals": ["Same testimonials copy-pasted across 12+ groups", "Profile pics are stock photos"],
            "scam_indicators": ["Fixed monthly returns advertised", "Anonymous admins", "Foreign unregulated exchange", "Telegram/WhatsApp distribution only", "No regulatory disclosure"],
            "alternatives": [
                {"name": "Zerodha Varsity (free)", "why": "Learn investing properly from a SEBI-registered Indian broker."},
                {"name": "INDmoney / Groww SIPs", "why": "Regulated, transparent, real returns over time."},
                {"name": "PPF / NPS", "why": "Government-backed, tax-efficient, no scam risk."},
            ],
            "buying_tips": ["Never join paid signal groups", "Check SEBI registration on sebi.gov.in", "Promises of fixed % returns = scam, full stop"],
            "long_term_insights": ["Survivors of these groups average 80%+ capital loss within 90 days"],
            "warranty": None,
            "url_safety": {"verdict": "dangerous", "notes": "Group invite links rotate to evade reporting. Never click."},
            "tags": ["pump_and_dump", "whatsapp_scam", "crypto_fraud", "india"],
        },
    },
    {
        "query": "Job offer from 'Amazon India HR' asking ₹5,000 registration fee",
        "category": "job",
        "data": {
            "category": "job", "title": "'Amazon India HR' Pre-Onboarding Fee Scam",
            "summary": "A WhatsApp/Email recruiter posing as Amazon HR, offering a remote role and asking for ₹5,000 'registration / laptop deposit'. No legitimate company asks candidates to pay before joining.",
            "trust_score": 3, "risk_score": 98, "value_score": 0,
            "recommendation": "avoid",
            "verdict_line": "100% scam. Real employers never ask for money — period.",
            "pros": [],
            "cons": ["Generic Gmail/Outlook sender, not @amazon.com", "No interview, only WhatsApp chat", "Vague job description", "Urgency tactics ('confirm in 24 hrs')"],
            "hidden_costs": ["₹5,000 'registration' is just the first ask — they escalate to laptop, training, GST charges"],
            "common_complaints": ["Reported across r/india, Twitter, and Reddit hundreds of times in 2024–25", "Victims average ₹15k–₹40k loss before realising"],
            "fake_review_signals": [],
            "scam_indicators": ["Fee asked before joining", "Non-corporate email domain", "WhatsApp-only contact", "No proper interview", "Pressure / urgency"],
            "alternatives": [
                {"name": "amazon.jobs", "why": "The only legitimate Amazon recruitment portal."},
                {"name": "LinkedIn Jobs (verified)", "why": "Use the company's verified LinkedIn page; never DMs."},
                {"name": "Naukri / Instahyre", "why": "Indian platforms with employer verification."},
            ],
            "buying_tips": ["Verify recruiter email domain matches the company", "Search 'company name + scam' on Twitter and Reddit", "Never pay anything to get a job"],
            "long_term_insights": ["Once you pay once, your number is sold to other scam networks — expect more attempts"],
            "warranty": None,
            "url_safety": {"verdict": "dangerous", "notes": "Payment links route to random Razorpay/UPI handles, never refundable."},
            "tags": ["fake_job", "recruiter_scam", "advance_fee", "india"],
        },
    },
    {
        "query": "EdTech course promising 100% placement at ₹89,000",
        "category": "course",
        "data": {
            "category": "course", "title": "₹89k 'Guaranteed Placement' Coding Bootcamp",
            "summary": "EdTech bootcamp marketing '100% placement guarantee' with vague terms. Refund clauses are buried in 14-page agreement, placement stats are unverified, and most graduates report unrelated low-paying roles.",
            "trust_score": 24, "risk_score": 71, "value_score": 28,
            "recommendation": "caution",
            "verdict_line": "Almost always a refund trap. Read the placement clause word-by-word.",
            "pros": ["Some structured curriculum", "Active student community"],
            "cons": ["Placement 'guarantee' has 30+ exclusions", "Refund only after rejecting any offer above ₹1.8 LPA", "Instructor turnover is high", "Soft-skill heavy, technical depth thin"],
            "hidden_costs": ["GST not included in advertised price", "ISA (income-share) adds 10–17% of salary for 36 months", "Loan partner interest 13–17% p.a."],
            "common_complaints": ["Placed in BPO roles unrelated to coding", "Refund denied citing 'attendance < 95%'", "EMI continues after course ends"],
            "fake_review_signals": ["YouTube testimonials feature paid influencers", "Google reviews scrubbed monthly"],
            "scam_indicators": ["Refund clause designed to be unfulfillable", "Aggressive sales calls", "Loan partner pre-arranged"],
            "alternatives": [
                {"name": "Scaler / Newton School (with caveats)", "why": "Stronger technical bar — still read ISA terms carefully."},
                {"name": "freeCodeCamp + DSA on LeetCode", "why": "Free, employer-respected, zero risk."},
                {"name": "IIT/IIIT online B.Tech programs", "why": "Recognised degree, lower per-month cost."},
            ],
            "buying_tips": ["Get placement guarantee in writing with measurable salary floor", "Ask for 5 placed alumni LinkedIn profiles to verify"],
            "long_term_insights": ["3-yr ROI is positive only for the top 15% of cohorts"],
            "warranty": "Refund clauses heavily favour the EdTech. Read every sub-clause.",
            "url_safety": {"verdict": "safe", "notes": "Site itself is technically safe; the business model is the risk."},
            "tags": ["edtech", "placement_scam", "india", "isa"],
        },
    },
    {
        "query": "iPhone 15 Pro on amazon.in",
        "category": "product",
        "data": {
            "category": "product", "title": "Apple iPhone 15 Pro (Amazon India)",
            "summary": "Latest Apple flagship sold through Amazon India's authorised channel. Premium build, A17 Pro chip, titanium frame, USB-C. Genuine product with manufacturer warranty.",
            "trust_score": 96, "risk_score": 8, "value_score": 78,
            "recommendation": "buy",
            "verdict_line": "Genuine via Amazon India. Compare with Flipkart and Apple Store for the best exchange offer.",
            "pros": ["Authentic Apple product", "1-year manufacturer warranty", "Best-in-class camera + chip", "Strong resale value"],
            "cons": ["Premium pricing", "Battery life only marginally better than 14 Pro", "No charger in box"],
            "hidden_costs": ["AppleCare+ ₹17,900", "USB-C accessories sold separately", "Higher insurance premiums"],
            "common_complaints": ["Heating during heavy gaming", "Titanium frame shows fingerprints"],
            "fake_review_signals": ["Some 5-star reviews look templated — filter to verified purchases only"],
            "scam_indicators": [],
            "alternatives": [
                {"name": "iPhone 15 (non-Pro)", "why": "₹35k cheaper, same iOS experience for most users."},
                {"name": "Samsung S24", "why": "Better AI features, more flexibility, Android ecosystem."},
                {"name": "OnePlus 12", "why": "70% of the experience at 45% of the price."},
            ],
            "buying_tips": ["Check bank exchange offers — often 10% extra off", "Buy during Amazon Great Indian Festival for best price"],
            "long_term_insights": ["iPhones retain 60–70% value after 2 years; great resale ecosystem in India"],
            "warranty": "1 year Apple India warranty, extendable via AppleCare+",
            "url_safety": {"verdict": "safe", "notes": "amazon.in is a verified, trusted Indian marketplace."},
            "tags": ["smartphone", "apple", "india", "premium"],
        },
    },
    {
        "query": "Telegram channel 'Bank Nifty God' selling option tips at ₹2,999/month",
        "category": "service",
        "data": {
            "category": "service", "title": "'Bank Nifty God' Paid Options Tips Channel",
            "summary": "Anonymous Telegram channel selling intraday options tips. Unregistered with SEBI, posts only winning screenshots, deletes losing trades, and pressures upgrades to 'premium' tiers.",
            "trust_score": 11, "risk_score": 92, "value_score": 6,
            "recommendation": "avoid",
            "verdict_line": "Unregistered, anonymous, and statistically guaranteed to lose you money.",
            "pros": [],
            "cons": ["Not SEBI-registered (illegal in India)", "Anonymous operator", "Survivorship-biased screenshots", "Forces broker referral links"],
            "hidden_costs": ["₹2,999/mo subscription", "Brokerage on losing trades they push", "Premium 'VIP' upgrades to ₹15k/mo"],
            "common_complaints": ["Avg subscriber loses ₹1–3 lakh in 3 months", "Channel disappears and reopens under new name"],
            "fake_review_signals": ["Pinned testimonials are from sock-puppet accounts"],
            "scam_indicators": ["No SEBI registration", "Guaranteed-profit claims", "Anonymous admin", "Telegram-only distribution"],
            "alternatives": [
                {"name": "Zerodha Varsity (free)", "why": "Learn options properly before risking real money."},
                {"name": "Sensibull", "why": "Regulated options analytics platform."},
                {"name": "Index funds via Nifty 50 SIP", "why": "Beats 95% of retail options traders over 5 years."},
            ],
            "buying_tips": ["Check SEBI registration here: sebi.gov.in/intermediaries.html"],
            "long_term_insights": ["95% of retail F&O traders lose money — SEBI's own 2023 study"],
            "warranty": None,
            "url_safety": {"verdict": "dangerous", "notes": "Channel links rotate to dodge SEBI takedowns."},
            "tags": ["telegram_scam", "sebi_violation", "options_trading", "india"],
        },
    },
    {
        "query": "DJI Mini 4 Pro drone",
        "category": "product",
        "data": {
            "category": "product", "title": "DJI Mini 4 Pro Drone",
            "summary": "Sub-249g drone with 4K HDR, omnidirectional obstacle sensing, and 34-min flight time. Legal to fly in India under nano category — no registration needed for hobbyists.",
            "trust_score": 91, "risk_score": 14, "value_score": 84,
            "recommendation": "buy",
            "verdict_line": "Best content-creator drone for India. DGCA-compliant out of the box.",
            "pros": ["Sub-250g = no DGCA registration needed", "4K HDR 60fps", "34-min flight", "Foldable, travel-friendly"],
            "cons": ["Expensive accessories", "DJI Care Refresh sold separately", "Range restricted in Indian no-fly zones"],
            "hidden_costs": ["Fly More Combo (essential) +₹40k", "DJI Care Refresh ₹8,500", "Spare batteries ₹9,500 each"],
            "common_complaints": ["Limited Indian service centres", "Customs delays on direct imports"],
            "fake_review_signals": [],
            "scam_indicators": [],
            "alternatives": [
                {"name": "DJI Mini 3 Pro", "why": "Previous gen, ₹25k cheaper, 90% of the features."},
                {"name": "Autel Nano+", "why": "Bigger sensor, similar weight, less brand recognition."},
                {"name": "DJI Air 3", "why": "If you can register with DGCA — better for serious work."},
            ],
            "buying_tips": ["Buy from DJI India authorised dealer for warranty", "Skip Combo if you fly < 1 hr/week"],
            "long_term_insights": ["DJI Mini line retains 65% value after 18 months in India"],
            "warranty": "1 year DJI India warranty",
            "url_safety": {"verdict": "safe", "notes": "DJI authorised channels are safe."},
            "tags": ["drone", "dji", "creator", "india"],
        },
    },
]

@api.post("/seed-demo")
async def seed_demo():
    """Idempotent demo seed — populates trending feed for new installs."""
    existing = await db.reports.count_documents({"user_id": "demo"})
    if existing > 0:
        return {"seeded": False, "reason": "already seeded", "count": existing}
    docs = []
    for r in DEMO_REPORTS:
        docs.append({
            "id": str(uuid.uuid4()), "user_id": "demo",
            "query": r["query"], "category": r["category"], "data": r["data"],
            "created_at": now_iso(), "bookmarked": False,
        })
    if docs:
        await db.reports.insert_many(docs)
    return {"seeded": True, "count": len(docs)}


@app.on_event("startup")
async def auto_seed():
    try:
        existing = await db.reports.count_documents({"user_id": "demo"})
        if existing == 0:
            docs = []
            for r in DEMO_REPORTS:
                docs.append({
                    "id": str(uuid.uuid4()), "user_id": "demo",
                    "query": r["query"], "category": r["category"], "data": r["data"],
                    "created_at": now_iso(), "bookmarked": False,
                })
            if docs:
                await db.reports.insert_many(docs)
                logger.info(f"Seeded {len(docs)} demo reports")
    except Exception as e:
        logger.warning(f"Auto-seed failed: {e}")


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
