"""
OSINT Checker - Đánh giá độ uy tín dữ liệu OCR bằng Gemini AI

Flow đơn giản:
1. Nhận dữ liệu đã OCR từ tài liệu
2. Gửi cho Gemini phân tích và đánh giá độ tin cậy
3. Trả về kết quả với điểm số và nhận xét
"""

from google import genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Cấu hình Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"

if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    gemini_client = None


async def evaluate_document_credibility(ocr_data: dict) -> dict:
    """
    Đánh giá độ uy tín của dữ liệu OCR bằng Gemini AI.
    
    Args:
        ocr_data: Dictionary chứa các trường dữ liệu đã được OCR từ tài liệu
        
    Returns:
        Dictionary chứa:
        - osint_score (0-100): Điểm đánh giá độ tin cậy
        - is_credible: True nếu dữ liệu đáng tin cậy
        - red_flags: Các vấn đề phát hiện được
        - positive_signs: Các điểm tích cực
        - analysis: Phân tích chi tiết từ Gemini
    """
    if not gemini_client:
        return {
            "osint_score": 0,
            "is_credible": False,
            "red_flags": ["Gemini API chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào file .env"],
            "positive_signs": [],
            "analysis": {
                "summary": "Không thể đánh giá do thiếu cấu hình API",
                "recommendation": "Vui lòng cấu hình GEMINI_API_KEY",
                "evaluated_by": "System"
            }
        }

    # Chuẩn bị thông tin để gửi cho Gemini
    doc_type = ocr_data.get("doc_type", "UNKNOWN")
    doc_name = ocr_data.get("doc_name", "Không xác định")
    debtor = ocr_data.get("debtor", {})
    attributes = ocr_data.get("attributes", {})
    amount = ocr_data.get("amount", 0)
    
    # Tạo prompt đánh giá độ uy tín
    prompt = f"""
Bạn là chuyên gia đánh giá độ uy tín tài liệu và chống gian lận.

Nhiệm vụ: Phân tích dữ liệu sau đã được trích xuất từ tài liệu qua OCR và đánh giá độ tin cậy của thông tin.

=== DỮ LIỆU TÀI LIỆU ===
Loại tài liệu: {doc_type}
Tên tài liệu: {doc_name}
Mã/Số tài liệu: {ocr_data.get("invoiceNumber", "N/A")}
Giá trị: {amount:,.0f} {ocr_data.get("currency", "VND")}

--- THÔNG TIN CHỦ SỞ HỮU ---
Tên: {debtor.get("name", "N/A")}
Mã số thuế/CCCD: {debtor.get("taxId", "N/A")}
Địa chỉ: {debtor.get("address", "N/A")}

--- CHI TIẾT THUỘC TÍNH ---
{json.dumps(attributes, ensure_ascii=False, indent=2)}

=== TIÊU CHÍ ĐÁNH GIÁ ===
Hãy đánh giá độ uy tín dựa trên:

1. **Tính đầy đủ (0-25 điểm)**: 
   - Thông tin có đầy đủ các trường quan trọng không?
   - Có bị thiếu dữ liệu cần thiết không?

2. **Tính hợp lệ (0-25 điểm)**:
   - Format dữ liệu có đúng chuẩn không? (MST, SĐT, địa chỉ, ngày tháng...)
   - Các số liệu có hợp lý không?

3. **Tính nhất quán (0-25 điểm)**:
   - Thông tin có mâu thuẫn nhau không?
   - Địa chỉ, biển số, vùng miền có khớp nhau không?

4. **Dấu hiệu đáng ngờ (0-25 điểm)**:
   - Có dấu hiệu giả mạo, chỉnh sửa không?
   - Giá trị có bất thường so với thị trường không?
   - Có giống tên công ty lớn để lừa đảo không?

=== YÊU CẦU OUTPUT ===
Trả về JSON với cấu trúc sau (KHÔNG thêm text khác):
{{
    "total_score": <số từ 0-100>,
    "is_credible": <true nếu score >= 60>,
    "scores": {{
        "completeness": <0-25>,
        "validity": <0-25>,
        "consistency": <0-25>,
        "no_fraud_signs": <0-25>
    }},
    "red_flags": [
        "Mô tả ngắn gọn từng vấn đề phát hiện"
    ],
    "positive_signs": [
        "Mô tả ngắn gọn điểm tích cực"
    ],
    "summary": "Tóm tắt 2-3 câu về đánh giá tổng thể",
    "recommendation": "Khuyến nghị: CHẤP NHẬN / CẦN XEM XÉT / TỪ CHỐI + lý do ngắn"
}}
"""

    try:
        print(f"🔍 Gemini đang đánh giá độ uy tín: {doc_type}...")
        
        # Gọi Gemini API
        response = await gemini_client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        
        # Parse JSON từ response
        result_text = response.text
        
        # Clean up markdown code blocks nếu có
        if "```json" in result_text:
            result_text = result_text.replace("```json", "").replace("```", "")
        elif "```" in result_text:
            result_text = result_text.replace("```", "")
        
        gemini_result = json.loads(result_text.strip())
        
        # Chuẩn hóa output
        total_score = gemini_result.get("total_score", 50)
        is_credible = gemini_result.get("is_credible", total_score >= 60)
        
        print(f"✅ Điểm uy tín: {total_score}/100 | Đáng tin cậy: {'Có' if is_credible else 'Không'}")
        
        return {
            "osint_score": total_score,
            "is_credible": is_credible,
            "is_shell_company": not is_credible,  # Backwards compatibility
            "red_flags": gemini_result.get("red_flags", []),
            "positive_signs": gemini_result.get("positive_signs", []),
            "analysis": {
                "scores": gemini_result.get("scores", {}),
                "summary": gemini_result.get("summary", ""),
                "recommendation": gemini_result.get("recommendation", ""),
                "evaluated_by": "Gemini AI",
                "doc_type": doc_type
            }
        }
        
    except json.JSONDecodeError as e:
        print(f"❌ Lỗi parse JSON từ Gemini: {e}")
        return _create_error_result(f"Không thể parse kết quả từ Gemini: {e}")
    except Exception as e:
        print(f"❌ Lỗi Gemini: {e}")
        return _create_error_result(f"Lỗi khi gọi Gemini API: {e}")


