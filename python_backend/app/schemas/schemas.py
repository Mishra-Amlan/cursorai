from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    auditor = "auditor"
    reviewer = "reviewer"
    corporate = "corporate"
    hotelgm = "hotelgm"

class ComplianceZone(str, Enum):
    green = "green"
    amber = "amber"
    red = "red"

class AuditStatus(str, Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    submitted = "submitted"
    reviewed = "reviewed"
    completed = "completed"

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str
    password: str

# User schemas
class UserBase(BaseModel):
    username: str
    name: str
    email: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Property schemas
class PropertyBase(BaseModel):
    name: str
    location: str
    region: str
    image: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    id: int
    last_audit_score: Optional[int] = None
    next_audit_date: Optional[datetime] = None
    status: Optional[str] = "green"
    created_at: datetime
    
    class Config:
        from_attributes = True

# Audit schemas - Fixed to match database model
class AuditBase(BaseModel):
    property_id: int
    auditor_id: Optional[int] = None
    reviewer_id: Optional[int] = None

class AuditCreate(AuditBase):
    pass

class AuditUpdate(BaseModel):
    status: Optional[str] = None
    reviewer_id: Optional[int] = None
    overall_score: Optional[int] = None
    cleanliness_score: Optional[int] = None
    branding_score: Optional[int] = None
    operational_score: Optional[int] = None
    compliance_zone: Optional[str] = None
    findings: Optional[Dict[str, Any]] = None
    action_plan: Optional[Dict[str, Any]] = None
    ai_report: Optional[Dict[str, Any]] = None
    ai_insights: Optional[Dict[str, Any]] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

class AuditResponse(AuditBase):
    id: int
    status: str
    overall_score: Optional[int] = None
    cleanliness_score: Optional[int] = None
    branding_score: Optional[int] = None
    operational_score: Optional[int] = None
    compliance_zone: Optional[str] = None
    findings: Optional[Dict[str, Any]] = None
    action_plan: Optional[Dict[str, Any]] = None
    ai_report: Optional[Dict[str, Any]] = None
    ai_insights: Optional[Dict[str, Any]] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    property: Optional[PropertyResponse] = None
    auditor: Optional[UserResponse] = None
    reviewer: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Audit Item schemas
class AuditItemBase(BaseModel):
    audit_id: int
    section: str
    item_name: str
    description: str
    is_compliant: Optional[bool] = None
    score: Optional[float] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class AuditItemCreate(AuditItemBase):
    pass

class AuditItemUpdate(BaseModel):
    is_compliant: Optional[bool] = None
    score: Optional[float] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class AuditItemResponse(AuditItemBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# AI Integration schemas
class PhotoAnalysisRequest(BaseModel):
    image_base64: str
    context: str
    audit_item_id: Optional[int] = None

class PhotoAnalysisResponse(BaseModel):
    compliance_status: str
    confidence_score: float
    observations: List[str]
    suggestions: List[str]
    ai_score: Optional[float] = None

class ReportGenerationRequest(BaseModel):
    audit_id: int

class ReportGenerationResponse(BaseModel):
    summary: str
    key_findings: List[str]
    recommendations: List[str]
    compliance_overview: Dict[str, Any]
    ai_insights: Dict[str, Any]

class ScoreSuggestionRequest(BaseModel):
    audit_item_id: int
    observations: str

class ScoreSuggestionResponse(BaseModel):
    suggested_score: float
    confidence: float
    reasoning: str
    compliance_zone: str
