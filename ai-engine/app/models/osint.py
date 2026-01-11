from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal


class OSINTCheckResult(BaseModel):
    """Result of a single OSINT check"""
    score: int = Field(..., description="Score for this check (0-20)")
    max_score: int = Field(default=20, description="Maximum possible score")
    status: Literal["passed", "warning", "failed"] = Field(..., description="Check status")
    details: Dict[str, Any] = Field(default={}, description="Check details")


class OSINTRequest(BaseModel):
    """Request for OSINT check - accepts OCR extracted data for Gemini evaluation"""
    # Basic info (backwards compatible)
    company_name: Optional[str] = Field(None, description="Company name to check")
    tax_id: Optional[str] = Field(None, description="Tax ID / Business registration")
    address: Optional[str] = Field(None, description="Company address")

    # Full OCR data for Gemini evaluation
    doc_type: Optional[str] = Field(None, description="Document type from OCR")
    doc_name: Optional[str] = Field(None, description="Vietnamese document name")
    invoice_number: Optional[str] = Field(None, description="Document ID/number")
    amount: Optional[float] = Field(None, description="Monetary value")
    currency: Optional[str] = Field("VND", description="Currency")
    attributes: Optional[Dict[str, Any]] = Field(None, description="Document-specific attributes")


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


# === NEW: Gemini OSINT Evaluation Models ===

class OCRDataForOSINT(BaseModel):
    """OCR data structure for Gemini OSINT evaluation"""
    doc_type: str = Field(..., description="Document type (LAND_TITLE, VEHICLE, SAVINGS, etc.)")
    doc_name: Optional[str] = Field(None, description="Vietnamese document name")
    invoiceNumber: Optional[str] = Field(None, description="Primary document ID")
    amount: Optional[float] = Field(0, description="Monetary value or capital")
    currency: Optional[str] = Field("VND", description="Currency")
    debtor: Optional[Dict[str, Any]] = Field(default={}, description="Owner/Company info")
    attributes: Optional[Dict[str, Any]] = Field(default={}, description="Document-specific attributes")
    confidence: Optional[float] = Field(None, description="OCR confidence score")


class GeminiOSINTCategoryScores(BaseModel):
    """Category scores from Gemini evaluation"""
    completeness: int = Field(..., ge=0, le=20, description="Information completeness score")
    format_validity: int = Field(..., ge=0, le=20, description="Format validity score")
    consistency: int = Field(..., ge=0, le=20, description="Data consistency score")
    fraud_signs: int = Field(..., ge=0, le=20, description="Fraud signs score (higher = better)")
    doc_specific: int = Field(..., ge=0, le=20, description="Document-specific evaluation score")


class GeminiOSINTDetails(BaseModel):
    """Detailed evaluation from Gemini"""
    category_scores: Optional[GeminiOSINTCategoryScores] = None
    recommendation: str = Field(..., description="Recommendation for accepting/rejecting document")
    analysis_summary: str = Field(..., description="Summary of the analysis")
    evaluated_by: str = Field(default="Gemini AI", description="Evaluator")
    doc_type: str = Field(..., description="Document type evaluated")


class GeminiOSINTResult(BaseModel):
    """Result from Gemini OSINT evaluation"""
    is_shell_company: bool = Field(..., description="Whether document appears fraudulent")
    osint_score: int = Field(..., ge=0, le=100, description="Overall OSINT score")
    red_flags: List[str] = Field(default=[], description="List of detected issues")
    positive_signs: List[str] = Field(default=[], description="List of positive indicators")
    details: GeminiOSINTDetails = Field(..., description="Detailed evaluation")


class GeminiOSINTResponse(BaseModel):
    """Response from Gemini OSINT evaluation"""
    success: bool
    data: Optional[GeminiOSINTResult] = None
    error: Optional[str] = None
