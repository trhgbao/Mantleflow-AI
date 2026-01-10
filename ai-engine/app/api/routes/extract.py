"""
Document Extraction API - Tích hợp từ ai-engine_resources
Hỗ trợ 6 loại chứng từ: LAND_TITLE, VEHICLE, SAVINGS, BUSINESS_REG, PATENT, INVOICE
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import base64

from ...services.ocr_service import extract_document_data

router = APIRouter(prefix="/ai", tags=["Document OCR"])


class DocumentResponse(BaseModel):
    """Response model for document extraction"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/extract", response_model=DocumentResponse)
async def extract_document(
    file: UploadFile = File(..., description="Document file (PDF or Image)")
):
    """
    Trích xuất thông tin từ chứng từ bằng AI OCR

    **Loại chứng từ hỗ trợ:**
    - LAND_TITLE: Sổ đỏ / Giấy chứng nhận QSDĐ (cả BĐS kinh doanh)
    - VEHICLE: Đăng ký xe / Đăng kiểm / Cà vẹt
    - SAVINGS: Sổ tiết kiệm ngân hàng
    - BUSINESS_REG: Giấy chứng nhận đăng ký doanh nghiệp (MỚI)
    - PATENT: Bằng độc quyền sáng chế (MỚI)
    - INVOICE: Hóa đơn

    **Định dạng file hỗ trợ:**
    - PDF (.pdf)
    - Images (.png, .jpg, .jpeg)

    **Returns:**
    - doc_type: Loại chứng từ
    - doc_name: Tên chứng từ tiếng Việt
    - invoiceNumber: Mã định danh
    - amount: Giá trị (nếu có)
    - debtor: Thông tin chủ sở hữu
    - attributes: Thông tin chi tiết theo loại chứng từ
    """
    filename = file.filename or "unknown"
    file_ext = filename.split(".")[-1].lower()

    supported_types = ["pdf", "png", "jpg", "jpeg"]
    if file_ext not in supported_types:
        raise HTTPException(
            status_code=400,
            detail=f"File không hỗ trợ: {file_ext}. Chỉ hỗ trợ: {', '.join(supported_types)}"
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {str(e)}")

    # Determine MIME type
    mime_types = {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg"
    }
    mime_type = mime_types.get(file_ext, "application/octet-stream")

    try:
        result = await extract_document_data(content, mime_type)

        if result.get("error"):
            return DocumentResponse(
                success=False,
                error=result.get("message", "Extraction failed")
            )

        return DocumentResponse(
            success=True,
            data=result
        )

    except Exception as e:
        return DocumentResponse(
            success=False,
            error=f"Lỗi trích xuất: {str(e)}"
        )


@router.post("/extract-base64", response_model=DocumentResponse)
async def extract_document_base64(
    file_base64: str,
    file_type: str = "jpg",
    filename: str = "document"
):
    """
    Trích xuất chứng từ từ base64

    Sử dụng khi gửi file dưới dạng JSON payload.
    """
    try:
        content = base64.b64decode(file_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Base64 không hợp lệ: {str(e)}")

    mime_types = {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg"
    }
    mime_type = mime_types.get(file_type.lower(), "image/jpeg")

    try:
        result = await extract_document_data(content, mime_type)

        if result.get("error"):
            return DocumentResponse(
                success=False,
                error=result.get("message", "Extraction failed")
            )

        return DocumentResponse(
            success=True,
            data=result
        )

    except Exception as e:
        return DocumentResponse(
            success=False,
            error=f"Lỗi trích xuất: {str(e)}"
        )


@router.get("/document-types")
async def get_document_types():
    """
    Lấy danh sách loại chứng từ hỗ trợ

    Returns chi tiết các trường thông tin cho mỗi loại chứng từ.
    """
    return {
        "document_types": {
            "LAND_TITLE": {
                "name_vi": "Sổ đỏ / Giấy chứng nhận QSDĐ",
                "name_en": "Land Use Rights Certificate",
                "fields": [
                    "land_lot_no (Thửa đất số)",
                    "land_map_no (Tờ bản đồ số)",
                    "land_area (Diện tích m2)",
                    "land_address (Địa chỉ)",
                    "land_purpose (Mục đích sử dụng)",
                    "cert_book_entry (Số vào sổ cấp GCN)"
                ],
                "verification_target": "Vietnam Valuation Corp (VVC)"
            },
            "VEHICLE": {
                "name_vi": "Đăng ký xe / Đăng kiểm",
                "name_en": "Vehicle Registration",
                "fields": [
                    "plate_number (Biển số xe)",
                    "brand (Nhãn hiệu)",
                    "vehicle_type (Loại xe)",
                    "chassis_no (Số khung)",
                    "engine_no (Số máy)",
                    "valid_until (Hạn đăng kiểm)"
                ],
                "verification_target": "Brand Service Center"
            },
            "SAVINGS": {
                "name_vi": "Sổ tiết kiệm",
                "name_en": "Savings Book",
                "fields": [
                    "bank_name (Tên ngân hàng)",
                    "book_serial (Mã số sổ)",
                    "account_no (Số tài khoản)",
                    "term (Kỳ hạn)",
                    "maturity_date (Ngày đến hạn)"
                ],
                "verification_target": "Issuing Bank"
            },
            "BUSINESS_REG": {
                "name_vi": "Giấy chứng nhận đăng ký doanh nghiệp",
                "name_en": "Business Registration Certificate",
                "fields": [
                    "business_code (Mã số doanh nghiệp)",
                    "company_name (Tên công ty)",
                    "headquarters (Địa chỉ trụ sở chính)",
                    "charter_capital (Vốn điều lệ)",
                    "legal_representative (Người đại diện pháp luật)",
                    "representative_title (Chức danh)",
                    "registration_date (Ngày đăng ký)"
                ],
                "verification_target": "Sở Kế hoạch và Đầu tư"
            },
            "PATENT": {
                "name_vi": "Bằng độc quyền sáng chế",
                "name_en": "Patent Certificate",
                "fields": [
                    "patent_number (Số bằng)",
                    "patent_title (Tên sáng chế)",
                    "patent_owner (Chủ bằng độc quyền)",
                    "inventor (Tác giả sáng chế)",
                    "application_number (Số đơn)",
                    "application_date (Ngày nộp đơn)",
                    "grant_decision (Quyết định cấp số)"
                ],
                "verification_target": "Cục Sở hữu trí tuệ"
            },
            "INVOICE": {
                "name_vi": "Hóa đơn",
                "name_en": "Invoice",
                "fields": [
                    "buyer_name (Tên đơn vị mua)",
                    "seller_name (Tên đơn vị bán)"
                ],
                "verification_target": "Buyer Company (AP Dept)"
            }
        },
        "supported_formats": ["pdf", "png", "jpg", "jpeg"]
    }
