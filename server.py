from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: str
    role: str  # donor, recipient, admin

class UserRegister(UserBase):
    password: str
    blood_type: Optional[str] = None
    location: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    location: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class DonorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    blood_type: str
    available: bool
    last_donation_date: Optional[str] = None
    total_donations: int = 0
    location: str
    name: str
    phone: str
    email: str
    achievements: List[str] = []

class DonorCreate(BaseModel):
    blood_type: str
    available: bool = True
    last_donation_date: Optional[str] = None

class BloodRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    recipient_id: str
    recipient_name: str
    recipient_phone: str
    donor_id: Optional[str] = None
    donor_name: Optional[str] = None
    blood_type: str
    location: str
    urgency: str  # low, medium, high, critical, emergency
    status: str  # pending, accepted, completed, cancelled
    message: Optional[str] = None
    is_emergency: bool = False
    created_at: str
    updated_at: str

class BloodRequestCreate(BaseModel):
    donor_id: Optional[str] = None
    blood_type: str
    location: str
    urgency: str
    message: Optional[str] = None
    is_emergency: bool = False

class BloodRequestUpdate(BaseModel):
    status: str

class DonorAvailabilityUpdate(BaseModel):
    available: bool

class DonationHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    donor_id: str
    donor_name: str
    recipient_id: str
    recipient_name: str
    blood_type: str
    location: str
    donation_date: str
    units: int = 1

class DonationHistoryCreate(BaseModel):
    request_id: str
    units: int = 1

class Activity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    type: str  # donation, request, registration
    message: str
    user_name: str
    blood_type: Optional[str] = None
    timestamp: str

class CompatibilityCheck(BaseModel):
    donor_type: str
    recipient_type: str

class CompatibilityResult(BaseModel):
    compatible: bool
    message: str
    donor_type: str
    recipient_type: str

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def calculate_achievements(total_donations: int) -> List[str]:
    achievements = []
    if total_donations >= 1:
        achievements.append("First Drop")
    if total_donations >= 5:
        achievements.append("Lifesaver")
    if total_donations >= 10:
        achievements.append("Hero")
    if total_donations >= 25:
        achievements.append("Legend")
    if total_donations >= 50:
        achievements.append("Guardian Angel")
    return achievements

def check_blood_compatibility(donor_type: str, recipient_type: str) -> tuple[bool, str]:
    compatibility_map = {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
    }
    
    if donor_type in compatibility_map and recipient_type in compatibility_map[donor_type]:
        return True, f"{donor_type} blood can be donated to {recipient_type}"
    else:
        return False, f"{donor_type} blood is NOT compatible with {recipient_type}"

