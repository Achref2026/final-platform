import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from pathlib import Path
from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import jwt
from enum import Enum
import requests
import cloudinary
import cloudinary.uploader
import cloudinary.api
import aiofiles
import json

# Initialize API Router
api_router = APIRouter()

# Configure logging
logger = logging.getLogger(__name__)

# Constants
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize FastAPI app
app = FastAPI(title="Driving School Platform API")

# Initialize API Router with /api prefix
api_router = APIRouter(prefix="/api")

# Create demo uploads directory and mount static files
demo_uploads_dir = Path("demo-uploads")
demo_uploads_dir.mkdir(exist_ok=True)
app.mount("/demo-uploads", StaticFiles(directory="demo-uploads"), name="demo-uploads")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.driving_school_platform

# Security setup
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
ALGORITHM = "HS256"

# Daily.co API setup
DAILY_API_KEY = os.environ.get('DAILY_API_KEY')
DAILY_API_URL = os.environ.get('DAILY_API_URL', 'https://api.daily.co/v1')

# Cloudinary setup
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

# API router will be included at the end of the file after all endpoints are defined

# Basic routes that don't need /api prefix
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Driving School Platform API is running"}

# Enums
class UserRole(str, Enum):
    GUEST = "guest"
    STUDENT = "student"
    TEACHER = "teacher"
    MANAGER = "manager"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"

class CourseType(str, Enum):
    THEORY = "theory"
    PARK = "park"
    ROAD = "road"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class CourseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class ExamStatus(str, Enum):
    NOT_TAKEN = "not_taken"
    PASSED = "passed"
    FAILED = "failed"

class DocumentType(str, Enum):
    PROFILE_PHOTO = "profile_photo"
    ID_CARD = "id_card"
    MEDICAL_CERTIFICATE = "medical_certificate"
    DRIVING_LICENSE = "driving_license"
    TEACHING_LICENSE = "teaching_license"

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    address: str
    date_of_birth: str
    gender: Gender

class UserCreate(UserBase):
    password: str
    # Role will be assigned automatically - removed from user input

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    role: UserRole
    is_active: bool = True
    created_at: datetime

class DrivingSchool(BaseModel):
    id: str
    name: str
    address: str
    state: str  # One of the 58 Algerian states
    phone: str
    email: EmailStr
    description: str
    logo_url: Optional[str] = None
    photos: List[str] = []
    price: float
    rating: float = 0.0
    total_reviews: int = 0
    manager_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

class DrivingSchoolCreate(BaseModel):
    name: str
    address: str
    state: str
    phone: str
    email: EmailStr
    description: str
    price: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Teacher(BaseModel):
    id: str
    user_id: str
    driving_school_id: str
    driving_license_url: str
    teaching_license_url: str
    photo_url: str
    can_teach_male: bool = True
    can_teach_female: bool = True
    rating: float = 0.0
    total_reviews: int = 0
    created_at: datetime

class TeacherCreate(BaseModel):
    driving_license_url: str
    teaching_license_url: str
    photo_url: str
    can_teach_male: bool = True
    can_teach_female: bool = True

class Enrollment(BaseModel):
    id: str
    student_id: str
    driving_school_id: str
    amount: float
    payment_status: PaymentStatus
    is_approved: bool = False
    created_at: datetime
    approved_at: Optional[datetime] = None

class EnrollmentCreate(BaseModel):
    school_id: str

class Course(BaseModel):
    id: str
    enrollment_id: str
    course_type: CourseType
    status: CourseStatus
    teacher_id: Optional[str] = None
    scheduled_sessions: List[dict] = []
    completed_sessions: int = 0
    total_sessions: int
    exam_status: ExamStatus = ExamStatus.NOT_TAKEN
    exam_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class CourseSession(BaseModel):
    id: str
    course_id: str
    teacher_id: str
    student_id: str
    scheduled_time: datetime
    duration_minutes: int
    status: str  # scheduled, completed, cancelled
    notes: Optional[str] = None
    daily_room_url: Optional[str] = None
    daily_room_name: Optional[str] = None
    recording_url: Optional[str] = None
    created_at: datetime

class CourseSessionCreate(BaseModel):
    course_id: str
    scheduled_time: datetime
    duration_minutes: int = 60

class VideoRoomCreate(BaseModel):
    room_name: str
    course_id: str
    privacy: str = "private"
    properties: dict = {}

class DocumentUpload(BaseModel):
    id: str
    user_id: str
    document_type: DocumentType
    file_url: str
    file_name: str
    file_size: int
    upload_date: datetime
    is_verified: bool = False

class Quiz(BaseModel):
    id: str
    course_id: str
    title: str
    questions: List[dict]
    time_limit_minutes: int
    passing_score: float
    created_at: datetime

class QuizAttempt(BaseModel):
    id: str
    quiz_id: str
    student_id: str
    answers: List[dict]
    score: float
    passed: bool
    completed_at: datetime

class BaridimobPayment(BaseModel):
    enrollment_id: str
    amount: float
    merchant_id: str
    transaction_id: str

