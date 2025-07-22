from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.core.database import get_db
from app.models.models import Audit, AuditItem
from app.schemas.schemas import (
    PhotoAnalysisRequest, PhotoAnalysisResponse,
    ReportGenerationRequest, ReportGenerationResponse,
    ScoreSuggestionRequest, ScoreSuggestionResponse
)
from app.services.gemini_service import gemini_service
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.post("/analyze-photo", response_model=PhotoAnalysisResponse)
async def analyze_photo(
    request: PhotoAnalysisRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Analyze a photo using Gemini Vision AI"""
    try:
        analysis = await gemini_service.analyze_audit_photo(
            request.image_base64, 
            request.context, 
            request.audit_item_id
        )
        return PhotoAnalysisResponse(**analysis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze photo: {str(e)}")

@router.post("/generate-report", response_model=ReportGenerationResponse)
async def generate_report(
    request: ReportGenerationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate an audit report using Gemini AI"""
    try:
        # Get audit data
        audit = db.query(Audit).options(
            joinedload(Audit.property),
            joinedload(Audit.auditor),
            joinedload(Audit.audit_items)
        ).filter(Audit.id == request.audit_id).first()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        
        # Prepare audit data for AI
        audit_data = {
            "property_name": audit.property.name if audit.property else "Unknown",
            "location": audit.property.location if audit.property else "Unknown",
            "audit_date": audit.created_at.isoformat(),
            "audit_type": "Standard Audit",
            "overall_score": audit.overall_score,
            "compliance_zone": audit.compliance_zone,
            "audit_items": [
                {
                    "section": item.section,
                    "item": item.item_name,
                    "score": item.score,
                    "comments": item.comments
                } 
                for item in audit.audit_items or []
            ]
        }
        
        report = await gemini_service.generate_audit_report(audit_data)
        return ReportGenerationResponse(**report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.post("/suggest-score", response_model=ScoreSuggestionResponse)
async def suggest_score(
    request: ScoreSuggestionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get AI-powered score suggestions"""
    try:
        # For demo purposes, we'll use a generic item description
        item_description = f"Audit item {request.audit_item_id}"
        
        suggestion = await gemini_service.suggest_audit_score(
            item_description, 
            request.observations
        )
        return ScoreSuggestionResponse(**suggestion)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to suggest score: {str(e)}")

@router.get("/health")
async def ai_health_check():
    """Check AI service health"""
    try:
        # Simple health check
        return {
            "status": "healthy",
            "ai_service": "gemini",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service unhealthy: {str(e)}")
