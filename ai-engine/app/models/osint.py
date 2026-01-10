from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal


class OSINTCheckResult(BaseModel):
    """Result of a single OSINT check"""
    score: int = Field(..., description="Score for this check (0-20)")
    max_score: int = Field(default=20, description="Maximum possible score")
    status: Literal["passed", "warning", "failed"] = Field(..., description="Check status")
    details: Dict[str, Any] = Field(default={}, description="Check details")


class OSINTRequest(BaseModel):
    """Request for OSINT check"""
    company_name: str = Field(..., description="Company name to check")
    tax_id: Optional[str] = Field(None, description="Tax ID / Business registration")
    address: Optional[str] = Field(None, description="Company address")
    website: Optional[str] = Field(None, description="Company website URL")
    registration_date: Optional[str] = Field(None, description="Business registration date YYYY-MM-DD")


class OSINTChecks(BaseModel):
    """All 5 OSINT checks"""
    website: OSINTCheckResult = Field(..., description="Website verification")
    linkedin: OSINTCheckResult = Field(..., description="LinkedIn presence")
    google_maps: OSINTCheckResult = Field(..., description="Google Maps listing")
    press_news: OSINTCheckResult = Field(..., description="Press/news coverage")
    social_media: OSINTCheckResult = Field(..., description="Social media presence")


class BusinessAgeResult(BaseModel):
    """Business age verification result"""
    months: int = Field(..., description="Business age in months")
    status: Literal["passed", "warning", "rejected"] = Field(..., description="Age status")


class OSINTData(BaseModel):
    """OSINT check result data"""
    osint_score: int = Field(..., description="Total OSINT score (0-100)")
    is_shell_company: bool = Field(..., description="Shell company detection flag")
    auto_reject: bool = Field(..., description="Auto-reject flag")
    reject_reason: Optional[str] = Field(None, description="Reason for rejection if applicable")
    checks: OSINTChecks = Field(..., description="Individual check results")
    business_age: BusinessAgeResult = Field(..., description="Business age result")
    red_flags: List[str] = Field(default=[], description="List of red flags detected")
    recommendation: str = Field(..., description="Human-readable recommendation")


class OSINTResponse(BaseModel):
    """Response from OSINT check"""
    success: bool
    data: Optional[OSINTData] = None
    error: Optional[str] = None
