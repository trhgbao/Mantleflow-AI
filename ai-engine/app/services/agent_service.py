import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime

# Cấu hình SMTP (Nếu muốn gửi thật)
# Nếu không cấu hình, hệ thống sẽ chạy chế độ SIMULATION (Mô phỏng)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("MAIL_USERNAME", "")
SMTP_PASSWORD = os.getenv("MAIL_PASSWORD", "")

def process_verification_request(doc_data):
    """
    Hàm chính: Điều phối việc gửi mail dựa trên loại tài liệu
    """
    doc_type = doc_data.get('doc_type')
    attrs = doc_data.get('attributes', {})
    
    # 1. LOGIC CHỌN ĐỐI TƯỢNG LIÊN HỆ (ROUTING)
    target = {}
    
    if doc_type == "LAND_TITLE":
        target = {
            "org": "Vietnam Valuation Corp (VVC)",
            "role": "Thẩm định viên Bất động sản",
            "email": "appraisal@vvc-valuation.vn",
            "action": "ĐỊNH GIÁ TÀI SẢN (APPRAISAL)"
        }
        subject, body = _template_land_title(doc_data, target)

    elif doc_type == "VEHICLE":
        brand = attrs.get('brand', 'Car')
        target = {
            "org": f"{brand} Service Center",
            "role": "Trưởng phòng Kỹ thuật",
            "email": f"service@{brand.lower().replace(' ', '')}.com.vn",
            "action": "KIỂM TRA HIỆN TRẠNG & ĐỊNH GIÁ"
        }
        subject, body = _template_vehicle(doc_data, target)

    elif doc_type == "SAVINGS":
        bank = attrs.get('bank_name', 'Bank')
        target = {
            "org": bank,
            "role": "Giám đốc Chi nhánh",
            "email": "verify@bank-risk-control.vn",
            "action": "XÁC THỰC PHONG TỎA SỔ"
        }
        subject, body = _template_savings(doc_data, target)

    elif doc_type == "INVOICE":
        # Gửi cho bên mua để xác nhận công nợ
        buyer = attrs.get('buyer_name', 'Partner')
        target = {
            "org": buyer,
            "role": "Phòng Kế toán (AP Dept)",
            "email": "accounting@partner.com",
            "action": "XÁC NHẬN CÔNG NỢ (AUDIT CONFIRMATION)"
        }
        subject, body = _template_invoice(doc_data, target)

    else:
        # Fallback
        target = {"email": "manual-review@mantleflow.com", "org": "Internal"}
        subject = "Manual Review Required"
        body = f"Please review doc ID: {doc_data.get('invoiceNumber')}"

    # 2. THỰC HIỆN GỬI (HOẶC MÔ PHỎNG)
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

# --- CÁC TEMPLATE EMAIL CHUYÊN NGHIỆP ---

def _template_land_title(data, target):
    attrs = data.get('attributes', {})
    subject = f"YÊU CẦU ĐỊNH GIÁ BĐS: {attrs.get('land_map_no', 'N/A')} / {attrs.get('land_lot_no', 'N/A')}"
    body = f"""
    Kính gửi {target['role']} tại {target['org']},

    Hệ thống MantleFlow vừa nhận được hồ sơ thế chấp Bất động sản sau:
    
    THÔNG TIN TÀI SẢN:
    - Chủ sở hữu: {data['debtor']['name']}
    - Thửa đất số: {attrs.get('land_lot_no')}
    - Tờ bản đồ số: {attrs.get('land_map_no')}
    - Diện tích: {attrs.get('land_area')} m2
    - Địa chỉ: {attrs.get('land_address')}
    
    YÊU CẦU:
    Vui lòng thực hiện khảo sát và gửi Chứng thư thẩm định giá (Valuation Report) trong vòng 24h.
    Mục đích: Thế chấp vay vốn (LTV 70%).

    Trân trọng,
    MantleFlow AI Risk Team
    """
    return subject, body

def _template_vehicle(data, target):
    attrs = data.get('attributes', {})
    subject = f"CHECK LỊCH SỬ & ĐỊNH GIÁ XE: {attrs.get('plate_number')}"
    body = f"""
    Kính gửi {target['role']} tại {target['org']},

    Vui lòng kiểm tra lịch sử bảo dưỡng và định giá phương tiện sau:
    
    CHI TIẾT PHƯƠNG TIỆN:
    - Biển kiểm soát: {attrs.get('plate_number')}
    - Số khung: {attrs.get('chassis_no')}
    - Số máy: {attrs.get('engine_no')}
    - Nhãn hiệu: {attrs.get('brand')}
    
    YÊU CẦU:
    1. Kiểm tra xe có tai nạn/ngập nước không?
    2. Định giá thị trường hiện tại.

    Trân trọng,
    MantleFlow AI Automations
    """
    return subject, body

def _template_savings(data, target):
    attrs = data.get('attributes', {})
    subject = f"YÊU CẦU PHONG TỎA SỔ TIẾT KIỆM SỐ {attrs.get('book_serial')}"
    body = f"""
    Kính gửi {target['role']} - {target['org']},

    Khách hàng {data['debtor']['name']} đang thực hiện vay cầm cố sổ tiết kiệm tại MantleFlow.
    
    THÔNG TIN SỔ:
    - Mã số sổ: {attrs.get('book_serial')}
    - Kỳ hạn: {attrs.get('term')}
    - Ngày đáo hạn: {attrs.get('maturity_date')}
    - Số tiền gốc: {data['amount']:,.0f} VND
    
    Vui lòng xác thực tính hợp lệ của sổ và thực hiện phong tỏa tạm thời.

    Trân trọng,
    MantleFlow Operations
    """
    return subject, body

def _template_invoice(data, target):
    subject = f"XÁC NHẬN CÔNG NỢ HÓA ĐƠN #{data.get('invoiceNumber')}"
    body = f"""
    Kính gửi {target['role']} - {target['org']},

    Chúng tôi đang tài trợ vốn cho hóa đơn sau:
    - Số hóa đơn: {data.get('invoiceNumber')}
    - Bên bán: {data.get('attributes', {}).get('seller_name')}
    - Tổng tiền: {data.get('amount'):,.0f} VND
    
    Vui lòng xác nhận qua email này nếu hóa đơn trên là có thật và chưa được thanh toán.
    
    Trân trọng,
    MantleFlow Receivables Financing
    """
    return subject, body

# --- HÀM GỬI SMTP THẬT (HOẶC GIẢ LẬP) ---
def _send_email_via_smtp(to_email, subject, body):
    # Nếu không có mật khẩu mail trong .env -> Chạy chế độ giả lập (Simulation)
    if not SMTP_PASSWORD:
        print(f"⚠️ SIMULATION MODE: Email to {to_email} generated but NOT sent via SMTP.")
        return "SIMULATED_SENT"
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_EMAIL, to_email, text)
        server.quit()
        return "SMTP_SENT_SUCCESS"
    except Exception as e:
        print(f"❌ SMTP Error: {e}")
        return f"FAILED: {str(e)}"
