"""
Email API - Gửi email xác minh và nhắc nhở thanh toán
Hỗ trợ gửi email THẬT qua SMTP
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from ...models.agent import GenerateEmailRequest, GenerateEmailResponse
from ...services.agent_service import agent_service
from ...services.email_service import email_service

router = APIRouter(prefix="/ai", tags=["Email"])


# ===== Request Models =====

class SendVerificationEmailRequest(BaseModel):
    """Request model for sending verification email"""
    doc_data: Dict[str, Any]
    override_email: Optional[str] = None  # Email cá nhân để demo


class SendPaymentReminderRequest(BaseModel):
    """Request model for sending payment reminder"""
    level: int  # 1-4
    borrower_name: str
    borrower_email: str
    loan_amount: float
    currency: str = "VND"
    due_date: str
    days_overdue: int = 0
    override_email: Optional[str] = None  # Email cá nhân để demo


class EmailResponse(BaseModel):
    """Response model for email operations"""
    success: bool
    delivery_status: str
    email_content: Optional[Dict[str, Any]] = None
    target: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ===== Endpoints =====

@router.post("/send-verification", response_model=EmailResponse)
async def send_verification_email(request: SendVerificationEmailRequest):
    """
    Gửi email xác minh chứng từ đến cơ quan có thẩm quyền

    **Đối tượng nhận email theo loại chứng từ:**
    - LAND_TITLE → Vietnam Valuation Corp (VVC)
    - VEHICLE → Brand Service Center
    - SAVINGS → Ngân hàng phát hành
    - BUSINESS_REG → Sở Kế hoạch và Đầu tư
    - PATENT → Cục Sở hữu trí tuệ
    - INVOICE → Phòng Kế toán bên mua

    **Demo Mode:**
    Truyền `override_email` để gửi đến email cá nhân thay vì cơ quan.
    """
    try:
        result = email_service.send_verification_email(
            doc_data=request.doc_data,
            override_email=request.override_email
        )

        return EmailResponse(
            success=result['success'],
            delivery_status=result['delivery_status'],
            email_content=result['email_content'],
            target=result['target']
        )

    except Exception as e:
        return EmailResponse(
            success=False,
            delivery_status="FAILED",
            error=str(e)
        )


@router.post("/send-reminder", response_model=EmailResponse)
async def send_payment_reminder(request: SendPaymentReminderRequest):
    """
    Gửi email nhắc nhở thanh toán

    **Cấp độ nhắc nhở:**
    - Level 1: 3 ngày trước hạn - Nhắc nhẹ
    - Level 2: Ngày đến hạn - Khẩn cấp
    - Level 3: Quá hạn 7 ngày - Cảnh báo cuối
    - Level 4: Quá hạn 14 ngày - Thông báo thanh lý NFT

    **Demo Mode:**
    Truyền `override_email` để gửi đến email cá nhân.
    """
    try:
        loan_data = {
            "borrower_name": request.borrower_name,
            "borrower_email": request.borrower_email,
            "loan_amount": request.loan_amount,
            "currency": request.currency,
            "due_date": request.due_date,
            "days_overdue": request.days_overdue
        }

        result = email_service.send_payment_reminder(
            level=request.level,
            loan_data=loan_data,
            override_email=request.override_email
        )

        return EmailResponse(
            success=result['success'],
            delivery_status=result['delivery_status'],
            email_content=result['email_content']
        )

    except Exception as e:
        return EmailResponse(
            success=False,
            delivery_status="FAILED",
            error=str(e)
        )


@router.post("/generate-email", response_model=GenerateEmailResponse)
async def generate_email(request: GenerateEmailRequest):
    """
    Tạo nội dung email thu hồi nợ bằng AI

    Tạo email tiếng Việt chuyên nghiệp với tone phù hợp theo cấp độ.

    **Cấp độ:**
    - Level 1: Nhắc nhở nhẹ nhàng
    - Level 2: Khẩn cấp
    - Level 3: Cảnh báo cuối
    - Level 4: Thông báo thanh lý

    **Returns:**
    - Email subject
    - Email body
    - Tone
    """
    try:
        result = await agent_service.generate_email(
            level=request.level,
            borrower_name=request.borrower_name,
            company_name=request.company_name,
            loan_amount=request.loan_amount,
            currency=request.currency,
            due_date=request.due_date,
            days_overdue=request.days_overdue,
            language=request.language
        )

        return GenerateEmailResponse(
            success=True,
            data=result
        )

    except Exception as e:
        return GenerateEmailResponse(
            success=False,
            error=f"Email generation error: {str(e)}"
        )


@router.get("/email-templates")
async def get_email_templates():
    """
    Lấy ví dụ template email cho mỗi cấp độ
    """
    return {
        "payment_reminder_templates": {
            "level_1": {
                "tone": "friendly",
                "trigger": "3 ngày trước hạn",
                "subject_example": "Nhắc nhở thanh toán - MantleFlow",
                "description": "Email nhắc nhẹ nhàng"
            },
            "level_2": {
                "tone": "urgent",
                "trigger": "Ngày đến hạn",
                "subject_example": "KHẨN CẤP: Khoản vay đến hạn thanh toán - MantleFlow",
                "description": "Email khẩn cấp"
            },
            "level_3": {
                "tone": "final_warning",
                "trigger": "Quá hạn 7 ngày",
                "subject_example": "CẢNH BÁO CUỐI: Khoản vay quá hạn X ngày - MantleFlow",
                "description": "Cảnh báo trước khi đưa NFT lên sàn"
            },
            "level_4": {
                "tone": "liquidation",
                "trigger": "Quá hạn 14 ngày",
                "subject_example": "THÔNG BÁO THANH LÝ TÀI SẢN - MantleFlow",
                "description": "Thông báo đấu giá NFT"
            }
        },
        "verification_templates": {
            "LAND_TITLE": "Yêu cầu định giá BĐS",
            "VEHICLE": "Kiểm tra lịch sử & định giá xe",
            "SAVINGS": "Yêu cầu phong tỏa sổ tiết kiệm",
            "BUSINESS_REG": "Xác thực đăng ký doanh nghiệp",
            "PATENT": "Xác thực bằng sáng chế",
            "INVOICE": "Xác nhận công nợ hóa đơn"
        },
        "smtp_status": "configured" if email_service.is_smtp_configured() else "simulation_mode"
    }


@router.get("/smtp-status")
async def get_smtp_status():
    """
    Kiểm tra trạng thái cấu hình SMTP

    Nếu chưa cấu hình SMTP, email sẽ chạy ở chế độ simulation (không gửi thật).
    """
    return {
        "smtp_configured": email_service.is_smtp_configured(),
        "mode": "real_sending" if email_service.is_smtp_configured() else "simulation",
        "note": "To enable real email sending, set MAIL_USERNAME and MAIL_PASSWORD in .env"
    }
