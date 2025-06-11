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
    LOCKED = "locked"  # Can't start yet
    AVAILABLE = "available"  # Can start
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class ExamStatus(str, Enum):
    NOT_AVAILABLE = "not_available"
    AVAILABLE = "available"
    PASSED = "passed"
    FAILED = "failed"

class DocumentType(str, Enum):
    PROFILE_PHOTO = "profile_photo"
    ID_CARD = "id_card"
    MEDICAL_CERTIFICATE = "medical_certificate"
    DRIVING_LICENSE = "driving_license"
    TEACHING_LICENSE = "teaching_license"

class EnrollmentStatus(str, Enum):
    PENDING_PAYMENT = "pending_payment"
    PENDING_APPROVAL = "pending_approval"
    PENDING_DOCUMENTS = "pending_documents"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

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
    state: str
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
    is_approved: bool = False
    created_at: datetime

class TeacherCreate(BaseModel):
    email: str
    can_teach_male: bool = True
    can_teach_female: bool = True

class Enrollment(BaseModel):
    id: str
    student_id: str
    driving_school_id: str
    amount: float
    payment_status: PaymentStatus
    enrollment_status: EnrollmentStatus
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
    exam_status: ExamStatus = ExamStatus.NOT_AVAILABLE
    exam_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class DocumentUpload(BaseModel):
    id: str
    user_id: str
    document_type: DocumentType
    file_url: str
    file_name: str
    file_size: int
    upload_date: datetime
    is_verified: bool = False

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

# Course sequence order
COURSE_SEQUENCE = [CourseType.THEORY, CourseType.PARK, CourseType.ROAD]

# Required documents by role
REQUIRED_DOCUMENTS = {
    UserRole.STUDENT: [DocumentType.PROFILE_PHOTO, DocumentType.ID_CARD, DocumentType.MEDICAL_CERTIFICATE],
    UserRole.TEACHER: [DocumentType.PROFILE_PHOTO, DocumentType.ID_CARD, DocumentType.DRIVING_LICENSE, DocumentType.TEACHING_LICENSE],
    UserRole.MANAGER: [DocumentType.PROFILE_PHOTO, DocumentType.ID_CARD]
}

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    from bson import ObjectId
    from datetime import datetime
    
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
    if isinstance(doc, ObjectId):
        return str(doc)  # Convert ObjectId to string
    if isinstance(doc, datetime):
        return doc.isoformat()  # Convert datetime to ISO string
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

async def check_user_documents_complete(user_id: str, role: str) -> bool:
    """Check if user has uploaded and verified all required documents"""
    required_docs = REQUIRED_DOCUMENTS.get(role, [])
    
    documents_cursor = db.documents.find({
        "user_id": user_id,
        "is_verified": True,
        "document_type": {"$in": [doc.value for doc in required_docs]}
    })
    documents = await documents_cursor.to_list(length=None)
    
    uploaded_types = {doc["document_type"] for doc in documents}
    required_types = {doc.value for doc in required_docs}
    
    return required_types.issubset(uploaded_types)

async def update_course_availability(enrollment_id: str):
    """Update course availability based on completion status"""
    courses_cursor = db.courses.find({"enrollment_id": enrollment_id}).sort("course_type", 1)
    courses = await courses_cursor.to_list(length=None)
    
    # Sort courses by sequence
    course_order = {CourseType.THEORY: 0, CourseType.PARK: 1, CourseType.ROAD: 2}
    courses.sort(key=lambda x: course_order[x["course_type"]])
    
    for i, course in enumerate(courses):
        if i == 0:  # First course (theory) is always available
            if course["status"] == CourseStatus.LOCKED:
                await db.courses.update_one(
                    {"id": course["id"]},
                    {"$set": {"status": CourseStatus.AVAILABLE, "updated_at": datetime.utcnow()}}
                )
        else:
            # Check if previous course is completed and exam passed
            prev_course = courses[i-1]
            if prev_course["exam_status"] == ExamStatus.PASSED:
                if course["status"] == CourseStatus.LOCKED:
                    await db.courses.update_one(
                        {"id": course["id"]},
                        {"$set": {"status": CourseStatus.AVAILABLE, "updated_at": datetime.utcnow()}}
                    )
            else:
                # Lock the course if previous not completed
                if course["status"] != CourseStatus.LOCKED:
                    await db.courses.update_one(
                        {"id": course["id"]},
                        {"$set": {"status": CourseStatus.LOCKED, "updated_at": datetime.utcnow()}}
                    )

