import google.generativeai as genai
from typing import Optional, List
import json
import re
from ..config import settings


class GeminiService:
    """Service for interacting with Google Gemini API"""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.vision_model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            self.vision_model = None

    def is_configured(self) -> bool:
        """Check if Gemini API is configured"""
        return self.model is not None

    async def extract_invoice_from_text(self, text: str) -> dict:
        """Extract invoice data from text using Gemini"""
        if not self.is_configured():
            return self._mock_invoice_extraction()

        prompt = f"""Analyze the following document text and extract invoice information.
Return a JSON object with these fields (use null for missing fields):
{{
    "invoice_number": "string - invoice number/ID",
    "amount": number - total amount,
    "currency": "VND" or "USD",
    "debtor": {{
        "name": "company name (buyer)",
        "tax_id": "tax ID or business registration number",
        "address": "address",
        "email": "email",
        "phone": "phone"
    }},
    "creditor": {{
        "name": "seller company name",
        "tax_id": "tax ID",
        "address": "address"
    }},
    "issue_date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD",
    "items": [
        {{
            "description": "item description",
            "quantity": number,
            "unit_price": number,
            "total": number
        }}
    ]
}}

Document text:
{text}

Return ONLY valid JSON, no markdown or explanation."""

        try:
            response = self.model.generate_content(prompt)
            json_text = response.text.strip()
            # Remove markdown code blocks if present
            json_text = re.sub(r'^```json\s*', '', json_text)
            json_text = re.sub(r'\s*```$', '', json_text)
            return json.loads(json_text)
        except Exception as e:
            print(f"Gemini extraction error: {e}")
            return self._mock_invoice_extraction()

    async def extract_invoice_from_image(self, image_bytes: bytes, mime_type: str = "image/png") -> dict:
        """Extract invoice data from image using Gemini Vision"""
        if not self.is_configured():
            return self._mock_invoice_extraction()

        prompt = """Analyze this invoice image and extract all information.
Return a JSON object with these fields (use null for missing fields):
{
    "invoice_number": "string - invoice number/ID",
    "amount": number - total amount,
    "currency": "VND" or "USD",
    "debtor": {
        "name": "company name (buyer)",
        "tax_id": "tax ID or business registration number",
        "address": "address",
        "email": "email",
        "phone": "phone"
    },
    "creditor": {
        "name": "seller company name",
        "tax_id": "tax ID",
        "address": "address"
    },
    "issue_date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD",
    "items": [
        {
            "description": "item description",
            "quantity": number,
            "unit_price": number,
            "total": number
        }
    ]
}

Return ONLY valid JSON, no markdown or explanation."""

        try:
            image_part = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            response = self.vision_model.generate_content([prompt, image_part])
            json_text = response.text.strip()
            json_text = re.sub(r'^```json\s*', '', json_text)
            json_text = re.sub(r'\s*```$', '', json_text)
            return json.loads(json_text)
        except Exception as e:
            print(f"Gemini vision error: {e}")
            return self._mock_invoice_extraction()

    async def generate_email(self, level: int, context: dict) -> dict:
        """Generate collection email using Gemini"""
        if not self.is_configured():
            return self._mock_email_generation(level, context)

        tone_map = {
            1: "friendly (nhe nhang, than thien)",
            2: "urgent (khan cap, nghiem tuc)",
            3: "final warning (canh bao cuoi cung)",
            4: "liquidation notice (thong bao thanh ly tai san)"
        }

        tone = tone_map.get(level, "professional")

        prompt = f"""Generate a professional debt collection email in Vietnamese.
Tone: {tone}
Level: {level}/4

Context:
- Borrower name: {context.get('borrower_name', 'Quy khach')}
- Company: {context.get('company_name', '')}
- Loan amount: {context.get('loan_amount', 0):,.0f} {context.get('currency', 'VND')}
- Due date: {context.get('due_date', '')}
- Days overdue: {context.get('days_overdue', 0)}

Return JSON format:
{{
    "subject": "email subject in Vietnamese",
    "body": "full email body in Vietnamese with proper formatting"
}}

For level 4, mention that the NFT collateral will be liquidated through auction.
Return ONLY valid JSON."""

        try:
            response = self.model.generate_content(prompt)
            json_text = response.text.strip()
            json_text = re.sub(r'^```json\s*', '', json_text)
            json_text = re.sub(r'\s*```$', '', json_text)
            return json.loads(json_text)
        except Exception as e:
            print(f"Gemini email generation error: {e}")
            return self._mock_email_generation(level, context)

    def _mock_invoice_extraction(self) -> dict:
        """Return mock invoice data for demo"""
        return {
            "invoice_number": "INV-2024-001234",
            "amount": 150000000,
            "currency": "VND",
            "debtor": {
                "name": "Cong ty TNHH ABC Technology",
                "tax_id": "0123456789",
                "address": "123 Nguyen Hue, Quan 1, TP.HCM",
                "email": "ketoan@abc-tech.vn",
                "phone": "028-12345678"
            },
            "creditor": {
                "name": "Cong ty CP XYZ Solutions",
                "tax_id": "9876543210",
                "address": "456 Le Loi, Quan 1, TP.HCM"
            },
            "issue_date": "2024-01-15",
            "due_date": "2024-03-15",
            "items": [
                {
                    "description": "Dich vu phat trien phan mem",
                    "quantity": 1,
                    "unit_price": 100000000,
                    "total": 100000000
                },
                {
                    "description": "Dich vu bao tri he thong",
                    "quantity": 1,
                    "unit_price": 50000000,
                    "total": 50000000
                }
            ]
        }

    def _mock_email_generation(self, level: int, context: dict) -> dict:
        """Return mock email for demo"""
        templates = {
            1: {
                "subject": "Nhac nho thanh toan - MantleFlow",
                "body": f"""Kinh gui {context.get('borrower_name', 'Quy khach')},

Chung toi xin gui loi chao tran trong va nhac nho ve khoan vay sap den han thanh toan.

Thong tin khoan vay:
- So tien: {context.get('loan_amount', 0):,.0f} {context.get('currency', 'VND')}
- Ngay dao han: {context.get('due_date', '')}

Vui long dam bao thanh toan dung han de tranh cac chi phi phat sinh.

Tran trong,
MantleFlow Team"""
            },
            2: {
                "subject": "KHAN CAP: Khoan vay den han thanh toan - MantleFlow",
                "body": f"""Kinh gui {context.get('borrower_name', 'Quy khach')},

Day la thong bao KHAN CAP ve khoan vay DA DEN HAN thanh toan.

Thong tin khoan vay:
- So tien: {context.get('loan_amount', 0):,.0f} {context.get('currency', 'VND')}
- Ngay dao han: {context.get('due_date', '')}
- Tinh trang: DA DEN HAN

Vui long thanh toan NGAY de tranh bi tinh lai qua han va anh huong den diem tin dung.

Tran trong,
MantleFlow Team"""
            },
            3: {
                "subject": "CANH BAO CUOI: Khoan vay qua han {0} ngay - MantleFlow".format(context.get('days_overdue', 0)),
                "body": f"""Kinh gui {context.get('borrower_name', 'Quy khach')},

Day la CANH BAO CUOI CUNG truoc khi chung toi tien hanh cac bien phap thu hoi no.

Thong tin khoan vay:
- So tien: {context.get('loan_amount', 0):,.0f} {context.get('currency', 'VND')}
- Ngay dao han: {context.get('due_date', '')}
- So ngay qua han: {context.get('days_overdue', 0)} ngay

NEU KHONG THANH TOAN TRONG 7 NGAY, tai san dam bao (NFT) se duoc dua len san dau gia.

Tran trong,
MantleFlow Team"""
            },
            4: {
                "subject": "THONG BAO THANH LY TAI SAN - MantleFlow",
                "body": f"""Kinh gui {context.get('borrower_name', 'Quy khach')},

Do khoan vay da qua han {context.get('days_overdue', 0)} ngay ma khong co phan hoi, chung toi bat buoc phai THANH LY TAI SAN DAM BAO.

Thong tin khoan vay:
- So tien: {context.get('loan_amount', 0):,.0f} {context.get('currency', 'VND')}
- Ngay dao han: {context.get('due_date', '')}
- So ngay qua han: {context.get('days_overdue', 0)} ngay

TAI SAN DAM BAO (NFT) SE DUOC DAU GIA CONG KHAI TREN MARKETPLACE.

Neu ban muon hoan tat thanh toan truoc khi dau gia, vui long lien he ngay.

Tran trong,
MantleFlow Team"""
            }
        }

        return templates.get(level, templates[1])


# Global instance
gemini_service = GeminiService()
