from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime


class ActionTaken(BaseModel):
    """Record of an action taken by the agent"""
    action: str = Field(..., description="Action type")
    status: Literal["sent", "pending", "failed"] = Field(..., description="Action status")
    recipient: Optional[str] = Field(None, description="Recipient of the action")
    timestamp: Optional[str] = Field(None, description="Action timestamp")


class NextEscalation(BaseModel):
    """Information about next escalation"""
    level: int = Field(..., description="Next escalation level")
    trigger_at: str = Field(..., description="When next escalation triggers")
    actions: List[str] = Field(..., description="Actions to be taken")


class EscalateRequest(BaseModel):
    """Request for agent escalation"""
    loan_id: str = Field(..., description="Loan ID")
    current_level: int = Field(default=0, description="Current escalation level (0-4)")
    days_overdue: int = Field(default=0, description="Days past due date (negative = before due)")
    borrower_email: str = Field(..., description="Borrower email address")
    borrower_phone: Optional[str] = Field(None, description="Borrower phone number")
    amount_owed: float = Field(..., description="Amount owed")
    currency: str = Field(default="VND", description="Currency")
    borrower_name: Optional[str] = Field(None, description="Borrower name")
    company_name: Optional[str] = Field(None, description="Company name")


class EscalateData(BaseModel):
    """Escalation result data"""
    level: int = Field(..., description="Current escalation level after processing")
    actions_taken: List[ActionTaken] = Field(default=[], description="Actions taken")
    next_escalation: Optional[NextEscalation] = Field(None, description="Next escalation info")
    message: str = Field(..., description="Summary message")


class EscalateResponse(BaseModel):
    """Response from escalation"""
    success: bool
    data: Optional[EscalateData] = None
    error: Optional[str] = None


class GenerateEmailRequest(BaseModel):
    """Request to generate email content"""
    level: int = Field(..., description="Escalation level 1-4")
    borrower_name: str = Field(..., description="Borrower name")
    company_name: Optional[str] = Field(None, description="Company name")
    loan_amount: float = Field(..., description="Loan amount")
    currency: str = Field(default="VND", description="Currency")
    due_date: str = Field(..., description="Due date YYYY-MM-DD")
    days_overdue: int = Field(default=0, description="Days overdue")
    language: str = Field(default="vi", description="Language code vi/en")


class GenerateEmailData(BaseModel):
    """Generated email content"""
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body")
    tone: str = Field(..., description="Email tone")
    level: int = Field(..., description="Escalation level")


class GenerateEmailResponse(BaseModel):
    """Response from email generation"""
    success: bool
    data: Optional[GenerateEmailData] = None
    error: Optional[str] = None