async def create_sequential_courses(enrollment_id: str):
    """Create courses with proper sequential logic"""
    courses = []
    course_configs = [
        {"type": CourseType.THEORY, "sessions": 10},
        {"type": CourseType.PARK, "sessions": 5}, 
        {"type": CourseType.ROAD, "sessions": 15}
    ]
    
    for i, course_config in enumerate(course_configs):
        course_id = str(uuid.uuid4())
        # Only first course (theory) is available initially
        initial_status = CourseStatus.AVAILABLE if i == 0 else CourseStatus.LOCKED
        
        course_doc = {
            "id": course_id,
            "enrollment_id": enrollment_id,
            "course_type": course_config["type"],
            "status": initial_status,
            "teacher_id": None,
            "scheduled_sessions": [],
            "completed_sessions": 0,
            "total_sessions": course_config["sessions"],
            "exam_status": ExamStatus.NOT_AVAILABLE,
            "exam_score": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        courses.append(course_doc)
    
    await db.courses.insert_many(courses)
    return courses

# Cloudinary upload function
async def upload_to_cloudinary(file: UploadFile, folder: str, resource_type: str = "auto"):
    """Upload file to Cloudinary"""
    try:
        file_content = await file.read()
        
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

# API Routes
@api_router.get("/health")
async def api_health_check():
    return {"status": "healthy", "message": "Driving School Platform API is running"}

@api_router.get("/states")
async def get_states():
    return {"states": ALGERIAN_STATES}

@api_router.post("/auth/register", response_model=dict)
async def register_user(
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    phone: str = Form(...),
    address: str = Form(...),
    date_of_birth: str = Form(...),
    gender: str = Form(...),
    state: str = Form(...),
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
        
        # Create user with default "guest" role
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
            "role": "guest",
            "state": state,
            "profile_photo_url": profile_photo_url,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.users.insert_one(user_data)
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email, "user_id": user_data["id"]}, 
            expires_delta=access_token_expires
        )
        
        # Return user data (exclude password hash)
        user_response = {k: v for k, v in user_data.items() if k != "password_hash"}
        user_response = serialize_doc(user_response)
        
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
    teachers_cursor = db.teachers.find({"driving_school_id": school_id, "is_approved": True})
    teachers = await teachers_cursor.to_list(length=None)
    
    # Enrich teachers with user data
    for teacher in teachers:
        user = await db.users.find_one({"id": teacher["user_id"]})
        if user:
            teacher["user"] = serialize_doc(user)
    
    serialized_school = serialize_doc(school)
    serialized_teachers = serialize_doc(teachers)
    serialized_school["teachers"] = serialized_teachers
    
    return serialized_school

