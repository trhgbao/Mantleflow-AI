import google.generativeai as genai
import requests
import json
import re
import os
import random
from dotenv import load_dotenv

load_dotenv()

# Key bạn cung cấp (hoặc lấy từ .env)
MY_GOOGLE_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCN6x_B2lSx_ZBnKfJmYxChZ0xVi2fpfIQ")

class GeminiService:
    """Service tương tác với Google Gemini API kết hợp OCR Space"""

    def __init__(self):
        self.api_key = MY_GOOGLE_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def is_configured(self) -> bool:
        return self.model is not None

    async def analyze_document(self, file_content: bytes, mime_type: str) -> dict:
        """
        Hàm chính:
        1. Gọi OCR Space để lấy Raw Text (xử lý ảnh mờ tốt).
        2. Gọi Gemini để trích xuất dữ liệu chi tiết.
        """
        if not self.is_configured():
            return {"error": True, "message": "Gemini API Key missing."}

        # ---------------------------------------------------------
        # BƯỚC 1: GỌI OCR SPACE (Logic cũ của bạn yêu cầu giữ lại)
        # ---------------------------------------------------------
        ocr_api_key = os.getenv("OCR_API_KEY", "helloworld")
        
        payload = {
            'apikey': ocr_api_key,
            'language': 'eng', # Dùng ENG để tránh lỗi E201, Gemini sẽ tự dịch
            'isOverlayRequired': False,
            'detectOrientation': True,
            'scale': True,
            'OCREngine': 2
        }
        
        filename = "doc.pdf" if "pdf" in mime_type else "doc.jpg"
        files = {'file': (filename, file_content, mime_type)}

        try:
            print(f"🚀 OCR Scanning: {filename}...")
            # Lưu ý: requests là sync, nhưng trong hackathon chấp nhận được.
            # Nếu muốn chuẩn async hoàn toàn thì dùng aiohttp, nhưng requests ổn định hơn.
            response = requests.post("https://api.ocr.space/parse/image", files=files, data=payload)
            
            if response.status_code != 200:
                print("⚠️ OCR API failed, using Gemini Vision...")
                return await self._extract_with_gemini_vision(file_content, mime_type)

            result = response.json()
            if result.get('IsErroredOnProcessing') or not result.get('ParsedResults'):
                print("⚠️ OCR processing error, using Gemini Vision...")
                return await self._extract_with_gemini_vision(file_content, mime_type)
                
            full_text = result['ParsedResults'][0].get('ParsedText', "")
            
            if len(full_text.strip()) < 10:
                print("⚠️ Text too short, using Gemini Vision...")
                return await self._extract_with_gemini_vision(file_content, mime_type)

            print(f"✅ Raw Text Retrieved ({len(full_text)} chars). Sending to Gemini...")
            
            # Gọi hàm phân tích nội bộ
            return await self._extract_document_data(full_text)

        except Exception as e:
            print(f"❌ Error: {e}")
            return await self._extract_with_gemini_vision(file_content, mime_type)

    async def _extract_with_gemini_vision(self, file_content: bytes, mime_type: str) -> dict:
        """Fallback: Use Gemini Vision API directly for images"""
        try:
            import base64
            image_data = base64.b64encode(file_content).decode('utf-8')

            prompt = f"""
            Analyze this Vietnamese document image and extract all information.

            Document types:
            1. "LAND_TITLE" (Sổ đỏ)
            2. "VEHICLE" (Đăng ký xe)
            3. "SAVINGS" (Sổ tiết kiệm)
            4. "BUSINESS_REG" (Giấy ĐKKD)
            5. "PATENT" (Bằng sáng chế)
            6. "INVOICE" (Hóa đơn)

            {self._get_json_structure()}
            """

            response = await self.model.generate_content_async([
                prompt,
                {"mime_type": mime_type, "data": image_data}
            ])

            cleaned_json = self._clean_json_string(response.text)
            data = json.loads(cleaned_json)
            data["confidence"] = 0.88
            return self._post_process(data)

        except Exception as e:
            print(f"❌ Gemini Vision Error: {e}")
            return {"error": True, "message": f"Vision Error: {str(e)}"}

    async def _extract_document_data(self, raw_text: str) -> dict:
        """
        Gửi text sang Gemini kèm theo Super Prompt
        """
        prompt = f"""
        You are an expert Vietnamese Document Analyst.
        Your task is to correct OCR errors and extract DETAILED structured data from the raw text below.
        
        The document is one of 6 types. Choose the best match:
        1. "LAND_TITLE" (Sổ đỏ, Giấy chứng nhận QSDĐ - bao gồm cả BĐS kinh doanh)
        2. "VEHICLE" (Đăng ký xe, Đăng kiểm, Cà vẹt)
        3. "SAVINGS" (Sổ tiết kiệm ngân hàng)
        4. "BUSINESS_REG" (Giấy chứng nhận đăng ký doanh nghiệp)
        5. "PATENT" (Bằng độc quyền sáng chế, Patent)
        6. "INVOICE" (Hóa đơn, Payment Voucher)
        
        --- RAW TEXT START ---
        {raw_text}
        --- RAW TEXT END ---
        
        INSTRUCTIONS:
        1. Correct spelling errors (e.g., "GIAY CHUNG NHAN" -> "Giấy Chứng Nhận").
        2. Extract ALL available fields listed below. If a field is missing, use null.
        3. Return ONLY pure JSON.
        
        {self._get_json_structure()}
        """

        try:
            # Gọi Async Gemini
            response = await self.model.generate_content_async(prompt)
            
            # Làm sạch JSON
            cleaned_json = self._clean_json_string(response.text)
            data = json.loads(cleaned_json)
            data["confidence"] = 0.92
            return self._post_process(data)

        except Exception as e:
            print(f"❌ Gemini Error: {e}")
            return {"error": True, "message": "AI không thể phân tích cấu trúc tài liệu."}

    def _get_json_structure(self) -> str:
        """JSON structure for all document types"""
        return """
        REQUIRED JSON STRUCTURE:
        {
            "doc_type": "LAND_TITLE" | "VEHICLE" | "SAVINGS" | "BUSINESS_REG" | "PATENT" | "INVOICE" | "UNKNOWN",
            "doc_name": "Vietnamese document name",
            
            "invoiceNumber": "Primary ID",
            "amount": number (monetary value or capital, 0 if not stated),
            "currency": "VND",
            
            "debtor": {
                "name": "Full Name of Owner/Company",
                "taxId": "Tax ID (MST) or CCCD or Business Code",
                "address": "Address"
            },

            "attributes": {
                // FOR LAND_TITLE (Sổ Đỏ)
                "land_lot_no": "Thửa đất số",
                "land_map_no": "Tờ bản đồ số",
                "land_area": "Diện tích (m2)",
                "land_address": "Địa chỉ thửa đất",
                "land_purpose": "Mục đích sử dụng",
                "cert_book_entry": "Số vào sổ cấp GCN",

                // FOR VEHICLE
                "plate_number": "Biển số xe",
                "brand": "Nhãn hiệu",
                "vehicle_type": "Loại xe",
                "chassis_no": "Số khung",
                "engine_no": "Số máy",
                "valid_until": "Hạn đăng kiểm",
                
                // FOR SAVINGS
                "bank_name": "Tên ngân hàng",
                "book_serial": "Mã số sổ",
                "account_no": "Số tài khoản",
                "term": "Kỳ hạn",
                "maturity_date": "Ngày đến hạn",
                
                // FOR BUSINESS_REG
                "business_code": "Mã số doanh nghiệp",
                "company_name": "Tên công ty",
                "headquarters": "Địa chỉ trụ sở chính",
                "charter_capital": number (Vốn điều lệ),
                "legal_representative": "Người đại diện pháp luật",
                "representative_title": "Chức danh",
                "registration_date": "Ngày đăng ký",
                
                // FOR PATENT
                "patent_number": "Số bằng",
                "patent_title": "Tên sáng chế",
                "patent_owner": "Chủ bằng độc quyền",
                "inventor": "Tác giả sáng chế",
                "application_number": "Số đơn",
                "application_date": "Ngày nộp đơn",
                "grant_decision": "Quyết định cấp số",
                
                // FOR INVOICE
                "buyer_name": "Tên đơn vị mua",
                "seller_name": "Tên đơn vị bán"
            }
        }
        """

    def _post_process(self, data: dict) -> dict:
        """Post-process extracted data"""
        if data.get("doc_type") == "UNKNOWN":
             return {"error": True, "message": "Không nhận diện được loại giấy tờ."}
        
        if data.get("amount") is None: data["amount"] = 0
        
        attrs = data.get("attributes", {})
        
        # Auto-generate ID if missing
        if not data.get("invoiceNumber"):
            doc_type = data.get("doc_type", "")
            if doc_type == "LAND_TITLE":
                data["invoiceNumber"] = f"LAND-{attrs.get('land_lot_no', 'X')}-{attrs.get('land_map_no', 'Y')}"
            elif doc_type == "VEHICLE":
                data["invoiceNumber"] = attrs.get("plate_number", "VEH-UNKNOWN")
            elif doc_type == "BUSINESS_REG":
                data["invoiceNumber"] = attrs.get("business_code", f"BIZ-{random.randint(1000, 9999)}")
            elif doc_type == "PATENT":
                data["invoiceNumber"] = attrs.get("patent_number", f"PAT-{random.randint(1000, 9999)}")
            else:
                data["invoiceNumber"] = f"DOC-{random.randint(1000, 9999)}"

        # Fallback TaxID for OSINT
        if not data.get("debtor", {}).get("taxId"):
            if data.get("doc_type") == "VEHICLE":
                data["debtor"]["taxId"] = attrs.get("chassis_no", "Unknown")
            elif data.get("doc_type") == "BUSINESS_REG":
                data["debtor"]["taxId"] = attrs.get("business_code", "Unknown")
            else:
                data["debtor"]["taxId"] = "Unknown"

        print(f"🤖 Gemini Extracted: {data.get('doc_type')}")
        return data

    def _clean_json_string(self, json_string):
        """Helper làm sạch JSON"""
        if "```json" in json_string:
            json_string = json_string.replace("```json", "").replace("```", "")
        elif "```" in json_string:
            json_string = json_string.replace("```", "")
        return json_string.strip()

# Khởi tạo Global Service
gemini_service = GeminiService()

# Export alias for compatibility
OCRService = GeminiService

# Wrapper function for API routes
async def extract_invoice_data(file_content: bytes, mime_type: str):
    return await gemini_service.analyze_document(file_content, mime_type)
