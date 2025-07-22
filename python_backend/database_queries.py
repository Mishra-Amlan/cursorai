"""
HOTEL AUDIT MANAGEMENT SYSTEM - SQLALCHEMY ORM QUERIES
================================================================
Complete database queries using SQLAlchemy ORM for the hotel audit application
This file contains all the database operations used in the FastAPI backend
================================================================
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, desc, asc, case, extract, text
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.models.models import User, Property, Audit, AuditItem
from app.core.security import get_password_hash

class DatabaseQueries:
    """
    Database query class containing all SQL operations for the application
    """
    
    def __init__(self, db: Session):
        self.db = db

    # ================================================================
    # USER MANAGEMENT QUERIES
    # ================================================================
    
    def create_user(self, username: str, password: str, role: str, name: str, email: str) -> User:
        """Create a new user with hashed password"""
        hashed_password = get_password_hash(password)
        user = User(
            username=username,
            password=hashed_password,
            role=role,
            name=name,
            email=email
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username for authentication"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_users_by_role(self, role: str) -> List[User]:
        """Get all users by role"""
        return self.db.query(User).filter(User.role == role).order_by(User.name).all()
    
    def get_user_statistics(self) -> List[Dict]:
        """Get user statistics by role"""
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        return self.db.query(
            User.role,
            func.count(User.id).label('user_count'),
            func.count(case((User.created_at > thirty_days_ago, User.id))).label('new_users_last_30_days')
        ).group_by(User.role).order_by(desc('user_count')).all()
    
    def update_user(self, user_id: int, **kwargs) -> Optional[User]:
        """Update user information"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            for key, value in kwargs.items():
                setattr(user, key, value)
            self.db.commit()
            self.db.refresh(user)
        return user

    # ================================================================
    # PROPERTY MANAGEMENT QUERIES
    # ================================================================
    
    def create_property(self, name: str, location: str, region: str, 
                       image: str = None, status: str = "green") -> Property:
        """Create a new property"""
        property = Property(
            name=name,
            location=location,
            region=region,
            image=image,
            status=status
        )
        self.db.add(property)
        self.db.commit()
        self.db.refresh(property)
        return property
    
    def get_all_properties(self) -> List[Property]:
        """Get all properties"""
        return self.db.query(Property).order_by(Property.name).all()
    
    def get_properties_with_latest_audit(self) -> List[Dict]:
        """Get properties with latest audit information"""
        # Subquery to get latest audit for each property
        latest_audit_subq = self.db.query(
            Audit.property_id,
            func.max(Audit.id).label('max_audit_id')
        ).group_by(Audit.property_id).subquery()
        
        return self.db.query(
            Property,
            Audit.overall_score.label('latest_score'),
            Audit.compliance_zone.label('latest_compliance'),
            Audit.created_at.label('last_audit_date'),
            User.name.label('last_auditor_name')
        ).outerjoin(
            latest_audit_subq, Property.id == latest_audit_subq.c.property_id
        ).outerjoin(
            Audit, Audit.id == latest_audit_subq.c.max_audit_id
        ).outerjoin(
            User, Audit.auditor_id == User.id
        ).order_by(Property.name).all()
    
    def get_properties_by_region(self, region: str) -> List[Property]:
        """Get properties by region"""
        return self.db.query(Property).filter(
            Property.region == region
        ).order_by(desc(Property.last_audit_score)).all()
    
    def get_properties_needing_audit(self) -> List[Property]:
        """Get properties that need audits (overdue or never audited)"""
        today = datetime.utcnow().date()
        return self.db.query(Property).filter(
            or_(
                Property.next_audit_date.is_(None),
                Property.next_audit_date < today
            )
        ).order_by(Property.next_audit_date.asc().nullsfirst()).all()
    
    def update_property_status(self, property_id: int, score: int) -> Property:
        """Update property status based on audit score"""
        property = self.db.query(Property).filter(Property.id == property_id).first()
        if property:
            if score >= 80:
                property.status = "green"
            elif score >= 60:
                property.status = "amber"
            else:
                property.status = "red"
            
            property.last_audit_score = score
            property.next_audit_date = datetime.utcnow() + timedelta(days=90)  # 3 months
            self.db.commit()
            self.db.refresh(property)
        return property
    
    def get_property_performance_by_region(self) -> List[Dict]:
        """Get property performance summary by region"""
        return self.db.query(
            Property.region,
            func.count(Property.id).label('total_properties'),
            func.avg(Property.last_audit_score).label('avg_score'),
            func.count(case((Property.status == 'green', Property.id))).label('green_properties'),
            func.count(case((Property.status == 'amber', Property.id))).label('amber_properties'),
            func.count(case((Property.status == 'red', Property.id))).label('red_properties')
        ).group_by(Property.region).order_by(desc('avg_score')).all()

    # ================================================================
    # AUDIT MANAGEMENT QUERIES
    # ================================================================
    
    def create_audit(self, property_id: int, auditor_id: int = None, 
                    reviewer_id: int = None, status: str = "scheduled") -> Audit:
        """Create a new audit"""
        audit = Audit(
            property_id=property_id,
            auditor_id=auditor_id,
            reviewer_id=reviewer_id,
            status=status
        )
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(audit)
        return audit
    
    def get_all_audits_with_details(self) -> List[Audit]:
        """Get all audits with property, auditor, and reviewer details"""
        return self.db.query(Audit).options(
            joinedload(Audit.property),
            joinedload(Audit.auditor),
            joinedload(Audit.reviewer)
        ).order_by(desc(Audit.created_at)).all()
    
    def get_audits_by_status(self, status: str) -> List[Audit]:
        """Get audits by status"""
        return self.db.query(Audit).options(
            joinedload(Audit.property),
            joinedload(Audit.auditor)
        ).filter(Audit.status == status).order_by(Audit.created_at).all()
    
    def get_audits_by_auditor(self, auditor_id: int, 
                             status_list: List[str] = None) -> List[Audit]:
        """Get audits assigned to specific auditor"""
        query = self.db.query(Audit).options(
            joinedload(Audit.property)
        ).filter(Audit.auditor_id == auditor_id)
        
        if status_list:
            query = query.filter(Audit.status.in_(status_list))
        
        return query.order_by(Audit.created_at).all()
    
    def update_audit_scores(self, audit_id: int, overall_score: int, 
                           cleanliness_score: int = None, branding_score: int = None,
                           operational_score: int = None, compliance_zone: str = None,
                           findings: Dict = None, action_plan: Dict = None) -> Audit:
        """Update audit with scores and completion data"""
        audit = self.db.query(Audit).filter(Audit.id == audit_id).first()
        if audit:
            audit.overall_score = overall_score
            if cleanliness_score is not None:
                audit.cleanliness_score = cleanliness_score
            if branding_score is not None:
                audit.branding_score = branding_score
            if operational_score is not None:
                audit.operational_score = operational_score
            if compliance_zone:
                audit.compliance_zone = compliance_zone
            if findings:
                audit.findings = findings
            if action_plan:
                audit.action_plan = action_plan
            
            audit.status = "submitted"
            audit.submitted_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(audit)
        return audit
    
    def assign_reviewer(self, audit_id: int, reviewer_id: int) -> Audit:
        """Assign reviewer to audit"""
        audit = self.db.query(Audit).filter(Audit.id == audit_id).first()
        if audit:
            audit.reviewer_id = reviewer_id
            audit.status = "reviewed"
            audit.reviewed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(audit)
        return audit
    
    def get_audit_statistics(self) -> List[Dict]:
        """Get audit completion statistics"""
        return self.db.query(
            Audit.status,
            func.count(Audit.id).label('count'),
            func.avg(Audit.overall_score).label('avg_score'),
            func.avg(
                extract('days', Audit.submitted_at - Audit.created_at)
            ).label('avg_completion_days')
        ).filter(Audit.submitted_at.isnot(None)).group_by(Audit.status).all()
    
    def get_monthly_audit_trend(self, months: int = 12) -> List[Dict]:
        """Get monthly audit trend"""
        start_date = datetime.utcnow() - timedelta(days=months*30)
        
        return self.db.query(
            func.date_trunc('month', Audit.created_at).label('month'),
            func.count(Audit.id).label('total_audits'),
            func.count(case((Audit.status == 'completed', Audit.id))).label('completed_audits'),
            func.avg(Audit.overall_score).label('avg_score')
        ).filter(Audit.created_at >= start_date).group_by(
            func.date_trunc('month', Audit.created_at)
        ).order_by('month').all()

    # ================================================================
    # AUDIT ITEMS QUERIES
    # ================================================================
    
    def create_audit_items(self, items_data: List[Dict]) -> List[AuditItem]:
        """Create multiple audit items for an audit"""
        items = []
        for item_data in items_data:
            item = AuditItem(**item_data)
            self.db.add(item)
            items.append(item)
        
        self.db.commit()
        for item in items:
            self.db.refresh(item)
        return items
    
    def get_audit_items(self, audit_id: int) -> List[AuditItem]:
        """Get all items for specific audit"""
        return self.db.query(AuditItem).options(
            joinedload(AuditItem.audit).joinedload(Audit.property)
        ).filter(AuditItem.audit_id == audit_id).order_by(
            AuditItem.category, AuditItem.item
        ).all()
    
    def get_items_by_category_performance(self) -> List[Dict]:
        """Get average performance by category and item"""
        return self.db.query(
            AuditItem.category,
            AuditItem.item,
            func.avg(AuditItem.score).label('avg_score'),
            func.count(AuditItem.id).label('total_assessments'),
            func.count(case((AuditItem.score >= 80, AuditItem.id))).label('high_scores')
        ).filter(AuditItem.score.isnot(None)).group_by(
            AuditItem.category, AuditItem.item
        ).order_by(AuditItem.category, desc('avg_score')).all()
    
    def update_audit_item_with_ai(self, item_id: int, ai_analysis: Dict, 
                                  ai_suggested_score: int, score: int = None, 
                                  comments: str = None) -> AuditItem:
        """Update audit item with AI analysis"""
        item = self.db.query(AuditItem).filter(AuditItem.id == item_id).first()
        if item:
            item.ai_analysis = ai_analysis
            item.ai_suggested_score = ai_suggested_score
            if score is not None:
                item.score = score
            if comments:
                item.comments = comments
            self.db.commit()
            self.db.refresh(item)
        return item
    
    def get_low_score_items(self, threshold: int = 70) -> List[AuditItem]:
        """Get items with scores below threshold (needing attention)"""
        return self.db.query(AuditItem).options(
            joinedload(AuditItem.audit).joinedload(Audit.property)
        ).filter(AuditItem.score < threshold).order_by(
            AuditItem.score, desc(AuditItem.audit.has(Audit.created_at))
        ).all()

    # ================================================================
    # COMPLIANCE AND REPORTING QUERIES
    # ================================================================
    
    def get_compliance_dashboard(self) -> Dict:
        """Get overall compliance dashboard data"""
        result = self.db.query(
            func.count(func.distinct(Property.id)).label('total_properties'),
            func.count(func.distinct(Audit.id)).label('total_audits'),
            func.avg(Audit.overall_score).label('avg_overall_score'),
            func.count(case((Audit.compliance_zone == 'green', Audit.id))).label('green_audits'),
            func.count(case((Audit.compliance_zone == 'amber', Audit.id))).label('amber_audits'),
            func.count(case((Audit.compliance_zone == 'red', Audit.id))).label('red_audits')
        ).select_from(Property).outerjoin(Audit).filter(
            Audit.status == 'completed'
        ).first()
        
        return {
            'total_properties': result.total_properties or 0,
            'total_audits': result.total_audits or 0,
            'avg_overall_score': float(result.avg_overall_score or 0),
            'green_audits': result.green_audits or 0,
            'amber_audits': result.amber_audits or 0,
            'red_audits': result.red_audits or 0
        }
    
    def get_property_compliance_trend(self) -> List[Dict]:
        """Get compliance trend for each property"""
        return self.db.query(
            Property.name,
            Property.location,
            func.count(Audit.id).label('total_audits'),
            func.avg(Audit.overall_score).label('avg_score'),
            func.max(Audit.created_at).label('last_audit_date'),
            func.string_agg(func.distinct(Audit.compliance_zone), ', ').label('compliance_zones')
        ).outerjoin(Audit).group_by(
            Property.id, Property.name, Property.location
        ).order_by(desc('avg_score')).all()
    
    def get_auditor_performance(self) -> List[Dict]:
        """Get auditor performance statistics"""
        return self.db.query(
            User.name.label('auditor_name'),
            func.count(Audit.id).label('total_audits'),
            func.avg(Audit.overall_score).label('avg_score_given'),
            func.avg(
                extract('days', Audit.submitted_at - Audit.created_at)
            ).label('avg_completion_days'),
            func.count(case((Audit.status == 'completed', Audit.id))).label('completed_audits')
        ).outerjoin(Audit).filter(User.role == 'auditor').group_by(
            User.id, User.name
        ).order_by(desc('total_audits')).all()
    
    def get_category_performance(self) -> List[Dict]:
        """Get category-wise performance analysis"""
        return self.db.query(
            AuditItem.category,
            func.count(AuditItem.id).label('total_items'),
            func.avg(AuditItem.score).label('avg_score'),
            func.min(AuditItem.score).label('min_score'),
            func.max(AuditItem.score).label('max_score'),
            func.stddev(AuditItem.score).label('score_variance')
        ).filter(AuditItem.score.isnot(None)).group_by(
            AuditItem.category
        ).order_by(desc('avg_score')).all()
    
    def get_properties_requiring_attention(self) -> List[Dict]:
        """Get properties requiring immediate attention"""
        # Subquery for latest audit per property
        latest_audit_subq = self.db.query(
            Audit.property_id,
            func.max(Audit.id).label('max_audit_id')
        ).group_by(Audit.property_id).subquery()
        
        return self.db.query(
            Property.name,
            Property.location,
            Property.status,
            Audit.overall_score,
            Audit.compliance_zone,
            Audit.created_at.label('last_audit_date'),
            (func.current_date() - func.date(Audit.created_at)).label('days_since_audit')
        ).join(
            latest_audit_subq, Property.id == latest_audit_subq.c.property_id
        ).join(
            Audit, Audit.id == latest_audit_subq.c.max_audit_id
        ).filter(
            or_(
                Audit.compliance_zone == 'red',
                Audit.overall_score < 60
            )
        ).order_by(Audit.overall_score, desc('days_since_audit')).all()

    # ================================================================
    # AI INTEGRATION QUERIES
    # ================================================================
    
    def update_audit_with_ai_report(self, audit_id: int, ai_report: Dict, 
                                   ai_insights: Dict) -> Audit:
        """Update audit with AI-generated report and insights"""
        audit = self.db.query(Audit).filter(Audit.id == audit_id).first()
        if audit:
            audit.ai_report = ai_report
            audit.ai_insights = ai_insights
            self.db.commit()
            self.db.refresh(audit)
        return audit
    
    def get_audits_with_ai_analysis(self) -> List[Audit]:
        """Get audits that have AI analysis"""
        return self.db.query(Audit).options(
            joinedload(Audit.property)
        ).filter(Audit.ai_report.isnot(None)).order_by(
            desc(Audit.created_at)
        ).all()
    
    def get_ai_score_accuracy(self) -> List[Dict]:
        """Compare AI-suggested scores vs actual scores"""
        return self.db.query(
            AuditItem.category,
            AuditItem.item,
            AuditItem.ai_suggested_score,
            AuditItem.score.label('actual_score'),
            func.abs(AuditItem.ai_suggested_score - AuditItem.score).label('score_difference'),
            AuditItem.ai_analysis['confidence'].label('ai_confidence')
        ).filter(
            and_(
                AuditItem.ai_suggested_score.isnot(None),
                AuditItem.score.isnot(None)
            )
        ).order_by(desc('score_difference')).all()

    # ================================================================
    # ADVANCED ANALYTICS QUERIES
    # ================================================================
    
    def get_seasonal_performance(self, years: int = 2) -> List[Dict]:
        """Get seasonal audit performance"""
        start_date = datetime.utcnow() - timedelta(days=years*365)
        
        return self.db.query(
            extract('quarter', Audit.created_at).label('quarter'),
            extract('year', Audit.created_at).label('year'),
            func.count(Audit.id).label('total_audits'),
            func.avg(Audit.overall_score).label('avg_score'),
            (func.count(case((Audit.compliance_zone == 'green', Audit.id))) * 100.0 / 
             func.count(Audit.id)).label('green_percentage')
        ).filter(Audit.created_at >= start_date).group_by(
            extract('quarter', Audit.created_at),
            extract('year', Audit.created_at)
        ).order_by('year', 'quarter').all()
    
    def get_property_improvement_tracking(self) -> List[Dict]:
        """Track property improvement over time"""
        # Using window functions to compare consecutive audits
        audit_sequence = self.db.query(
            Audit.property_id,
            Audit.overall_score,
            Audit.created_at,
            func.row_number().over(
                partition_by=Audit.property_id,
                order_by=Audit.created_at
            ).label('audit_sequence'),
            func.lag(Audit.overall_score).over(
                partition_by=Audit.property_id,
                order_by=Audit.created_at
            ).label('previous_score')
        ).filter(Audit.overall_score.isnot(None)).subquery()
        
        return self.db.query(
            Property.name,
            audit_sequence.c.overall_score.label('current_score'),
            audit_sequence.c.previous_score,
            (audit_sequence.c.overall_score - audit_sequence.c.previous_score).label('score_improvement'),
            audit_sequence.c.audit_sequence.label('total_audits')
        ).join(
            audit_sequence, Property.id == audit_sequence.c.property_id
        ).filter(
            audit_sequence.c.previous_score.isnot(None)
        ).order_by(desc('score_improvement')).all()
    
    def get_risk_assessment(self) -> List[Dict]:
        """Generate risk assessment for properties"""
        # Subquery for latest audit per property
        latest_audit_subq = self.db.query(
            Audit.property_id,
            func.max(Audit.id).label('max_audit_id')
        ).group_by(Audit.property_id).subquery()
        
        return self.db.query(
            Property.name,
            Property.location,
            Audit.overall_score,
            Audit.compliance_zone,
            (func.current_date() - func.date(Audit.created_at)).label('days_since_audit'),
            case(
                (Audit.compliance_zone == 'red', 'HIGH'),
                (and_(
                    Audit.compliance_zone == 'amber',
                    func.current_date() - func.date(Audit.created_at) > 90
                ), 'HIGH'),
                (Audit.compliance_zone == 'amber', 'MEDIUM'),
                (func.current_date() - func.date(Audit.created_at) > 180, 'MEDIUM'),
                else_='LOW'
            ).label('risk_level')
        ).outerjoin(
            latest_audit_subq, Property.id == latest_audit_subq.c.property_id
        ).outerjoin(
            Audit, Audit.id == latest_audit_subq.c.max_audit_id
        ).order_by(
            case(
                (Audit.compliance_zone == 'red', 1),
                (Audit.compliance_zone == 'amber', 2),
                else_=3
            ),
            desc('days_since_audit')
        ).all()

    # ================================================================
    # UTILITY METHODS
    # ================================================================
    
    def bulk_insert_sample_data(self):
        """Insert sample data for testing"""
        # This method can be used to populate the database with test data
        # Implementation would depend on specific requirements
        pass
    
    def cleanup_old_data(self, days: int = 1095):  # 3 years
        """Clean up old audit data"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Delete old audit items first (foreign key constraint)
        old_audit_items = self.db.query(AuditItem).join(Audit).filter(
            Audit.created_at < cutoff_date
        ).delete(synchronize_session=False)
        
        # Delete old audits
        old_audits = self.db.query(Audit).filter(
            Audit.created_at < cutoff_date
        ).delete(synchronize_session=False)
        
        self.db.commit()
        return {'deleted_items': old_audit_items, 'deleted_audits': old_audits}
    
    def update_property_audit_schedules(self):
        """Update next audit dates for properties"""
        today = datetime.utcnow().date()
        next_audit_date = datetime.utcnow() + timedelta(days=90)  # 3 months
        
        updated = self.db.query(Property).filter(
            Property.next_audit_date < today
        ).update({
            Property.next_audit_date: next_audit_date
        }, synchronize_session=False)
        
        self.db.commit()
        return updated

# ================================================================
# USAGE EXAMPLES
# ================================================================

def example_usage():
    """
    Example usage of the DatabaseQueries class
    """
    # Assuming you have a database session
    # db = SessionLocal()
    # queries = DatabaseQueries(db)
    
    # # Create a new user
    # new_user = queries.create_user(
    #     username="john.doe",
    #     password="password123",
    #     role="auditor",
    #     name="John Doe",
    #     email="john.doe@hotel-audit.com"
    # )
    
    # # Get properties needing audit
    # properties_needing_audit = queries.get_properties_needing_audit()
    
    # # Create a new audit
    # new_audit = queries.create_audit(
    #     property_id=1,
    #     auditor_id=new_user.id
    # )
    
    # # Get compliance dashboard
    # dashboard_data = queries.get_compliance_dashboard()
    
    # # Get auditor performance
    # auditor_performance = queries.get_auditor_performance()
    
    pass

# ================================================================
# ADVANCED QUERY BUILDERS
# ================================================================

class QueryBuilder:
    """
    Advanced query builder for complex filtering and reporting
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def build_audit_filter_query(self, 
                                property_ids: List[int] = None,
                                auditor_ids: List[int] = None,
                                status_list: List[str] = None,
                                date_from: datetime = None,
                                date_to: datetime = None,
                                score_min: int = None,
                                score_max: int = None,
                                compliance_zones: List[str] = None):
        """
        Build flexible audit filter query
        """
        query = self.db.query(Audit).options(
            joinedload(Audit.property),
            joinedload(Audit.auditor),
            joinedload(Audit.reviewer)
        )
        
        if property_ids:
            query = query.filter(Audit.property_id.in_(property_ids))
        
        if auditor_ids:
            query = query.filter(Audit.auditor_id.in_(auditor_ids))
        
        if status_list:
            query = query.filter(Audit.status.in_(status_list))
        
        if date_from:
            query = query.filter(Audit.created_at >= date_from)
        
        if date_to:
            query = query.filter(Audit.created_at <= date_to)
        
        if score_min is not None:
            query = query.filter(Audit.overall_score >= score_min)
        
        if score_max is not None:
            query = query.filter(Audit.overall_score <= score_max)
        
        if compliance_zones:
            query = query.filter(Audit.compliance_zone.in_(compliance_zones))
        
        return query.order_by(desc(Audit.created_at))