@api_router.post("/driving-schools")
async def create_driving_school(
    name: str = Form(...),
    address: str = Form(...),
    state: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    logo: Optional[UploadFile] = File(None),
    photos: List[UploadFile] = File([]),
    current_user: dict = Depends(get_current_user)
):
    # Allow guests and managers to create driving schools
    if current_user["role"] not in ["guest", "manager"]:
        raise HTTPException(status_code=403, detail="Only guests and managers can create driving schools")
    
    if state not in ALGERIAN_STATES:
        raise HTTPException(status_code=400, detail="Invalid state")
    
    # If user is guest, upgrade them to manager role
    if current_user["role"] == "guest":
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"role": "manager"}}
        )
    
    # Handle logo upload
    logo_url = None
    if logo and logo.size > 0:
        try:
            upload_result = await upload_to_cloudinary(logo, "driving_schools/logos", "image")
            logo_url = upload_result["file_url"]
        except Exception as e:
            logger.warning(f"Failed to upload logo: {str(e)}")
    
    # Handle photos upload
    photo_urls = []
    if photos:
        for photo in photos:
            if photo.size > 0:
                try:
                    upload_result = await upload_to_cloudinary(photo, "driving_schools/photos", "image")
                    photo_urls.append(upload_result["file_url"])
                except Exception as e:
                    logger.warning(f"Failed to upload photo {photo.filename}: {str(e)}")
    
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
    
    role_message = " You are now a manager!" if current_user["role"] == "guest" else ""
    
    return {
        "id": school_id, 
        "message": f"Driving school created successfully!{role_message}",
        "logo_url": logo_url,
        "photos": photo_urls
    }

@api_router.post("/enrollments")
async def create_enrollment(enrollment_data: EnrollmentCreate, current_user: dict = Depends(get_current_user)):
    # Allow guests and students to enroll
    if current_user["role"] not in ["guest", "student"]:
        raise HTTPException(status_code=403, detail="Only guests and students can enroll")
    
    # Check if school exists
    school = await db.driving_schools.find_one({"id": enrollment_data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="Driving school not found")
    
    # Check if user already enrolled
    existing_enrollment = await db.enrollments.find_one({
        "student_id": current_user["id"],
        "driving_school_id": enrollment_data.school_id
    })
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this school")
    
    # If user is guest, upgrade them to student role
    if current_user["role"] == "guest":
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"role": "student"}}
        )
    
    enrollment_id = str(uuid.uuid4())
    enrollment_doc = {
        "id": enrollment_id,
        "student_id": current_user["id"],
        "driving_school_id": enrollment_data.school_id,
        "amount": school["price"],
        "payment_status": PaymentStatus.PENDING,
        "enrollment_status": EnrollmentStatus.PENDING_PAYMENT,
        "created_at": datetime.utcnow()
    }
    
    await db.enrollments.insert_one(enrollment_doc)
    
    # Create sequential courses
    await create_sequential_courses(enrollment_id)
    
    return {
        "enrollment_id": enrollment_id,
        "amount": school["price"],
        "message": "Enrollment created. You are now a student! Please proceed with payment and document upload."
    }

@api_router.post("/payments/complete")
async def complete_payment(
    enrollment_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Mark payment as completed (simplified for demo)"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can complete payments")
    
    enrollment = await db.enrollments.find_one({"id": enrollment_id, "student_id": current_user["id"]})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Update payment status and enrollment status
    await db.enrollments.update_one(
        {"id": enrollment_id},
        {
            "$set": {
                "payment_status": PaymentStatus.COMPLETED,
                "enrollment_status": EnrollmentStatus.PENDING_DOCUMENTS
            }
        }
    )
    
    return {"message": "Payment completed successfully. Please upload required documents."}

@api_router.get("/enrollments/my")
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
        
        # Check if documents are complete
        docs_complete = await check_user_documents_complete(current_user["id"], "student")
        enrollment["documents_complete"] = docs_complete
    
    return serialize_doc(enrollments)

# Document Upload APIs
@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a document"""
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
        
        # Delete existing document of same type for this user
        await db.documents.delete_many({
            "user_id": current_user["id"],
            "document_type": document_type
        })
        
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
        
        # If student and all documents uploaded, update enrollment status
        if current_user["role"] == "student":
            docs_complete = await check_user_documents_complete(current_user["id"], "student")
            if docs_complete:
                await db.enrollments.update_many(
                    {"student_id": current_user["id"], "enrollment_status": EnrollmentStatus.PENDING_DOCUMENTS},
                    {"$set": {"enrollment_status": EnrollmentStatus.PENDING_APPROVAL}}
                )
        
        return {
            "document_id": document_id,
            "file_url": upload_result["file_url"],
            "message": "Document uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@api_router.get("/documents/my")
async def get_my_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents for the current user"""
    documents_cursor = db.documents.find({"user_id": current_user["id"]})
    documents = await documents_cursor.to_list(length=None)
    return serialize_doc(documents)