def _create_error_result(error_message: str) -> dict:
    """Tạo kết quả lỗi với format chuẩn"""
    return {
        "osint_score": 0,
        "is_credible": False,
        "is_shell_company": True,
        "red_flags": [error_message],
        "positive_signs": [],
        "analysis": {
            "scores": {},
            "summary": "Không thể đánh giá do lỗi hệ thống",
            "recommendation": "Vui lòng thử lại hoặc kiểm tra cấu hình API",
            "evaluated_by": "System"
        }
    }


# === BACKWARDS COMPATIBILITY ===
# Giữ lại function cũ để không break code đang sử dụng

async def check_osint_with_gemini(ocr_data: dict) -> dict:
    """
    Wrapper function để tương thích ngược với code cũ.
    Gọi đến evaluate_document_credibility.
    """
    result = await evaluate_document_credibility(ocr_data)
    
    # Map sang format response cũ
    return {
        "is_shell_company": result.get("is_shell_company", not result.get("is_credible", False)),
        "osint_score": result.get("osint_score", 0),
        "red_flags": result.get("red_flags", []),
        "positive_signs": result.get("positive_signs", []),
        "details": {
            "category_scores": result.get("analysis", {}).get("scores", {}),
            "recommendation": result.get("analysis", {}).get("recommendation", ""),
            "analysis_summary": result.get("analysis", {}).get("summary", ""),
            "evaluated_by": result.get("analysis", {}).get("evaluated_by", "Gemini AI"),
            "doc_type": result.get("analysis", {}).get("doc_type", "UNKNOWN")
        }
    }


def check_osint(tax_id: str, input_name: str) -> dict:
    """
    Legacy function - Giữ lại để tương thích ngược.
    Nay chỉ trả về thông báo dùng Gemini thay thế.
    """
    return {
        "is_shell_company": False,
        "osint_score": 50,
        "red_flags": ["Legacy OSINT check - Vui lòng sử dụng Gemini evaluation để có kết quả chính xác hơn"],
        "details": {
            "database_check": {"status": "DEPRECATED"},
            "message": "Sử dụng endpoint /ai/osint với full OCR data để đánh giá bằng Gemini AI"
        }
    }
