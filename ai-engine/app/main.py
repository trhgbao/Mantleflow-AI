from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.ocr_service import extract_invoice_data
from app.services.osint_checker import check_osint
from app.services.risk_scoring import calculate_risk_score
from app.services.agent_service import process_verification_request

app = FastAPI(title="MantleFlow AI Engine")

# Cho phép Frontend React gọi vào
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskRequest(BaseModel):
    invoice_amount: float
    debtor_name: str
    debtor_tax_id: str

@app.get("/")
def health_check():
    return {"status": "AI Engine is running 🚀"}

@app.post("/ai/extract")
async def extract_invoice(file: UploadFile = File(...)):
    content = await file.read()
    
    # THÊM await VÀO ĐÂY
    data = await extract_invoice_data(content, file.content_type)
    
    if data.get("error"):
        # Xử lý lỗi (tuỳ chọn raise HTTPException hoặc trả về dict)
        return data 
        
    return data

@app.post("/ai/analyze-risk")
async def analyze_risk(req: RiskRequest):
    # 1. Chạy OSINT
    osint_result = check_osint(req.debtor_tax_id, req.debtor_name)
    
    # 2. Nếu là Shell Company -> Auto Reject (Tier D)
    if osint_result['is_shell_company']:
        return {
            "osint": osint_result,
            "risk": {
                "score": 20,
                "tier": "D",
                "ltv": 0,
                "interest_rate": 0,
                "recommendation": "REJECT - SHELL COMPANY DETECTED"
            }
        }
        
    # 3. Tính điểm Risk nếu legit
    risk_result = calculate_risk_score(req.invoice_amount, osint_result['osint_score'])
    
    return {
        "osint": osint_result,
        "risk": risk_result
    }

@app.post("/ai/trigger-email")
async def trigger_email_agent(doc_data: dict):
    """
    API kích hoạt Agent gửi mail
    """
    result = process_verification_request(doc_data)
    return result

# Chạy server: uvicorn app.main:app --reload