@api_router.post("/documents/{document_id}/verify")
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

# Enrollment Management APIs
@api_router.get("/enrollments/pending")
async def get_pending_enrollments(current_user: dict = Depends(get_current_user)):
    """Get pending enrollments for manager to approve"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can view pending enrollments")
    
    # Find manager's school
    school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
    if not school:
        raise HTTPException(status_code=404, detail="Manager's driving school not found")
    
    # Get pending enrollments for this school
    enrollments_cursor = db.enrollments.find({
        "driving_school_id": school["id"],
        "enrollment_status": EnrollmentStatus.PENDING_APPROVAL
    })
    enrollments = await enrollments_cursor.to_list(length=None)
    
    # Enrich with student data and documents
    for enrollment in enrollments:
        student = await db.users.find_one({"id": enrollment["student_id"]})
        enrollment["student"] = serialize_doc(student)
        
        # Get student documents
        documents_cursor = db.documents.find({"user_id": enrollment["student_id"]})
        documents = await documents_cursor.to_list(length=None)
        enrollment["documents"] = serialize_doc(documents)
        
        # Check document completion
        docs_complete = await check_user_documents_complete(enrollment["student_id"], "student")
        enrollment["documents_complete"] = docs_complete
    
    return serialize_doc(enrollments)

@api_router.post("/enrollments/{enrollment_id}/approve")
async def approve_enrollment(
    enrollment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve a student enrollment"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can approve enrollments")
    
    enrollment = await db.enrollments.find_one({"id": enrollment_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Verify manager owns the school
    school = await db.driving_schools.find_one({
        "id": enrollment["driving_school_id"],
        "manager_id": current_user["id"]
    })
    if not school:
        raise HTTPException(status_code=403, detail="Not authorized to approve this enrollment")
    
    # Check if student has all required documents verified
    docs_complete = await check_user_documents_complete(enrollment["student_id"], "student")
    if not docs_complete:
        raise HTTPException(status_code=400, detail="Student documents are not complete or verified")
    
    # Update enrollment status
    await db.enrollments.update_one(
        {"id": enrollment_id},
        {
            "$set": {
                "enrollment_status": EnrollmentStatus.APPROVED,
                "approved_at": datetime.utcnow()
            }
        }
    )
    
    # Update course availability
    await update_course_availability(enrollment_id)
    
    return {"message": "Enrollment approved successfully"}

@api_router.post("/enrollments/{enrollment_id}/reject")
async def reject_enrollment(
    enrollment_id: str,
    reason: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Reject a student enrollment"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can reject enrollments")
    
    enrollment = await db.enrollments.find_one({"id": enrollment_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Verify manager owns the school
    school = await db.driving_schools.find_one({
        "id": enrollment["driving_school_id"],
        "manager_id": current_user["id"]
    })
    if not school:
        raise HTTPException(status_code=403, detail="Not authorized to reject this enrollment")
    
    # Update enrollment status
    await db.enrollments.update_one(
        {"id": enrollment_id},
        {
            "$set": {
                "enrollment_status": EnrollmentStatus.REJECTED,
                "rejection_reason": reason,
                "rejected_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Enrollment rejected"}

# Teacher Management APIs
@api_router.post("/teachers/add")
async def add_teacher(teacher_data: TeacherCreate, current_user: dict = Depends(get_current_user)):
    """Add a teacher to the driving school"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can add teachers")
    
    # Find the manager's driving school
    school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
    if not school:
        raise HTTPException(status_code=404, detail="Manager's driving school not found")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": teacher_data.email})
    
    if existing_user:
        # User exists - check if already a teacher at this school
        existing_teacher = await db.teachers.find_one({
            "user_id": existing_user["id"],
            "driving_school_id": school["id"]
        })
        if existing_teacher:
            raise HTTPException(status_code=400, detail="User is already a teacher at this school")
        
        # Add existing user as teacher
        user = existing_user
    else:
        # Create new user account for teacher with default password
        default_password = "teacher123"  # Simple default password
        password_hash = pwd_context.hash(default_password)
        
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "email": teacher_data.email,
            "password_hash": password_hash,
            "first_name": "Teacher",  # Default name - to be updated
            "last_name": "User",
            "phone": "",
            "address": "",
            "date_of_birth": datetime(1990, 1, 1),  # Default DOB
            "gender": "male",  # Default gender
            "role": "teacher",
            "state": school["state"],  # Use school's state
            "profile_photo_url": None,
            "created_at": datetime.utcnow(),
            "is_active": True,
            "created_by_manager": True,  # Flag to indicate teacher was added by manager
            "temp_password": default_password  # Store temp password for manager to share
        }
        
        await db.users.insert_one(user_data)
        user = user_data
    
    # Create teacher record
    teacher_id = str(uuid.uuid4())
    teacher_doc = {
        "id": teacher_id,
        "user_id": user["id"],
        "driving_school_id": school["id"],
        "driving_license_url": "",  # Will be filled when documents uploaded
        "teaching_license_url": "",
        "photo_url": "",
        "can_teach_male": teacher_data.can_teach_male,
        "can_teach_female": teacher_data.can_teach_female,
        "rating": 0.0,
        "total_reviews": 0,
        "is_approved": False,  # Manager needs to approve after documents uploaded
        "created_at": datetime.utcnow()
    }
    
    await db.teachers.insert_one(teacher_doc)
    
    # Assign teacher role to the user (in case of existing user)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"role": "teacher"}}
    )
    
    if existing_user:
        return {
            "id": teacher_id, 
            "message": f"Existing user {user['first_name']} {user['last_name']} added as teacher successfully. They can login with their existing credentials.",
            "login_info": {
                "email": user["email"],
                "message": "User can login with existing password"
            }
        }
    else:
        return {
            "id": teacher_id, 
            "message": f"New teacher account created successfully. They can login immediately.",
            "login_info": {
                "email": teacher_data.email,
                "temporary_password": default_password,
                "message": "Share these credentials with the teacher. They should update their profile after first login."
            }
        }