# Algerian States (58 wilayas)
ALGERIAN_STATES = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", 
    "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", 
    "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", 
    "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", 
    "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", 
    "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", 
    "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", 
    "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", 
    "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", 
    "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
]

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip MongoDB _id field
            result[key] = serialize_doc(value)
        return result
    return doc

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def create_default_courses(enrollment_id: str):
    """Create default courses for a new enrollment"""
    course_types = [
        {"type": CourseType.THEORY, "sessions": 10},
        {"type": CourseType.PARK, "sessions": 5}, 
        {"type": CourseType.ROAD, "sessions": 15}
    ]
    
    courses = []
    for course_config in course_types:
        course_id = str(uuid.uuid4())
        course_doc = {
            "id": course_id,
            "enrollment_id": enrollment_id,
            "course_type": course_config["type"],
            "status": CourseStatus.NOT_STARTED,
            "teacher_id": None,
            "scheduled_sessions": [],
            "completed_sessions": 0,
            "total_sessions": course_config["sessions"],
            "exam_status": ExamStatus.NOT_TAKEN,
            "exam_score": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        courses.append(course_doc)
    
    await db.courses.insert_many(courses)
    return courses

# Daily.co API functions
async def create_daily_room(room_name: str, properties: dict = None):
    """Create a Daily.co video room"""
    if not DAILY_API_KEY or DAILY_API_KEY.startswith("demo-"):
        # Return demo room for testing
        return {
            "url": f"https://demo.daily.co/{room_name}",
            "name": room_name,
            "id": str(uuid.uuid4()),
            "api_created": True,
            "privacy": "private",
            "config": {"start_video_off": False, "start_audio_off": False}
        }
    
    if properties is None:
        properties = {
            "enable_screenshare": True,
            "enable_chat": True,
            "start_video_off": False,
            "start_audio_off": False,
            "max_participants": 10
        }
    
    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "name": room_name,
        "privacy": "private",
        "properties": properties
    }
    
    try:
        response = requests.post(f"{DAILY_API_URL}/rooms", json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        # Fallback to demo room if API fails
        return {
            "url": f"https://demo.daily.co/{room_name}",
            "name": room_name,
            "id": str(uuid.uuid4()),
            "api_created": False,
            "error": str(e)
        }

async def get_daily_room(room_name: str):
    """Get Daily.co room information"""
    if not DAILY_API_KEY or DAILY_API_KEY.startswith("demo-"):
        return {
            "url": f"https://demo.daily.co/{room_name}",
            "name": room_name,
            "privacy": "private",
            "config": {}
        }
    
    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}"
    }
    
    try:
        response = requests.get(f"{DAILY_API_URL}/rooms/{room_name}", headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        return {
            "url": f"https://demo.daily.co/{room_name}",
            "name": room_name,
            "error": str(e)
        }

async def delete_daily_room(room_name: str):
    """Delete Daily.co room"""
    if not DAILY_API_KEY or DAILY_API_KEY.startswith("demo-"):
        return {"deleted": True, "name": room_name, "demo": True}
    
    headers = {
        "Authorization": f"Bearer {DAILY_API_KEY}"
    }
    
    try:
        response = requests.delete(f"{DAILY_API_URL}/rooms/{room_name}", headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        return {"deleted": False, "error": str(e)}

# Cloudinary upload function
async def upload_to_cloudinary(file: UploadFile, folder: str, resource_type: str = "auto"):
    """Upload file to Cloudinary"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type=resource_type,
            public_id=f"{str(uuid.uuid4())}_{file.filename}",
            overwrite=True
        )
        
        return {
            "file_url": upload_result["secure_url"],
            "public_id": upload_result["public_id"],
            "file_size": upload_result.get("bytes", 0),
            "format": upload_result.get("format", ""),
            "width": upload_result.get("width"),
            "height": upload_result.get("height")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

# API Routes - Add the basic routes to API router

@api_router.get("/health")
async def api_health_check():
    return {"status": "healthy", "message": "Driving School Platform API is running"}

@api_router.get("/states")
async def get_states():
    return {"states": ALGERIAN_STATES}

@api_router.post("/auth/register", response_model=dict)
async def register_user(
    # User data
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    phone: str = Form(...),
    address: str = Form(...),
    date_of_birth: str = Form(...),
    gender: str = Form(...),
    role: str = Form(...),
    state: str = Form(...),
    # Optional profile photo
    profile_photo: Optional[UploadFile] = File(None)
):
    try:
        # Validate date_of_birth format
        try:
            birth_date = datetime.fromisoformat(date_of_birth)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate state
        if state not in ALGERIAN_STATES:
            raise HTTPException(status_code=400, detail="Invalid state")
        
        # Validate role
        if role not in ['student', 'teacher', 'manager']:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Validate gender
        if gender not in ['male', 'female']:
            raise HTTPException(status_code=400, detail="Invalid gender")
        
        # Hash password
        password_hash = pwd_context.hash(password)
        
        # Handle profile photo upload
        profile_photo_url = None
        if profile_photo and profile_photo.size > 0:
            try:
                upload_result = await upload_to_cloudinary(profile_photo, "profile_photos", "image")
                profile_photo_url = upload_result["file_url"]
            except Exception as e:
                logger.warning(f"Failed to upload profile photo: {str(e)}")
                # Continue without photo - don't fail registration
        
        # Create user
        user_data = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": password_hash,
            "first_name": first_name,
            "last_name": last_name,
            "phone": phone,
            "address": address,
            "date_of_birth": birth_date,
            "gender": gender,
            "role": role,
            "state": state,
            "profile_photo_url": profile_photo_url,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.users.insert_one(user_data)
        
        # Create role-specific profiles
        if role == "student":
            student_profile = {
                "id": str(uuid.uuid4()),
                "user_id": user_data["id"],
                "documents": {},
                "medical_info": {},
                "enrollment_status": "not_enrolled",
                "created_at": datetime.utcnow()
            }
            await db.student_profiles.insert_one(student_profile)
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email, "user_id": user_data["id"]}, 
            expires_delta=access_token_expires
        )
        
        # Return user data (exclude password hash)
        user_response = {k: v for k, v in user_data.items() if k != "password_hash"}
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(days=30)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"]
        }
    }

@api_router.get("/driving-schools")
async def get_driving_schools(state: Optional[str] = None, limit: int = 20, skip: int = 0):
    query = {}
    if state:
        query["state"] = state
    
    schools_cursor = db.driving_schools.find(query).skip(skip).limit(limit)
    schools = await schools_cursor.to_list(length=limit)
    total = await db.driving_schools.count_documents(query)
    
    # Serialize the documents
    serialized_schools = serialize_doc(schools)
    
    return {
        "schools": serialized_schools,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@api_router.get("/driving-schools/{school_id}")
async def get_driving_school(school_id: str):
    school = await db.driving_schools.find_one({"id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="Driving school not found")
    
    # Get teachers for this school
    teachers_cursor = db.teachers.find({"driving_school_id": school_id})
    teachers = await teachers_cursor.to_list(length=None)
    
    # Enrich teachers with user data
    for teacher in teachers:
        user = await db.users.find_one({"id": teacher["user_id"]})
        if user:
            teacher["user"] = serialize_doc(user)
    
    # Serialize the documents
    serialized_school = serialize_doc(school)
    serialized_teachers = serialize_doc(teachers)
    serialized_school["teachers"] = serialized_teachers
    
    return serialized_school

@api_router.post("/driving-schools")
async def create_driving_school(
    # School data
    name: str = Form(...),
    address: str = Form(...),
    state: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    # Optional files
    logo: Optional[UploadFile] = File(None),
    photos: List[UploadFile] = File([]),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can create driving schools")
    
    if state not in ALGERIAN_STATES:
        raise HTTPException(status_code=400, detail="Invalid state")
    
    # Handle logo upload
    logo_url = None
    if logo and logo.size > 0:
        try:
            upload_result = await upload_to_cloudinary(logo, "driving_schools/logos", "image")
            logo_url = upload_result["file_url"]
        except Exception as e:
            logger.warning(f"Failed to upload logo: {str(e)}")
            # Continue without logo - don't fail school creation
    
    # Handle photos upload
    photo_urls = []
    if photos:
        for photo in photos:
            if photo.size > 0:  # Check if file is not empty
                try:
                    upload_result = await upload_to_cloudinary(photo, "driving_schools/photos", "image")
                    photo_urls.append(upload_result["file_url"])
                except Exception as e:
                    logger.warning(f"Failed to upload photo {photo.filename}: {str(e)}")
                    # Continue with other photos
    
    school_id = str(uuid.uuid4())
    school_doc = {
        "id": school_id,
        "name": name,
        "address": address,
        "state": state,
        "phone": phone,
        "email": email,
        "description": description,
        "price": price,
        "latitude": latitude,
        "longitude": longitude,
        "logo_url": logo_url,
        "photos": photo_urls,
        "rating": 0.0,
        "total_reviews": 0,
        "manager_id": current_user["id"],
        "created_at": datetime.utcnow()
    }
    
    await db.driving_schools.insert_one(school_doc)
    return {
        "id": school_id, 
        "message": "Driving school created successfully",
        "logo_url": logo_url,
        "photos": photo_urls
    }

# Demo Data Creation API
@api_router.post("/demo/create-sample-data")
async def create_sample_data():
    """Create sample data for testing (DEMO ONLY)"""
    try:
        # Sample Algerian road signs quiz questions
        sample_quiz_questions = [
            {
                "question": "What does this sign mean: Red circle with white horizontal bar?",
                "options": ["No entry", "Stop", "Give way", "Speed limit"],
                "correct_answer": "No entry"
            },
            {
                "question": "At an intersection with no traffic signs, who has priority?",
                "options": ["Vehicle from the left", "Vehicle from the right", "Larger vehicle", "Faster vehicle"],
                "correct_answer": "Vehicle from the right"
            },
            {
                "question": "What is the maximum speed limit in residential areas in Algeria?",
                "options": ["30 km/h", "40 km/h", "50 km/h", "60 km/h"],
                "correct_answer": "50 km/h"
            },
            {
                "question": "When should you use your vehicle's hazard lights?",
                "options": ["During rain", "When parking", "During emergency/breakdown", "At night"],
                "correct_answer": "During emergency/breakdown"
            },
            {
                "question": "What documents must you carry while driving in Algeria?",
                "options": ["Only driving license", "License and registration", "License, registration, and insurance", "Only insurance"],
                "correct_answer": "License, registration, and insurance"
            }
        ]
        
        # Create sample schools if none exist
        school_count = await db.driving_schools.count_documents({})
        if school_count == 0:
            sample_schools = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "École de Conduite Alger Centre",
                    "address": "Rue Didouche Mourad, Alger Centre",
                    "state": "Alger",
                    "phone": "+213 21 123 456",
                    "email": "contact@ecolealger.dz",
                    "description": "École de conduite moderne au cœur d'Alger avec instructeurs expérimentés",
                    "price": 25000.0,
                    "rating": 4.5,
                    "total_reviews": 127,
                    "manager_id": "demo-manager-1",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Auto-École Oran Modern",
                    "address": "Boulevard de la Révolution, Oran",
                    "state": "Oran",
                    "phone": "+213 41 789 123",
                    "email": "info@oranmodern.dz",
                    "description": "Formation complète avec véhicules récents et simulateurs",
                    "price": 28000.0,
                    "rating": 4.7,
                    "total_reviews": 89,
                    "manager_id": "demo-manager-2",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "École Conduite Constantine",
                    "address": "Rue Ben Badis, Constantine",
                    "state": "Constantine",
                    "phone": "+213 31 456 789",
                    "email": "ecole@constantine-conduite.dz",
                    "description": "Spécialisée dans la formation des conducteurs débutants",
                    "price": 22000.0,
                    "rating": 4.2,
                    "total_reviews": 156,
                    "manager_id": "demo-manager-3",
                    "created_at": datetime.utcnow()
                }
            ]
            
            await db.driving_schools.insert_many(sample_schools)
            
        return {
            "message": "Sample data created successfully",
            "quiz_questions": len(sample_quiz_questions),
            "sample_schools": 3
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create sample data: {str(e)}")

@app.post("/api/enrollments")
async def create_enrollment(enrollment_data: EnrollmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can enroll")
    
    # Check if school exists
    school = await db.driving_schools.find_one({"id": enrollment_data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="Driving school not found")
    
    # Check if student already enrolled
    existing_enrollment = await db.enrollments.find_one({
        "student_id": current_user["id"],
        "driving_school_id": enrollment_data.school_id
    })
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this school")
    
    enrollment_id = str(uuid.uuid4())
    enrollment_doc = {
        "id": enrollment_id,
        "student_id": current_user["id"],
        "driving_school_id": enrollment_data.school_id,
        "amount": school["price"],
        "payment_status": PaymentStatus.PENDING,
        "is_approved": False,
        "created_at": datetime.utcnow()
    }
    
    await db.enrollments.insert_one(enrollment_doc)
    
    # Create default courses for the enrollment
    await create_default_courses(enrollment_id)
    
    return {
        "enrollment_id": enrollment_id,
        "amount": school["price"],
        "message": "Enrollment created. Please proceed with payment."
    }

@app.get("/api/enrollments/my")
async def get_my_enrollments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view enrollments")
    
    enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
    enrollments = await enrollments_cursor.to_list(length=None)
    
    # Enrich with school details and courses
    for enrollment in enrollments:
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        enrollment["school"] = serialize_doc(school)
        
        # Get courses for this enrollment
        courses_cursor = db.courses.find({"enrollment_id": enrollment["id"]})
        courses = await courses_cursor.to_list(length=None)
        enrollment["courses"] = serialize_doc(courses)
    
    return serialize_doc(enrollments)

# Video Calling APIs

@app.post("/api/video/create-room")
async def create_video_room(room_data: VideoRoomCreate, current_user: dict = Depends(get_current_user)):
    """Create a video room for a course session"""
    if current_user["role"] not in ["teacher", "manager"]:
        raise HTTPException(status_code=403, detail="Only teachers and managers can create video rooms")
    
    # Verify course exists and user has access
    course = await db.courses.find_one({"id": room_data.course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # For teachers, verify they are assigned to this course
    if current_user["role"] == "teacher":
        if course["teacher_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to create room for this course")
    
    try:
        # Create Daily.co room
        room_info = await create_daily_room(room_data.room_name, room_data.properties)
        
        # Save room info to database
        session_id = str(uuid.uuid4())
        session_doc = {
            "id": session_id,
            "course_id": room_data.course_id,
            "teacher_id": current_user["id"],
            "student_id": course.get("student_id"),
            "scheduled_time": datetime.utcnow(),
            "duration_minutes": 60,
            "status": "scheduled",
            "daily_room_url": room_info["url"],
            "daily_room_name": room_info["name"],
            "notes": None,
            "recording_url": None,
            "created_at": datetime.utcnow()
        }
        
        await db.course_sessions.insert_one(session_doc)
        
        return {
            "session_id": session_id,
            "room_url": room_info["url"],
            "room_name": room_info["name"],
            "message": "Video room created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create video room: {str(e)}")

@app.get("/api/video/rooms/{course_id}")
async def get_course_video_rooms(course_id: str, current_user: dict = Depends(get_current_user)):
    """Get all video rooms for a course"""
    # Verify course exists and user has access
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get enrollment to check student access
    enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Check access rights
    has_access = False
    if current_user["role"] == "student" and enrollment["student_id"] == current_user["id"]:
        has_access = True
    elif current_user["role"] == "teacher" and course.get("teacher_id") == current_user["id"]:
        has_access = True
    elif current_user["role"] == "manager":
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        if school and school["manager_id"] == current_user["id"]:
            has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to view course sessions")
    
    # Get course sessions
    sessions_cursor = db.course_sessions.find({"course_id": course_id})
    sessions = await sessions_cursor.to_list(length=None)
    
    return serialize_doc(sessions)

@app.post("/api/video/join/{session_id}")
async def join_video_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get join URL for a video session"""
    session = await db.course_sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify access
    course = await db.courses.find_one({"id": session["course_id"]})
    enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
    
    has_access = False
    if current_user["role"] == "student" and enrollment["student_id"] == current_user["id"]:
        has_access = True
    elif current_user["role"] == "teacher" and session["teacher_id"] == current_user["id"]:
        has_access = True
    elif current_user["role"] == "manager":
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        if school and school["manager_id"] == current_user["id"]:
            has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to join this session")
    
    return {
        "room_url": session["daily_room_url"],
        "room_name": session["daily_room_name"],
        "session_id": session_id
    }

# Document Upload APIs

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a document (photo, ID card, medical certificate, etc.)"""
    
    # Validate document type
    if document_type not in [dt.value for dt in DocumentType]:
        raise HTTPException(status_code=400, detail="Invalid document type")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and PDF files are allowed")
    
    # Validate file size (max 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    try:
        # Determine folder based on document type
        folder = f"driving-school/{current_user['role']}/{document_type}"
        
        # Upload to Cloudinary
        upload_result = await upload_to_cloudinary(file, folder)
        
        # Save document info to database
        document_id = str(uuid.uuid4())
        document_doc = {
            "id": document_id,
            "user_id": current_user["id"],
            "document_type": document_type,
            "file_url": upload_result["file_url"],
            "file_name": file.filename,
            "file_size": upload_result["file_size"],
            "upload_date": datetime.utcnow(),
            "is_verified": False,
            "cloudinary_public_id": upload_result["public_id"]
        }
        
        await db.documents.insert_one(document_doc)
        
        return {
            "document_id": document_id,
            "file_url": upload_result["file_url"],
            "message": "Document uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@app.get("/api/documents/my")
async def get_my_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents for the current user"""
    documents_cursor = db.documents.find({"user_id": current_user["id"]})
    documents = await documents_cursor.to_list(length=None)
    return serialize_doc(documents)

@app.get("/api/documents/{user_id}")
async def get_user_documents(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get documents for a specific user (manager/teacher access)"""
    if current_user["role"] not in ["manager", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized to view user documents")
    
    # For teachers, they can only view their students' documents
    if current_user["role"] == "teacher":
        # Check if user is student of this teacher
        teacher = await db.teachers.find_one({"user_id": current_user["id"]})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher profile not found")
        
        # Check if student is enrolled in teacher's school
        enrollments_cursor = db.enrollments.find({"student_id": user_id})
        enrollments = await enrollments_cursor.to_list(length=None)
        
        has_access = False
        for enrollment in enrollments:
            school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
            if school and school["id"] == teacher["driving_school_id"]:
                has_access = True
                break
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to view this student's documents")
    
    documents_cursor = db.documents.find({"user_id": user_id})
    documents = await documents_cursor.to_list(length=None)
    return serialize_doc(documents)

@app.post("/api/documents/{document_id}/verify")
async def verify_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """Verify a document (manager only)"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can verify documents")
    
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update document verification status
    await db.documents.update_one(
        {"id": document_id},
        {"$set": {"is_verified": True, "verified_by": current_user["id"], "verified_at": datetime.utcnow()}}
    )
    
    return {"message": "Document verified successfully"}

# Quiz Management APIs
@app.post("/api/quizzes")
async def create_quiz(
    course_id: str = Form(...),
    title: str = Form(...),
    questions: str = Form(...),  # JSON string
    time_limit_minutes: int = Form(30),
    passing_score: float = Form(80.0),
    current_user: dict = Depends(get_current_user)
):
    """Create a quiz for a theory course"""
    if current_user["role"] not in ["teacher", "manager"]:
        raise HTTPException(status_code=403, detail="Only teachers and managers can create quizzes")
    
    # Verify course exists and is a theory course
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course["course_type"] != CourseType.THEORY:
        raise HTTPException(status_code=400, detail="Quizzes can only be created for theory courses")
    
    # Parse questions JSON
    try:
        questions_data = json.loads(questions)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid questions format")
    
    quiz_id = str(uuid.uuid4())
    quiz_doc = {
        "id": quiz_id,
        "course_id": course_id,
        "title": title,
        "questions": questions_data,
        "time_limit_minutes": time_limit_minutes,
        "passing_score": passing_score,
        "created_at": datetime.utcnow()
    }
    
    await db.quizzes.insert_one(quiz_doc)
    return {"id": quiz_id, "message": "Quiz created successfully"}

@app.get("/api/quizzes/course/{course_id}")
async def get_course_quizzes(course_id: str, current_user: dict = Depends(get_current_user)):
    """Get all quizzes for a course"""
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check access rights
    enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    has_access = False
    if current_user["role"] == "student" and enrollment["student_id"] == current_user["id"]:
        has_access = True
    elif current_user["role"] == "teacher" and course.get("teacher_id") == current_user["id"]:
        has_access = True
    elif current_user["role"] == "manager":
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        if school and school["manager_id"] == current_user["id"]:
            has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to view course quizzes")
    
    quizzes_cursor = db.quizzes.find({"course_id": course_id})
    quizzes = await quizzes_cursor.to_list(length=None)
    return serialize_doc(quizzes)

@app.post("/api/quiz-attempts")
async def submit_quiz_attempt(
    quiz_id: str = Form(...),
    answers: str = Form(...),  # JSON string
    current_user: dict = Depends(get_current_user)
):
    """Submit a quiz attempt"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit quiz attempts")
    
    quiz = await db.quizzes.find_one({"id": quiz_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Parse answers
    try:
        answers_data = json.loads(answers)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid answers format")
    
    # Calculate score
    total_questions = len(quiz["questions"])
    correct_answers = 0
    
    for i, question in enumerate(quiz["questions"]):
        student_answer = answers_data.get(str(i))
        if student_answer == question.get("correct_answer"):
            correct_answers += 1
    
    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    passed = score >= quiz["passing_score"]
    
    attempt_id = str(uuid.uuid4())
    attempt_doc = {
        "id": attempt_id,
        "quiz_id": quiz_id,
        "student_id": current_user["id"],
        "answers": answers_data,
        "score": score,
        "passed": passed,
        "completed_at": datetime.utcnow()
    }
    
    await db.quiz_attempts.insert_one(attempt_doc)
    
    # Update course progress if passed
    if passed:
        course = await db.courses.find_one({"id": quiz["course_id"]})
        if course:
            await db.courses.update_one(
                {"id": quiz["course_id"]},
                {"$inc": {"completed_sessions": 1}, "$set": {"updated_at": datetime.utcnow()}}
            )
    
    return {
        "attempt_id": attempt_id,
        "score": score,
        "passed": passed,
        "correct_answers": correct_answers,
        "total_questions": total_questions
    }

@app.get("/api/quiz-attempts/my/{quiz_id}")
async def get_my_quiz_attempts(quiz_id: str, current_user: dict = Depends(get_current_user)):
    """Get student's attempts for a specific quiz"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their quiz attempts")
    
    attempts_cursor = db.quiz_attempts.find({"quiz_id": quiz_id, "student_id": current_user["id"]})
    attempts = await attempts_cursor.to_list(length=None)
    return serialize_doc(attempts)

# Exam Management APIs
@app.post("/api/exams/schedule")
async def schedule_exam(
    course_id: str = Form(...),
    exam_date: str = Form(...),
    exam_location: str = Form(...),
    examiner_notes: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    """Schedule an exam for a course"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can schedule exams")
    
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Verify manager has access to this course
    enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
    school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
    if not school or school["manager_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to schedule exam for this course")
    
    try:
        exam_datetime = datetime.fromisoformat(exam_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid exam date format")
    
    exam_id = str(uuid.uuid4())
    exam_doc = {
        "id": exam_id,
        "course_id": course_id,
        "exam_date": exam_datetime,
        "exam_location": exam_location,
        "examiner_notes": examiner_notes,
        "status": "scheduled",
        "score": None,
        "passed": None,
        "examiner_feedback": "",
        "scheduled_by": current_user["id"],
        "created_at": datetime.utcnow()
    }
    
    await db.exams.insert_one(exam_doc)
    return {"id": exam_id, "message": "Exam scheduled successfully"}

@app.post("/api/exams/{exam_id}/complete")
async def complete_exam(
    exam_id: str,
    score: float = Form(...),
    passed: bool = Form(...),
    examiner_feedback: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    """Mark an exam as completed with results"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can complete exams")
    
    exam = await db.exams.find_one({"id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Update exam
    await db.exams.update_one(
        {"id": exam_id},
        {
            "$set": {
                "status": "completed",
                "score": score,
                "passed": passed,
                "examiner_feedback": examiner_feedback,
                "completed_at": datetime.utcnow(),
                "completed_by": current_user["id"]
            }
        }
    )
    
    # Update course exam status
    await db.courses.update_one(
        {"id": exam["course_id"]},
        {
            "$set": {
                "exam_status": ExamStatus.PASSED if passed else ExamStatus.FAILED,
                "exam_score": score,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Exam completed successfully"}

@app.get("/api/exams/course/{course_id}")
async def get_course_exams(course_id: str, current_user: dict = Depends(get_current_user)):
    """Get all exams for a course"""
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check access
    enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
    has_access = False
    if current_user["role"] == "student" and enrollment["student_id"] == current_user["id"]:
        has_access = True
    elif current_user["role"] in ["manager", "teacher"]:
        has_access = True
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to view course exams")
    
    exams_cursor = db.exams.find({"course_id": course_id})
    exams = await exams_cursor.to_list(length=None)
    return serialize_doc(exams)

# Teacher Assignment APIs
@app.post("/api/courses/{course_id}/assign-teacher")
async def assign_teacher_to_course(
    course_id: str,
    teacher_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Assign a teacher to a course"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can assign teachers")
    
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    teacher = await db.teachers.find_one({"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Verify teacher belongs to manager's school
    school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
    if not school or teacher["driving_school_id"] != school["id"]:
        raise HTTPException(status_code=403, detail="Teacher does not belong to your school")
    
    # Check gender compatibility for non-theory courses
    if course["course_type"] != CourseType.THEORY:
        enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
        student = await db.users.find_one({"id": enrollment["student_id"]})
        
        if student["gender"] == "female" and not teacher["can_teach_female"]:
            raise HTTPException(status_code=400, detail="This teacher cannot teach female students")
    
    # Update course
    await db.courses.update_one(
        {"id": course_id},
        {
            "$set": {
                "teacher_id": teacher_id,
                "status": CourseStatus.IN_PROGRESS,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Teacher assigned successfully"}

@app.post("/api/courses/{course_id}/auto-assign-teacher")
async def auto_assign_teacher(course_id: str, current_user: dict = Depends(get_current_user)):
    """Automatically assign a suitable teacher to a course"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can assign teachers")
    
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
    student = await db.users.find_one({"id": enrollment["student_id"]})
    school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
    
    # Find suitable teachers
    query = {"driving_school_id": school["id"]}
    if student["gender"] == "female":
        query["can_teach_female"] = True
    
    teachers_cursor = db.teachers.find(query)
    teachers = await teachers_cursor.to_list(length=None)
    
    if not teachers:
        raise HTTPException(status_code=404, detail="No suitable teachers found")
    
    # Select teacher with highest rating
    best_teacher = max(teachers, key=lambda t: t["rating"])
    
    # Update course
    await db.courses.update_one(
        {"id": course_id},
        {
            "$set": {
                "teacher_id": best_teacher["id"],
                "status": CourseStatus.IN_PROGRESS,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Teacher assigned automatically",
        "teacher_id": best_teacher["id"]
    }

# Session Scheduling APIs
@app.post("/api/sessions/schedule")
async def schedule_session(session_data: CourseSessionCreate, current_user: dict = Depends(get_current_user)):
    """Schedule a course session"""
    if current_user["role"] not in ["teacher", "manager"]:
        raise HTTPException(status_code=403, detail="Only teachers and managers can schedule sessions")
    
    course = await db.courses.find_one({"id": session_data.course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Verify access
    if current_user["role"] == "teacher" and course.get("teacher_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to schedule sessions for this course")
    
    session_id = str(uuid.uuid4())
    session_doc = {
        "id": session_id,
        "course_id": session_data.course_id,
        "teacher_id": course.get("teacher_id") or current_user["id"],
        "student_id": None,  # Will be populated from enrollment
        "scheduled_time": session_data.scheduled_time,
        "duration_minutes": session_data.duration_minutes,
        "status": "scheduled",
        "notes": None,
        "daily_room_url": None,
        "daily_room_name": None,
        "recording_url": None,
        "created_at": datetime.utcnow()
    }
    
    await db.course_sessions.insert_one(session_doc)
    return {"id": session_id, "message": "Session scheduled successfully"}

@app.get("/api/sessions/my")
async def get_my_sessions(current_user: dict = Depends(get_current_user)):
    """Get sessions for current user"""
    query = {}
    if current_user["role"] == "teacher":
        query["teacher_id"] = current_user["id"]
    elif current_user["role"] == "student":
        # Get student's enrollments first
        enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
        enrollments = await enrollments_cursor.to_list(length=None)
        course_ids = []
        for enrollment in enrollments:
            courses_cursor = db.courses.find({"enrollment_id": enrollment["id"]})
            courses = await courses_cursor.to_list(length=None)
            course_ids.extend([course["id"] for course in courses])
        query["course_id"] = {"$in": course_ids}
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    sessions_cursor = db.course_sessions.find(query)
    sessions = await sessions_cursor.to_list(length=None)
    
    # Enrich with course and enrollment data
    for session in sessions:
        course = await db.courses.find_one({"id": session["course_id"]})
        if course:
            session["course"] = serialize_doc(course)
            enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
            if enrollment:
                session["enrollment"] = serialize_doc(enrollment)
    
    return serialize_doc(sessions)

# Teacher Management APIs
@app.post("/api/teachers")
async def add_teacher(teacher_data: TeacherCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can add teachers")
    
    # Find the manager's driving school
    school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
    if not school:
        raise HTTPException(status_code=404, detail="Manager's driving school not found")
    
    teacher_id = str(uuid.uuid4())
    teacher_doc = {
        "id": teacher_id,
        "user_id": current_user["id"],  # Manager can add themselves as teacher
        "driving_school_id": school["id"],
        "driving_license_url": teacher_data.driving_license_url,
        "teaching_license_url": teacher_data.teaching_license_url,
        "photo_url": teacher_data.photo_url,
        "can_teach_male": teacher_data.can_teach_male,
        "can_teach_female": teacher_data.can_teach_female,
        "rating": 0.0,
        "total_reviews": 0,
        "created_at": datetime.utcnow()
    }
    
    await db.teachers.insert_one(teacher_doc)
    return {"id": teacher_id, "message": "Teacher added successfully"}

# Payment Integration APIs
@app.post("/api/payments/initiate")
async def initiate_payment(
    enrollment_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Initiate payment for an enrollment"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can initiate payments")
    
    enrollment = await db.enrollments.find_one({"id": enrollment_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if enrollment["student_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this enrollment")
    
    if enrollment["payment_status"] == PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    # Generate transaction ID
    transaction_id = f"DS_{enrollment_id}_{str(uuid.uuid4())[:8]}"
    
    # In a real implementation, you would integrate with Baridimob API here
    # For demo purposes, we'll simulate the payment process
    payment_doc = {
        "id": str(uuid.uuid4()),
        "enrollment_id": enrollment_id,
        "transaction_id": transaction_id,
        "amount": enrollment["amount"],
        "status": "pending",
        "payment_method": "baridimob",
        "created_at": datetime.utcnow()
    }
    
    await db.payments.insert_one(payment_doc)
    
    # In real implementation, redirect to Baridimob payment page
    payment_url = f"https://demo-payment.baridimob.dz/pay?transaction_id={transaction_id}&amount={enrollment['amount']}"
    
    return {
        "transaction_id": transaction_id,
        "payment_url": payment_url,
        "amount": enrollment["amount"],
        "message": "Payment initiated successfully"
    }

@app.post("/api/payments/complete")
async def complete_payment(
    transaction_id: str = Form(...),
    status: str = Form(...),  # success, failed, cancelled
    current_user: dict = Depends(get_current_user)
):
    """Complete payment process (webhook endpoint for payment gateway)"""
    payment = await db.payments.find_one({"transaction_id": transaction_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Update payment status
    payment_status = PaymentStatus.COMPLETED if status == "success" else PaymentStatus.FAILED
    
    await db.payments.update_one(
        {"transaction_id": transaction_id},
        {
            "$set": {
                "status": status,
                "completed_at": datetime.utcnow()
            }
        }
    )
    
    # Update enrollment
    await db.enrollments.update_one(
        {"id": payment["enrollment_id"]},
        {"$set": {"payment_status": payment_status}}
    )
    
    return {"message": f"Payment {status}", "status": payment_status}

@app.get("/api/payments/my")
async def get_my_payments(current_user: dict = Depends(get_current_user)):
    """Get payments for current user"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view payments")
    
    # Get student's enrollments
    enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
    enrollments = await enrollments_cursor.to_list(length=None)
    enrollment_ids = [e["id"] for e in enrollments]
    
    payments_cursor = db.payments.find({"enrollment_id": {"$in": enrollment_ids}})
    payments = await payments_cursor.to_list(length=None)
    
    return serialize_doc(payments)

# Rating and Review APIs
@app.post("/api/reviews/school")
async def rate_driving_school(
    school_id: str = Form(...),
    rating: float = Form(...),
    comment: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    """Rate and review a driving school"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can rate schools")
    
    if not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if student has completed enrollment at this school
    enrollment = await db.enrollments.find_one({
        "student_id": current_user["id"],
        "driving_school_id": school_id,
        "payment_status": PaymentStatus.COMPLETED
    })
    
    if not enrollment:
        raise HTTPException(status_code=403, detail="You must complete enrollment to rate this school")
    
    # Check if already reviewed
    existing_review = await db.school_reviews.find_one({
        "student_id": current_user["id"],
        "school_id": school_id
    })
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this school")
    
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "student_id": current_user["id"],
        "school_id": school_id,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.utcnow()
    }
    
    await db.school_reviews.insert_one(review_doc)
    
    # Update school rating
    await update_school_rating(school_id)
    
    return {"id": review_id, "message": "Review submitted successfully"}

@app.post("/api/reviews/teacher")
async def rate_teacher(
    teacher_id: str = Form(...),
    rating: float = Form(...),
    comment: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    """Rate and review a teacher"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can rate teachers")
    
    if not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if student has completed a course with this teacher
    courses_cursor = db.courses.find({"teacher_id": teacher_id, "status": CourseStatus.COMPLETED})
    courses = await courses_cursor.to_list(length=None)
    
    has_completed_course = False
    for course in courses:
        enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
        if enrollment and enrollment["student_id"] == current_user["id"]:
            has_completed_course = True
            break
    
    if not has_completed_course:
        raise HTTPException(status_code=403, detail="You must complete a course with this teacher to rate them")
    
    # Check if already reviewed
    existing_review = await db.teacher_reviews.find_one({
        "student_id": current_user["id"],
        "teacher_id": teacher_id
    })
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this teacher")
    
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "student_id": current_user["id"],
        "teacher_id": teacher_id,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.utcnow()
    }
    
    await db.teacher_reviews.insert_one(review_doc)
    
    # Update teacher rating
    await update_teacher_rating(teacher_id)
    
    return {"id": review_id, "message": "Review submitted successfully"}

@app.get("/api/reviews/school/{school_id}")
async def get_school_reviews(school_id: str, limit: int = 20, skip: int = 0):
    """Get reviews for a driving school"""
    reviews_cursor = db.school_reviews.find({"school_id": school_id}).skip(skip).limit(limit)
    reviews = await reviews_cursor.to_list(length=limit)
    
    # Enrich with student data
    for review in reviews:
        student = await db.users.find_one({"id": review["student_id"]})
        if student:
            review["student"] = {
                "first_name": student["first_name"],
                "last_name": student["last_name"]
            }
    
    return serialize_doc(reviews)

@app.get("/api/reviews/teacher/{teacher_id}")
async def get_teacher_reviews(teacher_id: str, limit: int = 20, skip: int = 0):
    """Get reviews for a teacher"""
    reviews_cursor = db.teacher_reviews.find({"teacher_id": teacher_id}).skip(skip).limit(limit)
    reviews = await reviews_cursor.to_list(length=limit)
    
    # Enrich with student data
    for review in reviews:
        student = await db.users.find_one({"id": review["student_id"]})
        if student:
            review["student"] = {
                "first_name": student["first_name"],
                "last_name": student["last_name"]
            }
    
    return serialize_doc(reviews)

# Helper functions for rating updates
async def update_school_rating(school_id: str):
    """Update school's average rating"""
    reviews_cursor = db.school_reviews.find({"school_id": school_id})
    reviews = await reviews_cursor.to_list(length=None)
    
    if reviews:
        total_rating = sum(review["rating"] for review in reviews)
        average_rating = total_rating / len(reviews)
        
        await db.driving_schools.update_one(
            {"id": school_id},
            {
                "$set": {
                    "rating": round(average_rating, 1),
                    "total_reviews": len(reviews)
                }
            }
        )

async def update_teacher_rating(teacher_id: str):
    """Update teacher's average rating"""
    reviews_cursor = db.teacher_reviews.find({"teacher_id": teacher_id})
    reviews = await reviews_cursor.to_list(length=None)
    
    if reviews:
        total_rating = sum(review["rating"] for review in reviews)
        average_rating = total_rating / len(reviews)
        
        await db.teachers.update_one(
            {"id": teacher_id},
            {
                "$set": {
                    "rating": round(average_rating, 1),
                    "total_reviews": len(reviews)
                }
            }
        )

@app.get("/api/teachers/my-school")
async def get_my_school_teachers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can view school teachers")
    
    # Find the manager's driving school
    school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
    if not school:
        raise HTTPException(status_code=404, detail="Manager's driving school not found")
    
    teachers_cursor = db.teachers.find({"driving_school_id": school["id"]})
    teachers = await teachers_cursor.to_list(length=None)
    
    # Enrich with user data
    for teacher in teachers:
        user = await db.users.find_one({"id": teacher["user_id"]})
        if user:
            teacher["user"] = serialize_doc(user)
    
    return serialize_doc(teachers)

# Course Management APIs
@app.get("/api/courses/my")
async def get_my_courses(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their courses")
    
    # Get student's enrollments
    enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
    enrollments = await enrollments_cursor.to_list(length=None)
    
    all_courses = []
    for enrollment in enrollments:
        courses_cursor = db.courses.find({"enrollment_id": enrollment["id"]})
        courses = await courses_cursor.to_list(length=None)
        
        # Enrich with school and teacher data
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        for course in courses:
            course["school"] = serialize_doc(school)
            course["enrollment"] = serialize_doc(enrollment)
            if course.get("teacher_id"):
                teacher = await db.teachers.find_one({"id": course["teacher_id"]})
                if teacher:
                    teacher_user = await db.users.find_one({"id": teacher["user_id"]})
                    teacher["user"] = serialize_doc(teacher_user)
                    course["teacher"] = serialize_doc(teacher)
        
        all_courses.extend(courses)
    
    return serialize_doc(all_courses)

@app.post("/api/courses/{course_id}/assign-teacher")
async def assign_teacher_to_course(course_id: str, teacher_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can assign teachers")
    
    # Verify course exists and belongs to manager's school
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
    school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
    
    if school["manager_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to manage this course")
    
    # Verify teacher exists and belongs to this school
    teacher = await db.teachers.find_one({"id": teacher_id, "driving_school_id": school["id"]})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found or not part of this school")
    
    # Check gender compatibility for park and road courses
    if course["course_type"] in [CourseType.PARK, CourseType.ROAD]:
        student = await db.users.find_one({"id": enrollment["student_id"]})
        if student["gender"] == "female" and not teacher["can_teach_female"]:
            raise HTTPException(status_code=400, detail="Teacher cannot teach female students")
    
    # Assign teacher
    await db.courses.update_one(
        {"id": course_id},
        {
            "$set": {
                "teacher_id": teacher_id,
                "status": CourseStatus.IN_PROGRESS,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Teacher assigned successfully"}

# Dashboard APIs
@app.get("/api/dashboard/student")
async def get_student_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student dashboard access only")
    
    # Get enrollments
    enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
    enrollments = await enrollments_cursor.to_list(length=None)
    
    dashboard_data = {
        "total_enrollments": len(enrollments),
        "active_enrollments": len([e for e in enrollments if e["is_approved"]]),
        "pending_payments": len([e for e in enrollments if e["payment_status"] == PaymentStatus.PENDING]),
        "enrollments": []
    }
    
    for enrollment in enrollments:
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        courses_cursor = db.courses.find({"enrollment_id": enrollment["id"]})
        courses = await courses_cursor.to_list(length=None)
        
        enrollment_data = {
            "enrollment": serialize_doc(enrollment),
            "school": serialize_doc(school),
            "courses": serialize_doc(courses),
            "progress": {
                "theory": {"completed": 0, "total": 0},
                "park": {"completed": 0, "total": 0},
                "road": {"completed": 0, "total": 0}
            }
        }
        
        for course in courses:
            course_type = course["course_type"].lower()
            enrollment_data["progress"][course_type] = {
                "completed": course["completed_sessions"],
                "total": course["total_sessions"]
            }
        
        dashboard_data["enrollments"].append(enrollment_data)
    
    return dashboard_data

@app.get("/api/dashboard/manager")
async def get_manager_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Manager dashboard access only")
    
    # Get manager's school
    school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
    if not school:
        return {"message": "No driving school found. Please create one first."}
    
    # Get enrollments for this school
    enrollments_cursor = db.enrollments.find({"driving_school_id": school["id"]})
    enrollments = await enrollments_cursor.to_list(length=None)
    
    # Get teachers
    teachers_cursor = db.teachers.find({"driving_school_id": school["id"]})
    teachers = await teachers_cursor.to_list(length=None)
    
    # Get courses
    enrollment_ids = [e["id"] for e in enrollments]
    courses_cursor = db.courses.find({"enrollment_id": {"$in": enrollment_ids}})
    courses = await courses_cursor.to_list(length=None)
    
    dashboard_data = {
        "school": serialize_doc(school),
        "total_students": len(enrollments),
        "active_students": len([e for e in enrollments if e["is_approved"]]),
        "pending_approvals": len([e for e in enrollments if not e["is_approved"]]),
        "total_teachers": len(teachers),
        "courses_summary": {
            "theory": len([c for c in courses if c["course_type"] == CourseType.THEORY]),
            "park": len([c for c in courses if c["course_type"] == CourseType.PARK]),
            "road": len([c for c in courses if c["course_type"] == CourseType.ROAD])
        },
        "recent_enrollments": serialize_doc(enrollments[-5:]),  # Last 5 enrollments
        "teachers": serialize_doc(teachers)
    }
    
    return dashboard_data

@app.get("/api/dashboard/teacher")
async def get_teacher_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Teacher dashboard access only")
    
    # Get teacher record
    teacher = await db.teachers.find_one({"user_id": current_user["id"]})
    if not teacher:
        return {"message": "Teacher profile not found. Please contact your school manager."}
    
    # Get assigned courses
    courses_cursor = db.courses.find({"teacher_id": teacher["id"]})
    courses = await courses_cursor.to_list(length=None)
    
    # Enrich with student and school data
    for course in courses:
        enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
        student = await db.users.find_one({"id": enrollment["student_id"]})
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        
        course["student"] = serialize_doc(student)
        course["school"] = serialize_doc(school)
        course["enrollment"] = serialize_doc(enrollment)
    
    dashboard_data = {
        "teacher": serialize_doc(teacher),
        "assigned_courses": len(courses),
        "active_courses": len([c for c in courses if c["status"] == CourseStatus.IN_PROGRESS]),
        "completed_courses": len([c for c in courses if c["status"] == CourseStatus.COMPLETED]),
        "courses": serialize_doc(courses)
    }
    
    return dashboard_data

# Payment endpoints (existing)
@app.post("/api/payments/baridimob/initiate")
async def initiate_baridimob_payment(enrollment_id: str, current_user: dict = Depends(get_current_user)):
    # Get enrollment
    enrollment = await db.enrollments.find_one({"id": enrollment_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if enrollment["student_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if enrollment["payment_status"] == PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    # TODO: Integrate with Baridimob API
    payment_data = {
        "payment_url": f"https://baridimob.payment.gateway.dz/pay/{enrollment_id}",
        "transaction_id": str(uuid.uuid4()),
        "amount": enrollment["amount"],
        "enrollment_id": enrollment_id,
        "message": "Redirect user to payment_url to complete payment"
    }
    
    return payment_data

@app.post("/api/payments/baridimob/callback")
async def baridimob_payment_callback(transaction_id: str, status: str, enrollment_id: str):
    enrollment = await db.enrollments.find_one({"id": enrollment_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if status == "success":
        await db.enrollments.update_one(
            {"id": enrollment_id},
            {"$set": {"payment_status": PaymentStatus.COMPLETED}}
        )
        return {"message": "Payment confirmed successfully"}
    else:
        await db.enrollments.update_one(
            {"id": enrollment_id},
            {"$set": {"payment_status": PaymentStatus.FAILED}}
        )
        return {"message": "Payment failed"}

# Include API router after all endpoints are defined
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
