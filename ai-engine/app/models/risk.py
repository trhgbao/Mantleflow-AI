from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from enum import Enum


class RiskTier(str, Enum):
    """Risk tier classification"""
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class FeatureScore(BaseModel):
    """Individual feature score breakdown"""
    score: float = Field(..., description="Score for this feature (0-100)")
    weight: float = Field(..., description="Weight percentage")
    weighted: float = Field(..., description="Weighted score contribution")
    raw_value: Optional[Any] = Field(None, description="Raw input value")
    description: Optional[str] = Field(None, description="Explanation")


class RiskScoreRequest(BaseModel):
    """Request for risk score calculation"""
    wallet_address: str = Field(..., description="Borrower wallet address")
    debtor_tax_id: Optional[str] = Field(None, description="Debtor tax ID")
    invoice_amount: float = Field(..., description="Invoice amount in USD")
    payment_term_days: int = Field(default=30, description="Payment term in days")
    debtor_business_age_months: int = Field(default=24, description="Debtor business age in months")
    osint_score: Optional[float] = Field(None, description="OSINT score from /ai/osint")

    # Optional blockchain data (can be fetched internally)
    wallet_age_days: Optional[int] = Field(None, description="Wallet age in days")
    tx_volume_30d: Optional[float] = Field(None, description="Transaction volume last 30 days in USD")
    past_defaults: Optional[int] = Field(None, description="Number of past loan defaults")


class RiskScoreResponse(BaseModel):
    """Response from risk score calculation"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class RiskScoreData(BaseModel):
    """Risk score calculation result"""
    total_score: float = Field(..., description="Total risk score 0-100")
    tier: RiskTier = Field(..., description="Risk tier A/B/C/D")
    ltv: int = Field(..., description="Loan-to-Value ratio percentage")
    interest_rate: float = Field(..., description="Annual interest rate percentage")
    breakdown: Dict[str, FeatureScore] = Field(..., description="Score breakdown by feature")
    recommendation: str = Field(..., description="Human-readable recommendation")
    is_approved: bool = Field(..., description="Whether loan is approved")