@api_router.get("/teachers/pending")
async def get_pending_teachers(current_user: dict = Depends(get_current_user)):
    """Get pending teachers for approval"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can view pending teachers")
    
    # Find manager's school
    school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
    if not school:
        raise HTTPException(status_code=404, detail="Manager's driving school not found")
    
    # Get pending teachers
    teachers_cursor = db.teachers.find({
        "driving_school_id": school["id"],
        "is_approved": False
    })
    teachers = await teachers_cursor.to_list(length=None)
    
    # Enrich with user data and documents
    for teacher in teachers:
        user = await db.users.find_one({"id": teacher["user_id"]})
        teacher["user"] = serialize_doc(user)
        
        # Get teacher documents
        documents_cursor = db.documents.find({"user_id": teacher["user_id"]})
        documents = await documents_cursor.to_list(length=None)
        teacher["documents"] = serialize_doc(documents)
        
        # Check document completion
        docs_complete = await check_user_documents_complete(teacher["user_id"], "teacher")
        teacher["documents_complete"] = docs_complete
    
    return serialize_doc(teachers)

@api_router.post("/teachers/{teacher_id}/approve")
async def approve_teacher(
    teacher_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve a teacher"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can approve teachers")
    
    teacher = await db.teachers.find_one({"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Verify manager owns the school
    school = await db.driving_schools.find_one({
        "id": teacher["driving_school_id"],
        "manager_id": current_user["id"]
    })
    if not school:
        raise HTTPException(status_code=403, detail="Not authorized to approve this teacher")
    
    # Check if teacher has all required documents verified
    docs_complete = await check_user_documents_complete(teacher["user_id"], "teacher")
    if not docs_complete:
        raise HTTPException(status_code=400, detail="Teacher documents are not complete or verified")
    
    # Update teacher status
    await db.teachers.update_one(
        {"id": teacher_id},
        {"$set": {"is_approved": True, "approved_at": datetime.utcnow()}}
    )
    
    return {"message": "Teacher approved successfully"}

# Course Management APIs
@api_router.post("/courses/{course_id}/complete-session")
async def complete_course_session(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a course session as completed"""
    if current_user["role"] not in ["teacher", "manager"]:
        raise HTTPException(status_code=403, detail="Only teachers and managers can complete sessions")
    
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if course is available and has assigned teacher
    if course["status"] != CourseStatus.IN_PROGRESS:
        if course["status"] == CourseStatus.LOCKED:
            raise HTTPException(status_code=400, detail="Course is locked. Complete previous course first.")
        elif course["status"] == CourseStatus.AVAILABLE:
            # Start the course
            await db.courses.update_one(
                {"id": course_id},
                {"$set": {"status": CourseStatus.IN_PROGRESS, "updated_at": datetime.utcnow()}}
            )
    
    # Increment completed sessions
    new_completed = course["completed_sessions"] + 1
    
    # Check if course is completed
    if new_completed >= course["total_sessions"]:
        # Course completed, make exam available
        await db.courses.update_one(
            {"id": course_id},
            {
                "$set": {
                    "completed_sessions": new_completed,
                    "status": CourseStatus.COMPLETED,
                    "exam_status": ExamStatus.AVAILABLE,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {"message": "Course completed! Exam is now available."}
    else:
        await db.courses.update_one(
            {"id": course_id},
            {
                "$set": {
                    "completed_sessions": new_completed,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        remaining = course["total_sessions"] - new_completed
        return {"message": f"Session completed! {remaining} sessions remaining."}

@api_router.post("/courses/{course_id}/take-exam")
async def take_exam(
    course_id: str,
    score: float = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Take/submit exam for a course"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can take exams")
    
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if exam is available
    if course["exam_status"] != ExamStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Exam is not available yet")
    
    # Determine if passed (passing score is 70%)
    passing_score = 70.0
    passed = score >= passing_score
    
    # Update course exam status
    exam_status = ExamStatus.PASSED if passed else ExamStatus.FAILED
    
    await db.courses.update_one(
        {"id": course_id},
        {
            "$set": {
                "exam_status": exam_status,
                "exam_score": score,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update course availability for enrollment
    await update_course_availability(course["enrollment_id"])
    
    if passed:
        # Check if this was the last course
        enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
        courses_cursor = db.courses.find({"enrollment_id": course["enrollment_id"]})
        courses = await courses_cursor.to_list(length=None)
        
        all_completed = all(c["exam_status"] == ExamStatus.PASSED for c in courses)
        
        if all_completed:
            # Mark enrollment as completed
            await db.enrollments.update_one(
                {"id": course["enrollment_id"]},
                {"$set": {"enrollment_status": EnrollmentStatus.COMPLETED}}
            )
            return {
                "message": "Congratulations! You passed the exam and completed ALL courses. You can now get your driving license!",
                "score": score,
                "passed": True,
                "driving_license_earned": True
            }
        else:
            return {
                "message": "Congratulations! You passed the exam. The next course is now available.",
                "score": score,
                "passed": True,
                "driving_license_earned": False
            }
    else:
        return {
            "message": f"You scored {score}%. You need {passing_score}% to pass. Please retake the course and exam.",
            "score": score,
            "passed": False,
            "driving_license_earned": False
        }

@api_router.get("/courses/{course_id}")
async def get_course_details(course_id: str, current_user: dict = Depends(get_current_user)):
    """Get course details"""
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get enrollment and check access
    enrollment = await db.enrollments.find_one({"id": course["enrollment_id"]})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Check access
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
        raise HTTPException(status_code=403, detail="Not authorized to view this course")
    
    # Enrich with enrollment and school data
    course["enrollment"] = serialize_doc(enrollment)
    
    school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
    course["school"] = serialize_doc(school)
    
    # Get teacher info if assigned
    if course.get("teacher_id"):
        teacher = await db.teachers.find_one({"id": course["teacher_id"]})
        if teacher:
            teacher_user = await db.users.find_one({"id": teacher["user_id"]})
            teacher["user"] = serialize_doc(teacher_user)
            course["teacher"] = serialize_doc(teacher)
    
    return serialize_doc(course)

# Dashboard APIs
@api_router.get("/dashboard/student")
async def get_student_dashboard(current_user: dict = Depends(get_current_user)):
    """Get student dashboard data"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can access student dashboard")
    
    # Get enrollments with detailed info
    enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
    enrollments = await enrollments_cursor.to_list(length=None)
    
    dashboard_data = {
        "total_enrollments": len(enrollments),
        "active_enrollments": len([e for e in enrollments if e["enrollment_status"] == EnrollmentStatus.APPROVED]),
        "pending_payments": len([e for e in enrollments if e["payment_status"] == PaymentStatus.PENDING]),
        "enrollments": []
    }
    
    # Enrich enrollments
    for enrollment in enrollments:
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        courses_cursor = db.courses.find({"enrollment_id": enrollment["id"]})
        courses = await courses_cursor.to_list(length=None)
        
        enriched_enrollment = {
            "enrollment": serialize_doc(enrollment),
            "school": serialize_doc(school),
            "courses": serialize_doc(courses),
            "progress": {
                "theory": {"completed": 0, "total": 0},
                "park": {"completed": 0, "total": 0},
                "road": {"completed": 0, "total": 0}
            }
        }
        
        # Calculate progress
        for course in courses:
            course_type = course["course_type"]
            enriched_enrollment["progress"][course_type] = {
                "completed": course["completed_sessions"],
                "total": course["total_sessions"]
            }
        
        dashboard_data["enrollments"].append(enriched_enrollment)
    
    # Get documents
    documents_cursor = db.documents.find({"user_id": current_user["id"]})
    documents = await documents_cursor.to_list(length=None)
    dashboard_data["documents"] = serialize_doc(documents)
    
    return dashboard_data

@api_router.get("/dashboard/manager")
async def get_manager_dashboard(current_user: dict = Depends(get_current_user)):
    """Get manager dashboard data"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can access manager dashboard")
    
    # Find manager's school
    school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
    if not school:
        return {"message": "No driving school found. Please create a driving school first."}
    
    # Get statistics
    total_students = await db.enrollments.count_documents({"driving_school_id": school["id"]})
    active_students = await db.enrollments.count_documents({
        "driving_school_id": school["id"],
        "enrollment_status": EnrollmentStatus.APPROVED
    })
    pending_approvals = await db.enrollments.count_documents({
        "driving_school_id": school["id"],
        "enrollment_status": EnrollmentStatus.PENDING_APPROVAL
    })
    
    # Get teachers
    teachers_cursor = db.teachers.find({"driving_school_id": school["id"]})
    teachers = await teachers_cursor.to_list(length=None)
    
    # Enrich teachers with user data
    for teacher in teachers:
        user = await db.users.find_one({"id": teacher["user_id"]})
        teacher["user"] = serialize_doc(user)
        
        # Get documents
        documents_cursor = db.documents.find({"user_id": teacher["user_id"]})
        documents = await documents_cursor.to_list(length=None)
        teacher["documents"] = serialize_doc(documents)
    
    return {
        "school": serialize_doc(school),
        "total_students": total_students,
        "active_students": active_students,
        "pending_approvals": pending_approvals,
        "total_teachers": len(teachers),
        "teachers": serialize_doc(teachers)
    }

# Include API router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
