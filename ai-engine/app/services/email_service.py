"""
Email Service - Gửi email xác minh và nhắc nhở thanh toán
Tích hợp từ ai-engine_resources/services/agent.py
Hỗ trợ gửi email THẬT qua SMTP
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# SMTP Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("MAIL_USERNAME", "")
SMTP_PASSWORD = os.getenv("MAIL_PASSWORD", "")

# Default recipient for demo (your personal email)
DEFAULT_DEMO_EMAIL = os.getenv("DEMO_EMAIL", "")


class EmailService:
    """
    Service gửi email xác minh và nhắc nhở thanh toán

    Features:
    - Gửi email xác minh chứng từ đến cơ quan có thẩm quyền
    - Gửi email nhắc nhở thanh toán (4 cấp độ)
    - Hỗ trợ override email để demo (gửi đến email cá nhân)
    """

    def __init__(self):
        self.smtp_configured = bool(SMTP_EMAIL and SMTP_PASSWORD)
        self.default_demo_email = DEFAULT_DEMO_EMAIL

    def is_smtp_configured(self) -> bool:
        """Check if SMTP is properly configured"""
        return self.smtp_configured

    def send_verification_email(
        self,
        doc_data: Dict[str, Any],
        override_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gửi email xác minh chứng từ đến cơ quan có thẩm quyền

        Args:
            doc_data: Dữ liệu chứng từ đã trích xuất
            override_email: Email override để demo (gửi đến email cá nhân thay vì cơ quan)

        Returns:
            Dict với thông tin email đã gửi
        """
        doc_type = doc_data.get('doc_type')
        attrs = doc_data.get('attributes', {})

        # Xác định đối tượng nhận email dựa trên loại chứng từ
        target = self._get_verification_target(doc_type, attrs, doc_data)

        # Tạo nội dung email
        subject, body = self._create_verification_email(doc_type, doc_data, attrs, target)

        # Sử dụng override email nếu có (cho demo)
        actual_recipient = override_email or self.default_demo_email or target['email']

        # Gửi email
        send_status = self._send_smtp(actual_recipient, subject, body)

        return {
            "success": send_status != "FAILED",
            "target": target,
            "email_content": {
                "to": actual_recipient,
                "original_target": target['email'],
                "subject": subject,
                "body": body,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "delivery_status": send_status
        }

    def send_payment_reminder(
        self,
        level: int,
        loan_data: Dict[str, Any],
        override_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gửi email nhắc nhở thanh toán

        Levels:
        1 - 3 ngày trước hạn: Nhắc nhẹ
        2 - Ngày đến hạn: Khẩn cấp
        3 - Quá hạn 7 ngày: Cảnh báo cuối
        4 - Quá hạn 14 ngày: Thông báo thanh lý

        Args:
            level: Cấp độ nhắc nhở (1-4)
            loan_data: Thông tin khoản vay
            override_email: Email override để demo
        """
        borrower_email = loan_data.get('borrower_email', '')
        actual_recipient = override_email or self.default_demo_email or borrower_email

        subject, body = self._create_payment_reminder(level, loan_data)

        send_status = self._send_smtp(actual_recipient, subject, body)

        tones = {1: "friendly", 2: "urgent", 3: "final_warning", 4: "liquidation"}

        return {
            "success": send_status != "FAILED",
            "level": level,
            "tone": tones.get(level, "professional"),
            "email_content": {
                "to": actual_recipient,
                "original_target": borrower_email,
                "subject": subject,
                "body": body,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "delivery_status": send_status
        }

    def _get_verification_target(
        self,
        doc_type: str,
        attrs: Dict[str, Any],
        doc_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Xác định đối tượng xác minh dựa trên loại chứng từ"""

        targets = {
            "LAND_TITLE": {
                "org": "Vietnam Valuation Corp (VVC)",
                "role": "Thẩm định viên Bất động sản",
                "email": "appraisal@vvc-valuation.vn",
                "action": "ĐỊNH GIÁ TÀI SẢN (APPRAISAL)"
            },
            "VEHICLE": {
                "org": f"{attrs.get('brand', 'Auto')} Service Center",
                "role": "Trưởng phòng Kỹ thuật",
                "email": f"service@{attrs.get('brand', 'auto').lower().replace(' ', '')}.com.vn",
                "action": "KIỂM TRA HIỆN TRẠNG & ĐỊNH GIÁ"
            },
            "SAVINGS": {
                "org": attrs.get('bank_name', 'Bank'),
                "role": "Giám đốc Chi nhánh",
                "email": "verify@bank-risk-control.vn",
                "action": "XÁC THỰC PHONG TỎA SỔ"
            },
            "BUSINESS_REG": {
                "org": "Sở Kế hoạch và Đầu tư",
                "role": "Phòng Đăng ký kinh doanh",
                "email": "dkkd@dpi.gov.vn",
                "action": "XÁC THỰC ĐĂNG KÝ DOANH NGHIỆP"
            },
            "PATENT": {
                "org": "Cục Sở hữu trí tuệ Việt Nam",
                "role": "Phòng Sáng chế",
                "email": "patent@ipvietnam.gov.vn",
                "action": "XÁC THỰC BẰNG ĐỘC QUYỀN SÁNG CHẾ"
            },
            "INVOICE": {
                "org": attrs.get('buyer_name', 'Partner'),
                "role": "Phòng Kế toán (AP Dept)",
                "email": "accounting@partner.com",
                "action": "XÁC NHẬN CÔNG NỢ (AUDIT CONFIRMATION)"
            }
        }

        return targets.get(doc_type, {
            "org": "MantleFlow Manual Review",
            "role": "Risk Team",
            "email": "review@mantleflow.com",
            "action": "MANUAL REVIEW REQUIRED"
        })

    def _create_verification_email(
        self,
        doc_type: str,
        doc_data: Dict[str, Any],
        attrs: Dict[str, Any],
        target: Dict[str, str]
    ) -> tuple:
        """Tạo nội dung email xác minh theo loại chứng từ"""

        debtor = doc_data.get('debtor', {})

        if doc_type == "LAND_TITLE":
            subject = f"YÊU CẦU ĐỊNH GIÁ BĐS: {attrs.get('land_map_no', 'N/A')} / {attrs.get('land_lot_no', 'N/A')}"
            body = f"""
Kính gửi {target['role']} tại {target['org']},

Hệ thống MantleFlow vừa nhận được hồ sơ thế chấp Bất động sản sau:

THÔNG TIN TÀI SẢN:
- Chủ sở hữu: {debtor.get('name', 'N/A')}
- Thửa đất số: {attrs.get('land_lot_no', 'N/A')}
- Tờ bản đồ số: {attrs.get('land_map_no', 'N/A')}
- Diện tích: {attrs.get('land_area', 'N/A')} m2
- Địa chỉ: {attrs.get('land_address', 'N/A')}
- Mục đích sử dụng: {attrs.get('land_purpose', 'N/A')}

YÊU CẦU:
Vui lòng thực hiện khảo sát và gửi Chứng thư thẩm định giá (Valuation Report) trong vòng 24h.
Mục đích: Thế chấp vay vốn.

Trân trọng,
MantleFlow AI Risk Team
            """

        elif doc_type == "VEHICLE":
            subject = f"CHECK LỊCH SỬ & ĐỊNH GIÁ XE: {attrs.get('plate_number', 'N/A')}"
            body = f"""
Kính gửi {target['role']} tại {target['org']},

Vui lòng kiểm tra lịch sử bảo dưỡng và định giá phương tiện sau:

CHI TIẾT PHƯƠNG TIỆN:
- Biển kiểm soát: {attrs.get('plate_number', 'N/A')}
- Số khung: {attrs.get('chassis_no', 'N/A')}
- Số máy: {attrs.get('engine_no', 'N/A')}
- Nhãn hiệu: {attrs.get('brand', 'N/A')}
- Loại xe: {attrs.get('vehicle_type', 'N/A')}
- Hạn đăng kiểm: {attrs.get('valid_until', 'N/A')}

YÊU CẦU:
1. Kiểm tra xe có tai nạn/ngập nước không?
2. Định giá thị trường hiện tại.

Trân trọng,
MantleFlow AI Automations
            """

        elif doc_type == "SAVINGS":
            subject = f"YÊU CẦU PHONG TỎA SỔ TIẾT KIỆM SỐ {attrs.get('book_serial', 'N/A')}"
            body = f"""
Kính gửi {target['role']} - {target['org']},

Khách hàng {debtor.get('name', 'N/A')} đang thực hiện vay cầm cố sổ tiết kiệm tại MantleFlow.

THÔNG TIN SỔ:
- Mã số sổ: {attrs.get('book_serial', 'N/A')}
- Số tài khoản: {attrs.get('account_no', 'N/A')}
- Kỳ hạn: {attrs.get('term', 'N/A')}
- Ngày đáo hạn: {attrs.get('maturity_date', 'N/A')}
- Số tiền gốc: {doc_data.get('amount', 0):,.0f} VND

Vui lòng xác thực tính hợp lệ của sổ và thực hiện phong tỏa tạm thời.

Trân trọng,
MantleFlow Operations
            """

        elif doc_type == "BUSINESS_REG":
            subject = f"XÁC THỰC ĐKKD: {attrs.get('business_code', 'N/A')} - {attrs.get('company_name', 'N/A')}"
            body = f"""
Kính gửi {target['role']} - {target['org']},

MantleFlow yêu cầu xác thực thông tin đăng ký doanh nghiệp sau:

THÔNG TIN DOANH NGHIỆP:
- Mã số doanh nghiệp: {attrs.get('business_code', 'N/A')}
- Tên công ty: {attrs.get('company_name', 'N/A')}
- Địa chỉ trụ sở chính: {attrs.get('headquarters', 'N/A')}
- Vốn điều lệ: {attrs.get('charter_capital', 0):,.0f} VND
- Người đại diện pháp luật: {attrs.get('legal_representative', 'N/A')}
- Chức danh: {attrs.get('representative_title', 'N/A')}
- Ngày đăng ký: {attrs.get('registration_date', 'N/A')}

YÊU CẦU:
Vui lòng xác nhận thông tin trên là chính xác và doanh nghiệp đang hoạt động bình thường.

Trân trọng,
MantleFlow Risk Assessment Team
            """

        elif doc_type == "PATENT":
            subject = f"XÁC THỰC BẰNG SÁNG CHẾ: {attrs.get('patent_number', 'N/A')}"
            body = f"""
Kính gửi {target['role']} - {target['org']},

MantleFlow yêu cầu xác thực bằng độc quyền sáng chế sau:

THÔNG TIN BẰNG SÁNG CHẾ:
- Số bằng: {attrs.get('patent_number', 'N/A')}
- Tên sáng chế: {attrs.get('patent_title', 'N/A')}
- Chủ bằng độc quyền: {attrs.get('patent_owner', 'N/A')}
- Tác giả sáng chế: {attrs.get('inventor', 'N/A')}
- Số đơn: {attrs.get('application_number', 'N/A')}
- Ngày nộp đơn: {attrs.get('application_date', 'N/A')}
- Quyết định cấp số: {attrs.get('grant_decision', 'N/A')}

YÊU CẦU:
Vui lòng xác nhận bằng sáng chế còn hiệu lực và thuộc quyền sở hữu của chủ thể nêu trên.

Trân trọng,
MantleFlow IP Verification Team
            """

        else:  # INVOICE
            subject = f"XÁC NHẬN CÔNG NỢ HÓA ĐƠN #{doc_data.get('invoiceNumber', 'N/A')}"
            body = f"""
Kính gửi {target['role']} - {target['org']},

Chúng tôi đang tài trợ vốn cho hóa đơn sau:
- Số hóa đơn: {doc_data.get('invoiceNumber', 'N/A')}
- Bên bán: {attrs.get('seller_name', 'N/A')}
- Tổng tiền: {doc_data.get('amount', 0):,.0f} VND

Vui lòng xác nhận qua email này nếu hóa đơn trên là có thật và chưa được thanh toán.

Trân trọng,
MantleFlow Receivables Financing
            """

        return subject, body.strip()

    def _create_payment_reminder(self, level: int, loan_data: Dict[str, Any]) -> tuple:
        """Tạo nội dung email nhắc nhở thanh toán theo cấp độ"""

        borrower_name = loan_data.get('borrower_name', 'Quý khách')
        loan_amount = loan_data.get('loan_amount', 0)
        currency = loan_data.get('currency', 'VND')
        due_date = loan_data.get('due_date', 'N/A')
        days_overdue = loan_data.get('days_overdue', 0)

        if level == 1:
            subject = "Nhắc nhở thanh toán - MantleFlow"
            body = f"""
Kính gửi {borrower_name},

Chúng tôi xin gửi lời chào trân trọng và nhắc nhở về khoản vay sắp đến hạn thanh toán.

THÔNG TIN KHOẢN VAY:
- Số tiền: {loan_amount:,.0f} {currency}
- Ngày đáo hạn: {due_date}

Vui lòng đảm bảo thanh toán đúng hạn để tránh các chi phí phát sinh.

Trân trọng,
MantleFlow Team
            """

        elif level == 2:
            subject = "KHẨN CẤP: Khoản vay đến hạn thanh toán - MantleFlow"
            body = f"""
Kính gửi {borrower_name},

Đây là thông báo KHẨN CẤP về khoản vay ĐÃ ĐẾN HẠN thanh toán.

THÔNG TIN KHOẢN VAY:
- Số tiền: {loan_amount:,.0f} {currency}
- Ngày đáo hạn: {due_date}
- Tình trạng: ĐÃ ĐẾN HẠN

Vui lòng thanh toán NGAY để tránh bị tính lãi quá hạn và ảnh hưởng đến điểm tín dụng.

Trân trọng,
MantleFlow Team
            """

        elif level == 3:
            subject = f"CẢNH BÁO CUỐI: Khoản vay quá hạn {days_overdue} ngày - MantleFlow"
            body = f"""
Kính gửi {borrower_name},

Đây là CẢNH BÁO CUỐI CÙNG trước khi chúng tôi tiến hành các biện pháp thu hồi nợ.

THÔNG TIN KHOẢN VAY:
- Số tiền: {loan_amount:,.0f} {currency}
- Ngày đáo hạn: {due_date}
- Số ngày quá hạn: {days_overdue} ngày

⚠️ NẾU KHÔNG THANH TOÁN TRONG 7 NGÀY, tài sản đảm bảo (NFT) sẽ được đưa lên sàn đấu giá.

Trân trọng,
MantleFlow Collection Team
            """

        else:  # Level 4
            subject = "THÔNG BÁO THANH LÝ TÀI SẢN - MantleFlow"
            body = f"""
Kính gửi {borrower_name},

Do khoản vay đã quá hạn {days_overdue} ngày mà không có phản hồi, chúng tôi bắt buộc phải THANH LÝ TÀI SẢN ĐẢM BẢO.

THÔNG TIN KHOẢN VAY:
- Số tiền: {loan_amount:,.0f} {currency}
- Ngày đáo hạn: {due_date}
- Số ngày quá hạn: {days_overdue} ngày

🔴 TÀI SẢN ĐẢM BẢO (NFT) SẼ ĐƯỢC ĐẤU GIÁ CÔNG KHAI TRÊN MARKETPLACE.

Nếu bạn muốn hoàn tất thanh toán trước khi đấu giá, vui lòng liên hệ ngay.

Trân trọng,
MantleFlow Legal & Collections
            """

        return subject, body.strip()

    def _send_smtp(self, to_email: str, subject: str, body: str) -> str:
        """Gửi email qua SMTP"""

        if not self.smtp_configured:
            print(f"⚠️ SIMULATION MODE: Email to {to_email}")
            print(f"   Subject: {subject}")
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

            print(f"✅ Email sent to {to_email}")
            return "SMTP_SENT_SUCCESS"

        except Exception as e:
            print(f"❌ SMTP Error: {e}")
            return f"FAILED: {str(e)}"


# Global instance
email_service = EmailService()