async def create_activity(activity_type: str, message: str, user_name: str, blood_type: Optional[str] = None):
    activity_doc = {
        "id": str(uuid.uuid4()),
        "type": activity_type,
        "message": message,
        "user_name": user_name,
        "blood_type": blood_type,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.activities.insert_one(activity_doc)

# Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role,
        "location": user_data.location,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # If donor, create donor profile
    if user_data.role == "donor" and user_data.blood_type:
        donor_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "blood_type": user_data.blood_type,
            "available": True,
            "last_donation_date": None,
            "total_donations": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.donors.insert_one(donor_doc)
        
        # Create activity
        await create_activity(
            "registration",
            f"New {user_data.blood_type} donor joined",
            user_data.name,
            user_data.blood_type
        )
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        role=user_data.role,
        location=user_data.location,
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user["phone"],
        role=user["role"],
        location=user.get("location"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/profile", response_model=User)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        phone=current_user["phone"],
        role=current_user["role"],
        location=current_user.get("location"),
        created_at=current_user["created_at"]
    )

@api_router.get("/donors", response_model=List[DonorProfile])
async def get_donors(blood_type: Optional[str] = None, location: Optional[str] = None, available: Optional[bool] = None):
    query = {}
    if available is not None:
        query["available"] = available
    if blood_type:
        query["blood_type"] = blood_type
    
    donors = await db.donors.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with user data
    result = []
    for donor in donors:
        user = await db.users.find_one({"id": donor["user_id"]}, {"_id": 0})
        if user:
            # Filter by location if specified
            if location and location.lower() not in user.get("location", "").lower():
                continue
            
            achievements = calculate_achievements(donor.get("total_donations", 0))
            
            result.append(DonorProfile(
                id=donor["id"],
                user_id=donor["user_id"],
                blood_type=donor["blood_type"],
                available=donor["available"],
                last_donation_date=donor.get("last_donation_date"),
                total_donations=donor.get("total_donations", 0),
                location=user.get("location", ""),
                name=user["name"],
                phone=user["phone"],
                email=user["email"],
                achievements=achievements
            ))
    
    return result

@api_router.get("/donors/me", response_model=DonorProfile)
async def get_my_donor_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "donor":
        raise HTTPException(status_code=403, detail="Only donors can access this endpoint")
    
    donor = await db.donors.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    
    achievements = calculate_achievements(donor.get("total_donations", 0))
    
    return DonorProfile(
        id=donor["id"],
        user_id=donor["user_id"],
        blood_type=donor["blood_type"],
        available=donor["available"],
        last_donation_date=donor.get("last_donation_date"),
        total_donations=donor.get("total_donations", 0),
        location=current_user.get("location", ""),
        name=current_user["name"],
        phone=current_user["phone"],
        email=current_user["email"],
        achievements=achievements
    )

@api_router.put("/donors/me/availability")
async def update_donor_availability(update: DonorAvailabilityUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "donor":
        raise HTTPException(status_code=403, detail="Only donors can access this endpoint")
    
    result = await db.donors.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"available": update.available}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    
    return {"message": "Availability updated successfully", "available": update.available}

@api_router.get("/donors/leaderboard", response_model=List[DonorProfile])
async def get_donor_leaderboard():
    donors = await db.donors.find({}, {"_id": 0}).sort("total_donations", -1).limit(10).to_list(10)
    
    result = []
    for donor in donors:
        user = await db.users.find_one({"id": donor["user_id"]}, {"_id": 0})
        if user:
            achievements = calculate_achievements(donor.get("total_donations", 0))
            result.append(DonorProfile(
                id=donor["id"],
                user_id=donor["user_id"],
                blood_type=donor["blood_type"],
                available=donor["available"],
                last_donation_date=donor.get("last_donation_date"),
                total_donations=donor.get("total_donations", 0),
                location=user.get("location", ""),
                name=user["name"],
                phone=user["phone"],
                email=user["email"],
                achievements=achievements
            ))
    
    return result

@api_router.post("/blood-requests", response_model=BloodRequest)
async def create_blood_request(request_data: BloodRequestCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "recipient":
        raise HTTPException(status_code=403, detail="Only recipients can create blood requests")
    
    request_id = str(uuid.uuid4())
    donor_name = None
    
    if request_data.donor_id:
        donor = await db.donors.find_one({"id": request_data.donor_id}, {"_id": 0})
        if donor:
            donor_user = await db.users.find_one({"id": donor["user_id"]}, {"_id": 0})
            donor_name = donor_user["name"] if donor_user else None
    
    request_doc = {
        "id": request_id,
        "recipient_id": current_user["id"],
        "recipient_name": current_user["name"],
        "recipient_phone": current_user["phone"],
        "donor_id": request_data.donor_id,
        "donor_name": donor_name,
        "blood_type": request_data.blood_type,
        "location": request_data.location,
        "urgency": request_data.urgency,
        "status": "pending",
        "message": request_data.message,
        "is_emergency": request_data.is_emergency,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blood_requests.insert_one(request_doc)
    
    # Create activity
    urgency_text = "🚨 EMERGENCY" if request_data.is_emergency else request_data.urgency.upper()
    await create_activity(
        "request",
        f"{urgency_text} blood request for {request_data.blood_type}",
        current_user["name"],
        request_data.blood_type
    )
    
    return BloodRequest(**request_doc)

@api_router.get("/blood-requests", response_model=List[BloodRequest])
async def get_blood_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "donor":
        # Get donor profile
        donor = await db.donors.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not donor:
            return []
        
        # Get requests for this donor or matching blood type
        requests = await db.blood_requests.find({
            "$or": [
                {"donor_id": donor["id"]},
                {"blood_type": donor["blood_type"], "status": "pending"}
            ]
        }, {"_id": 0}).sort("is_emergency", -1).sort("created_at", -1).to_list(1000)
    elif current_user["role"] == "recipient":
        # Get requests created by this recipient
        requests = await db.blood_requests.find(
            {"recipient_id": current_user["id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
    else:
        # Admin - get all requests
        requests = await db.blood_requests.find({}, {"_id": 0}).sort("is_emergency", -1).sort("created_at", -1).to_list(1000)
    
    return [BloodRequest(**req) for req in requests]

@api_router.put("/blood-requests/{request_id}")
async def update_blood_request(request_id: str, update: BloodRequestUpdate, current_user: dict = Depends(get_current_user)):
    request = await db.blood_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Authorization check
    if current_user["role"] == "recipient" and request["recipient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this request")
    
    result = await db.blood_requests.update_one(
        {"id": request_id},
        {"$set": {"status": update.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"message": "Request updated successfully", "status": update.status}

@api_router.post("/donations", response_model=DonationHistory)
async def record_donation(donation_data: DonationHistoryCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "donor":
        raise HTTPException(status_code=403, detail="Only donors can record donations")
    
    # Get request details
    request = await db.blood_requests.find_one({"id": donation_data.request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Get donor profile
    donor = await db.donors.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    
    # Create donation history
    donation_doc = {
        "id": str(uuid.uuid4()),
        "donor_id": donor["id"],
        "donor_name": current_user["name"],
        "recipient_id": request["recipient_id"],
        "recipient_name": request["recipient_name"],
        "blood_type": request["blood_type"],
        "location": request["location"],
        "donation_date": datetime.now(timezone.utc).isoformat(),
        "units": donation_data.units
    }
    await db.donation_history.insert_one(donation_doc)
    
    # Update donor stats
    new_total = donor.get("total_donations", 0) + 1
    await db.donors.update_one(
        {"id": donor["id"]},
        {
            "$set": {
                "last_donation_date": donation_doc["donation_date"],
                "total_donations": new_total
            }
        }
    )
    
    # Update request status
    await db.blood_requests.update_one(
        {"id": donation_data.request_id},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create activity
    await create_activity(
        "donation",
        f"Successful {request['blood_type']} donation completed",
        current_user["name"],
        request["blood_type"]
    )
    
    return DonationHistory(**donation_doc)

@api_router.get("/donations/history", response_model=List[DonationHistory])
async def get_donation_history(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "donor":
        donor = await db.donors.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not donor:
            return []
        query = {"donor_id": donor["id"]}
    elif current_user["role"] == "recipient":
        query = {"recipient_id": current_user["id"]}
    else:
        query = {}
    
    history = await db.donation_history.find(query, {"_id": 0}).sort("donation_date", -1).to_list(1000)
    return [DonationHistory(**h) for h in history]

@api_router.get("/activities", response_model=List[Activity])
async def get_activities():
    activities = await db.activities.find({}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    return [Activity(**a) for a in activities]

@api_router.post("/check-compatibility", response_model=CompatibilityResult)
async def check_compatibility(data: CompatibilityCheck):
    compatible, message = check_blood_compatibility(data.donor_type, data.recipient_type)
    return CompatibilityResult(
        compatible=compatible,
        message=message,
        donor_type=data.donor_type,
        recipient_type=data.recipient_type
    )

@api_router.get("/stats")
async def get_stats():
    total_users = await db.users.count_documents({})
    total_donors = await db.donors.count_documents({})
    available_donors = await db.donors.count_documents({"available": True})
    total_requests = await db.blood_requests.count_documents({})
    pending_requests = await db.blood_requests.count_documents({"status": "pending"})
    completed_requests = await db.blood_requests.count_documents({"status": "completed"})
    emergency_requests = await db.blood_requests.count_documents({"is_emergency": True, "status": "pending"})
    total_donations = await db.donation_history.count_documents({})
    
    # Blood type distribution
    pipeline = [
        {"$group": {"_id": "$blood_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    blood_type_dist = await db.donors.aggregate(pipeline).to_list(10)
    
    # Request urgency distribution
    urgency_pipeline = [
        {"$match": {"status": "pending"}},
        {"$group": {"_id": "$urgency", "count": {"$sum": 1}}}
    ]
    urgency_dist = await db.blood_requests.aggregate(urgency_pipeline).to_list(10)
    
    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "available_donors": available_donors,
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "completed_requests": completed_requests,
        "emergency_requests": emergency_requests,
        "total_donations": total_donations,
        "blood_type_distribution": blood_type_dist,
        "urgency_distribution": urgency_dist
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
