"""
OSINT API Routes - Đánh giá độ uy tín dữ liệu OCR bằng Gemini AI

Endpoint chính: POST /ai/osint
- Nhận dữ liệu đã OCR từ tài liệu
- Gửi cho Gemini đánh giá độ tin cậy
- Trả về điểm uy tín và phân tích
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from ...services.osint_checker import evaluate_document_credibility, check_osint_with_gemini

router = APIRouter(prefix="/ai", tags=["OSINT - Credibility Check"])


# === REQUEST/RESPONSE MODELS ===

class OSINTRequest(BaseModel):
    """Request body cho OSINT check"""
    # Thông tin cơ bản
    doc_type: Optional[str] = Field(None, description="Loại tài liệu (LAND_TITLE, VEHICLE, SAVINGS...)")
    doc_name: Optional[str] = Field(None, description="Tên tài liệu tiếng Việt")
    invoice_number: Optional[str] = Field(None, description="Số/Mã tài liệu")
    
    # Thông tin chủ sở hữu
    company_name: Optional[str] = Field(None, description="Tên công ty/chủ sở hữu")
    tax_id: Optional[str] = Field(None, description="Mã số thuế hoặc CCCD")
    address: Optional[str] = Field(None, description="Địa chỉ")
    
    # Giá trị
    amount: Optional[float] = Field(None, description="Giá trị/Số tiền")
    currency: Optional[str] = Field("VND", description="Đơn vị tiền tệ")
    
    # Thuộc tính chi tiết
    attributes: Optional[Dict[str, Any]] = Field(None, description="Các thuộc tính chi tiết của tài liệu")


class CredibilityScores(BaseModel):
    """Điểm chi tiết theo tiêu chí"""
    completeness: int = Field(..., description="Điểm tính đầy đủ (0-25)")
    validity: int = Field(..., description="Điểm tính hợp lệ (0-25)")
    consistency: int = Field(..., description="Điểm tính nhất quán (0-25)")
    no_fraud_signs: int = Field(..., description="Điểm không có dấu hiệu gian lận (0-25)")


class CredibilityAnalysis(BaseModel):
    """Phân tích chi tiết"""
    scores: Optional[CredibilityScores] = None
    summary: str = Field(..., description="Tóm tắt đánh giá")
    recommendation: str = Field(..., description="Khuyến nghị")
    evaluated_by: str = Field(default="Gemini AI")
    doc_type: Optional[str] = None


class OSINTResult(BaseModel):
    """Kết quả đánh giá OSINT"""
    osint_score: int = Field(..., ge=0, le=100, description="Điểm uy tín tổng (0-100)")
    is_credible: bool = Field(..., description="Dữ liệu có đáng tin cậy không")
    red_flags: List[str] = Field(default=[], description="Các vấn đề phát hiện")
    positive_signs: List[str] = Field(default=[], description="Các điểm tích cực")
    analysis: CredibilityAnalysis = Field(..., description="Phân tích chi tiết")


class OSINTResponse(BaseModel):
    """Response từ OSINT check"""
    success: bool
    data: Optional[OSINTResult] = None
    error: Optional[str] = None


# === MAIN ENDPOINT ===

@router.post("/osint", response_model=OSINTResponse)
async def evaluate_credibility(request: OSINTRequest):
    """
    🔍 Đánh giá độ uy tín của dữ liệu OCR bằng Gemini AI.
    
    **Cách hoạt động:**
    1. Nhận dữ liệu đã được OCR từ tài liệu
    2. Gửi cho Gemini AI phân tích và đánh giá
    3. Trả về điểm uy tín (0-100) và phân tích chi tiết
    
    **Tiêu chí đánh giá (4 tiêu chí, mỗi tiêu chí 25 điểm):**
    - **Tính đầy đủ**: Thông tin có đủ các trường quan trọng không?
    - **Tính hợp lệ**: Format dữ liệu có đúng chuẩn không?
    - **Tính nhất quán**: Thông tin có mâu thuẫn nhau không?
    - **Dấu hiệu đáng ngờ**: Có dấu hiệu giả mạo, bất thường không?
    
    **Kết quả:**
    - `osint_score >= 80`: Rất đáng tin cậy
    - `osint_score 60-79`: Đáng tin cậy
    - `osint_score 40-59`: Cần xem xét thêm
    - `osint_score < 40`: Không đáng tin cậy
    """
    try:
        # Chuẩn bị dữ liệu OCR cho Gemini
        ocr_data = {
            "doc_type": request.doc_type or "UNKNOWN",
            "doc_name": request.doc_name or "",
            "invoiceNumber": request.invoice_number or "",
            "amount": request.amount or 0,
            "currency": request.currency or "VND",
            "debtor": {
                "name": request.company_name or "",
                "taxId": request.tax_id or "",
                "address": request.address or ""
            },
            "attributes": request.attributes or {}
        }
        
        # Gọi Gemini đánh giá
        result = await evaluate_document_credibility(ocr_data)
        
        # Chuẩn bị response
        analysis = result.get("analysis", {})
        scores_dict = analysis.get("scores", {})
        
        return OSINTResponse(
            success=True,
            data=OSINTResult(
                osint_score=result.get("osint_score", 0),
                is_credible=result.get("is_credible", False),
                red_flags=result.get("red_flags", []),
                positive_signs=result.get("positive_signs", []),
                analysis=CredibilityAnalysis(
                    scores=CredibilityScores(
                        completeness=scores_dict.get("completeness", 0),
                        validity=scores_dict.get("validity", 0),
                        consistency=scores_dict.get("consistency", 0),
                        no_fraud_signs=scores_dict.get("no_fraud_signs", 0)
                    ) if scores_dict else None,
                    summary=analysis.get("summary", ""),
                    recommendation=analysis.get("recommendation", ""),
                    evaluated_by=analysis.get("evaluated_by", "Gemini AI"),
                    doc_type=analysis.get("doc_type")
                )
            )
        )
        
    except Exception as e:
        print(f"❌ OSINT Error: {e}")
        return OSINTResponse(
            success=False,
            error=f"Lỗi đánh giá OSINT: {str(e)}"
        )


@router.get("/osint/info")
async def get_osint_info():
    """
    📋 Thông tin về hệ thống đánh giá OSINT
    
    Trả về mô tả các tiêu chí đánh giá và cách tính điểm.
    """
    return {
        "name": "OSINT Credibility Check",
        "description": "Đánh giá độ uy tín dữ liệu OCR bằng Gemini AI",
        "evaluator": "Google Gemini 2.0 Flash",
        "scoring": {
            "max_score": 100,
            "pass_threshold": 60,
            "criteria": [
                {
                    "name": "completeness",
                    "max_score": 25,
                    "description": "Tính đầy đủ - Thông tin có đủ các trường quan trọng không?"
                },
                {
                    "name": "validity", 
                    "max_score": 25,
                    "description": "Tính hợp lệ - Format dữ liệu có đúng chuẩn không?"
                },
                {
                    "name": "consistency",
                    "max_score": 25,
                    "description": "Tính nhất quán - Thông tin có mâu thuẫn nhau không?"
                },
                {
                    "name": "no_fraud_signs",
                    "max_score": 25,
                    "description": "Không có dấu hiệu gian lận - Có dấu hiệu giả mạo, bất thường không?"
                }
            ]
        },
        "result_tiers": {
            "A": {"range": "80-100", "label": "Rất đáng tin cậy", "color": "green"},
            "B": {"range": "60-79", "label": "Đáng tin cậy", "color": "blue"},
            "C": {"range": "40-59", "label": "Cần xem xét thêm", "color": "yellow"},
            "D": {"range": "0-39", "label": "Không đáng tin cậy", "color": "red"}
        },
        "example_request": {
            "doc_type": "BUSINESS_REG",
            "doc_name": "Giấy chứng nhận đăng ký kinh doanh",
            "company_name": "CÔNG TY TNHH ABC",
            "tax_id": "0123456789",
            "address": "123 Đường XYZ, Quận 1, TP.HCM",
            "amount": 1000000000,
            "attributes": {
                "registration_date": "2020-01-15",
                "representative": "Nguyễn Văn A"
            }
        }
    }
