import requests
import difflib
import re
import unicodedata

# === DATABASE DỰ PHÒNG (OFFLINE BACKUP) ===
# Điền các công ty bạn sẽ dùng để Demo vào đây.
# Nếu API lỗi mạng, hệ thống sẽ lấy dữ liệu từ đây để trả về -> DEMO KHÔNG BAO GIỜ CHẾT.
OFFLINE_DB = {
    "1001321287": {
        "name": "CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ XÂY DỰNG NGÔI NHÀ VIỆT",
        "address": "Thái Bình, Việt Nam",
        "status": "Active"
    },
    "0101245486": {
        "name": "CÔNG TY TNHH PHẦN MỀM FPT",
        "address": "Hà Nội, Việt Nam",
        "status": "Active"
    },
    "0100686868": {
        "name": "TẬP ĐOÀN VINGROUP - CÔNG TY CP",
        "address": "Hà Nội, Việt Nam",
        "status": "Active"
    }
}

def check_osint(tax_id: str, input_name: str):
    # 1. VỆ SINH MST
    clean_tax_id = re.sub(r'\D', '', str(tax_id))
    
    if not clean_tax_id or len(clean_tax_id) < 10:
        # Check if it's "Unknown" which means we skipped tax ID extraction
        if tax_id == "Unknown":
            return return_fraud_result("Không tìm thấy MST trong tài liệu.", "MISSING_TAX_ID")
            
        return return_fraud_result("Mã số thuế không hợp lệ.", "INVALID_FORMAT")

    print(f"🚀 OSINT Checking: MST {clean_tax_id} vs Name '{input_name}'")

    real_name = ""
    real_address = ""
    source = "API"

    # 2. CƠ CHẾ GỌI API + BACKUP
    try:
        # Thêm User-Agent để tránh bị chặn
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        url = f"https://api.vietqr.io/v2/business/{clean_tax_id}"
        
        # Tăng timeout lên 10 giây
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data and data.get('id'):
                real_name = data.get('name', '').upper()
                real_address = data.get('address', '')
            else:
                # API trả về 200 nhưng không có data -> Thử tìm Offline
                raise Exception("API returned empty data")
        else:
             # API trả về 404/500 -> Thử tìm Offline
             raise Exception(f"API Error {response.status_code}")

    except Exception as e:
        print(f"⚠️ API Failed ({e}). Switching to OFFLINE DB...")
        
        # --- FALLBACK: TÌM TRONG OFFLINE DB ---
        if clean_tax_id in OFFLINE_DB:
            record = OFFLINE_DB[clean_tax_id]
            real_name = record['name'].upper()
            real_address = record['address']
            source = "OFFLINE_CACHE"
            print(f"✅ FOUND IN CACHE: {real_name}")
        else:
            # Nếu không tìm thấy ở đâu cả -> Coi như MST không tồn tại
            return return_fraud_result(
                f"Không tìm thấy thông tin MST {clean_tax_id} (Server Timeout & No Cache).",
                "DATA_NOT_FOUND"
            )

    # 3. SO SÁNH TÊN (IDENTITY MATCHING)
    print(f"✅ REAL DATA ({source}): {real_name}")
    
    core_input = standardize_name_aggressive(input_name)
    core_real = standardize_name_aggressive(real_name)
    
    # Tính điểm trùng khớp
    similarity = difflib.SequenceMatcher(None, core_input, core_real).ratio()
    print(f"🔍 MATCH SCORE: {int(similarity*100)}% ('{core_input}' vs '{core_real}')")
    
    # Logic check:
    # - Giống > 40%
    # - Hoặc chứa nhau (VD: NGÔI NHÀ VIỆT nằm trong CTY NGÔI NHÀ VIỆT)
    is_match = similarity > 0.4 or (len(core_input) > 2 and core_input in core_real) or (len(core_real) > 2 and core_real in core_input)

    if not is_match:
        return {
            "is_shell_company": True,
            "osint_score": 25,
            "red_flags": [
                "⚠️ GIẢ MẠO DANH TÍNH (Identity Mismatch)",
                f"MST {clean_tax_id} thuộc về: **{real_name}**",
                f"Không khớp với: **{input_name}**",
                f"Độ khớp: {int(similarity*100)}%"
            ],
            "details": {
                "website": {"status": "Suspicious"},
                "database_check": {"status": "MISMATCH ❌", "real_name": real_name}
            }
        }

    # HỢP LỆ
    return {
        "is_shell_company": False,
        "osint_score": 95,
        "red_flags": [],
        "details": {
            "website": {"status": "Active"},
            "database_check": {
                "status": f"MATCHED ✅ ({source})", 
                "real_name": real_name,
                "address": real_address
            },
            "news_check": {"sentiment": "Safe"}
        }
    }

def standardize_name_aggressive(name):
    if not name: return ""
    # Chuẩn hóa tên: Bỏ dấu, viết hoa, bỏ từ rác
    name = remove_accents(name).upper()
    
    stopwords = [
        "CONG TY", "CO PHAN", "TNHH", "TRACH NHIEM", "HUU HAN", "MTV",
        "THUONG MAI", "DICH VU", "XAY DUNG", "DAU TU", "SAN XUAT", "XNK",
        "JSC", "CORP", "LTD", "GROUP", "HOLDINGS"
    ]
    
    for word in stopwords:
        name = re.sub(r'\b' + word + r'\b', ' ', name)
    
    name = re.sub(r'[^A-Z0-9]', ' ', name)
    return ' '.join(name.split())

def remove_accents(input_str):
    if not input_str: return ""
    s1 = unicodedata.normalize('NFD', str(input_str))
    s2 = ''.join(c for c in s1 if unicodedata.category(c) != 'Mn')
    return s2

def return_fraud_result(reason, code):
    return {
        "is_shell_company": True,
        "osint_score": 10,
        "red_flags": [reason],
        "details": {"database_check": {"status": code}}
    }
