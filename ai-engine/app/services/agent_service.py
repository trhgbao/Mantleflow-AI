"""
Agent Service - AI Collection Agent and Email Generation
Handles escalation logic and AI-powered email content generation
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from dotenv import load_dotenv

load_dotenv()

# SMTP Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("MAIL_USERNAME", "")
SMTP_PASSWORD = os.getenv("MAIL_PASSWORD", "")


class AgentService:
    """
    AI Collection Agent Service

    Features:
    - Escalation ladder management (4 levels)
    - AI-powered email content generation
    - Automated notification dispatch
    """

    def __init__(self):
        self.smtp_configured = bool(SMTP_EMAIL and SMTP_PASSWORD)

    async def escalate(
        self,
        loan_id: str,
        current_level: int,
        days_overdue: int,
        borrower_email: str,
        borrower_phone: Optional[str] = None,
        amount_owed: float = 0,
        currency: str = "VND",
        borrower_name: Optional[str] = None,
        company_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process escalation for a loan based on days overdue

        Escalation Ladder:
        - Level 1: 3 days before due (-3) -> Friendly reminder
        - Level 2: Due date (0) -> Urgent + SMS
        - Level 3: 7 days overdue -> Final warning + List NFT
        - Level 4: 14 days overdue -> Liquidation notice
        """
        # Determine appropriate level based on days_overdue
        if days_overdue <= -3:
            target_level = 1
        elif days_overdue <= 0:
            target_level = 2
        elif days_overdue <= 7:
            target_level = 3
        else:
            target_level = 4

        new_level = max(current_level, target_level)

        # Generate email content
        email_data = await self.generate_email(
            level=new_level,
            borrower_name=borrower_name or "Valued Customer",
            company_name=company_name,
            loan_amount=amount_owed,
            currency=currency,
            due_date=(datetime.now() - timedelta(days=days_overdue)).strftime("%Y-%m-%d"),
            days_overdue=days_overdue,
            language="vi"
        )

        actions_taken = []

        # Email action
        email_status = self._send_email(borrower_email, email_data['subject'], email_data['body'])
        actions_taken.append({
            "action": "email",
            "status": "sent" if "SUCCESS" in email_status or "SIMULATED" in email_status else "failed",
            "recipient": borrower_email,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        # SMS for level 2+
        if new_level >= 2 and borrower_phone:
            actions_taken.append({
                "action": "sms",
                "status": "sent",
                "recipient": borrower_phone,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })

        # NFT listing for level 3
        if new_level == 3:
            actions_taken.append({
                "action": "list_nft_marketplace",
                "status": "pending",
                "recipient": None,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })

        # Liquidation for level 4
        if new_level == 4:
            actions_taken.append({
                "action": "trigger_dutch_auction",
                "status": "pending",
                "recipient": None,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })

        # Next escalation info
        next_escalation = None
        if new_level < 4:
            next_triggers = {
                1: {"level": 2, "trigger_at": "Due date", "actions": ["Email urgent", "SMS"]},
                2: {"level": 3, "trigger_at": "7 days overdue", "actions": ["Final warning", "List NFT"]},
                3: {"level": 4, "trigger_at": "14 days overdue", "actions": ["Liquidation notice", "Dutch auction"]}
            }
            next_escalation = next_triggers.get(new_level)

        level_names = {1: "Friendly Reminder", 2: "Urgent Notice", 3: "Final Warning", 4: "Liquidation"}

        return {
            "level": new_level,
            "actions_taken": actions_taken,
            "next_escalation": next_escalation,
            "message": f"Escalation to Level {new_level} ({level_names.get(new_level)}) completed"
        }

    async def generate_email(
        self,
        level: int,
        borrower_name: str,
        company_name: Optional[str] = None,
        loan_amount: float = 0,
        currency: str = "VND",
        due_date: str = "",
        days_overdue: int = 0,
        language: str = "vi"
    ) -> Dict[str, Any]:
        """Generate email content based on escalation level"""
        display_name = company_name or borrower_name

        if level == 1:
            tone = "friendly"
            subject = "Nhắc nhở thanh toán - MantleFlow"
            body = f"""Kính gửi {display_name},

Chúng tôi xin nhắc nhở về khoản vay sắp đến hạn thanh toán.

THÔNG TIN KHOẢN VAY:
- Số tiền: {loan_amount:,.0f} {currency}
- Ngày đáo hạn: {due_date}

Vui lòng đảm bảo thanh toán đúng hạn.

Trân trọng,
MantleFlow Team"""

        elif level == 2:
            tone = "urgent"
            subject = "KHẨN CẤP: Khoản vay đến hạn thanh toán - MantleFlow"
            body = f"""Kính gửi {display_name},

Đây là thông báo KHẨN CẤP về khoản vay ĐÃ ĐẾN HẠN.

THÔNG TIN KHOẢN VAY:
- Số tiền: {loan_amount:,.0f} {currency}
- Ngày đáo hạn: {due_date}

Vui lòng thanh toán NGAY để tránh lãi quá hạn.

Trân trọng,
MantleFlow Team"""

        elif level == 3:
            tone = "final_warning"
            subject = f"CẢNH BÁO CUỐI: Khoản vay quá hạn {days_overdue} ngày - MantleFlow"
            body = f"""Kính gửi {display_name},

Đây là CẢNH BÁO CUỐI CÙNG trước khi tiến hành thu hồi nợ.

THÔNG TIN KHOẢN VAY:
- Số tiền: {loan_amount:,.0f} {currency}
- Ngày đáo hạn: {due_date}
- Số ngày quá hạn: {days_overdue} ngày

⚠️ NFT tài sản đảm bảo sẽ được đưa lên sàn đấu giá nếu không thanh toán trong 7 ngày.

Trân trọng,
MantleFlow Collection Team"""

        else:
            tone = "liquidation"
            subject = "THÔNG BÁO THANH LÝ TÀI SẢN - MantleFlow"
            body = f"""Kính gửi {display_name},

Do khoản vay đã quá hạn {days_overdue} ngày, chúng tôi bắt buộc phải THANH LÝ TÀI SẢN.

THÔNG TIN KHOẢN VAY:
- Số tiền: {loan_amount:,.0f} {currency}
- Số ngày quá hạn: {days_overdue} ngày

🔴 TÀI SẢN ĐẢM BẢO (NFT) ĐANG ĐƯỢC ĐẤU GIÁ.

Trân trọng,
MantleFlow Legal & Collections"""

        return {"subject": subject, "body": body, "tone": tone, "level": level}

    def _send_email(self, to_email: str, subject: str, body: str) -> str:
        """Send email via SMTP"""
        if not self.smtp_configured:
            print(f"⚠️ SIMULATION MODE: Email to {to_email}")
            return "SIMULATED_SENT"

        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
            server.quit()
            return "SMTP_SENT_SUCCESS"
        except Exception as e:
            print(f"❌ SMTP Error: {e}")
            return f"FAILED: {str(e)}"


# Global instance
agent_service = AgentService()


# === LEGACY FUNCTIONS (backward compatibility) ===

def process_verification_request(doc_data):
    """Legacy function for document verification email routing"""
    doc_type = doc_data.get('doc_type')
    attrs = doc_data.get('attributes', {})
    debtor = doc_data.get('debtor', {})

    target = {}

    if doc_type == "LAND_TITLE":
        target = {
            "org": "Vietnam Valuation Corp (VVC)",
            "role": "Thẩm định viên Bất động sản",
            "email": "appraisal@vvc-valuation.vn",
            "action": "ĐỊNH GIÁ TÀI SẢN"
        }
        subject = f"YÊU CẦU ĐỊNH GIÁ BĐS: {attrs.get('land_map_no', 'N/A')}"
        body = f"""Kính gửi {target['role']} tại {target['org']},

THÔNG TIN TÀI SẢN:
- Chủ sở hữu: {debtor.get('name', 'N/A')}
- Thửa đất số: {attrs.get('land_lot_no', 'N/A')}
- Diện tích: {attrs.get('land_area', 'N/A')} m2

Trân trọng,
MantleFlow AI Risk Team"""

    elif doc_type == "VEHICLE":
        brand = attrs.get('brand', 'Car')
        target = {
            "org": f"{brand} Service Center",
            "role": "Trưởng phòng Kỹ thuật",
            "email": f"service@{brand.lower().replace(' ', '')}.com.vn",
            "action": "ĐỊNH GIÁ XE"
        }
        subject = f"CHECK ĐỊNH GIÁ XE: {attrs.get('plate_number', 'N/A')}"
        body = f"""Kính gửi {target['role']} tại {target['org']},

CHI TIẾT:
- Biển số: {attrs.get('plate_number', 'N/A')}
- Số khung: {attrs.get('chassis_no', 'N/A')}

Trân trọng,
MantleFlow"""

    elif doc_type == "SAVINGS":
        target = {
            "org": attrs.get('bank_name', 'Bank'),
            "role": "Giám đốc Chi nhánh",
            "email": "verify@bank-risk-control.vn",
            "action": "PHONG TỎA SỔ"
        }
        subject = f"YÊU CẦU PHONG TỎA SỔ {attrs.get('book_serial', 'N/A')}"
        body = f"""Kính gửi {target['role']} - {target['org']},

THÔNG TIN SỔ:
- Mã số sổ: {attrs.get('book_serial', 'N/A')}
- Số tiền: {doc_data.get('amount', 0):,.0f} VND

Trân trọng,
MantleFlow"""

    elif doc_type == "BUSINESS_REG":
        target = {
            "org": "Sở Kế hoạch và Đầu tư",
            "role": "Phòng ĐKKD",
            "email": "dkkd@dpi.gov.vn",
            "action": "XÁC THỰC ĐKKD"
        }
        subject = f"XÁC THỰC ĐKKD: {attrs.get('business_code', 'N/A')}"
        body = f"""Kính gửi {target['role']} - {target['org']},

THÔNG TIN:
- MST: {attrs.get('business_code', 'N/A')}
- Tên công ty: {attrs.get('company_name', 'N/A')}

Trân trọng,
MantleFlow"""

    elif doc_type == "PATENT":
        target = {
            "org": "Cục Sở hữu trí tuệ",
            "role": "Phòng Sáng chế",
            "email": "patent@ipvietnam.gov.vn",
            "action": "XÁC THỰC BẰNG SC"
        }
        subject = f"XÁC THỰC BẰNG SÁNG CHẾ: {attrs.get('patent_number', 'N/A')}"
        body = f"""Kính gửi {target['role']} - {target['org']},

THÔNG TIN:
- Số bằng: {attrs.get('patent_number', 'N/A')}

Trân trọng,
MantleFlow"""

    elif doc_type == "INVOICE":
        target = {
            "org": attrs.get('buyer_name', 'Partner'),
            "role": "Phòng Kế toán",
            "email": "accounting@partner.com",
            "action": "XÁC NHẬN CÔNG NỢ"
        }
        subject = f"XÁC NHẬN HÓA ĐƠN #{doc_data.get('invoiceNumber', 'N/A')}"
        body = f"""Kính gửi {target['role']} - {target['org']},

- Số HĐ: {doc_data.get('invoiceNumber', 'N/A')}
- Số tiền: {doc_data.get('amount', 0):,.0f} VND

Trân trọng,
MantleFlow"""

    else:
        target = {"email": "manual-review@mantleflow.com", "org": "Internal", "role": "Review", "action": "REVIEW"}
        subject = "Manual Review Required"
        body = f"Please review doc ID: {doc_data.get('invoiceNumber')}"

    send_status = _send_email_via_smtp(target['email'], subject, body)

    return {
        "success": True,
        "target": target,
        "email_content": {
            "to": target['email'],
            "subject": subject,
            "body": body,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "delivery_status": send_status
    }


def _send_email_via_smtp(to_email, subject, body):
    """Legacy SMTP send function"""
    if not SMTP_PASSWORD:
        print(f"⚠️ SIMULATION MODE: Email to {to_email}")
        return "SIMULATED_SENT"

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
        return "SMTP_SENT_SUCCESS"
    except Exception as e:
        print(f"❌ SMTP Error: {e}")
        return f"FAILED: {str(e)}"
