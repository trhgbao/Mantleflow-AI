def calculate_risk_score(invoice_amount: float, osint_score: int, history_defaults: int = 0):
    score = 0
    
    # 1. Trọng số OSINT (Chiếm 40% quan trọng nhất)
    score += (osint_score / 100) * 40
    
    # 2. Invoice Amount (Chiếm 30%)
    # < 50k USD là an toàn, > 100k rủi ro cao hơn
    if invoice_amount < 50000: score += 30
    elif invoice_amount < 100000: score += 20
    else: score += 10
    
    # 3. History (Chiếm 30%)
    if history_defaults == 0: score += 30
    elif history_defaults == 1: score += 10
    else: score += 0
    
    # Quy ra Tier
    final_score = round(score)
    if final_score >= 80:
        tier = "A"
        ltv = 80
        interest = 5
    elif final_score >= 50:
        tier = "B"
        ltv = 60
        interest = 8
    elif final_score >= 30:
        tier = "C"
        ltv = 40
        interest = 12
    else:
        tier = "D" # REJECT
        ltv = 0
        interest = 0
        
    return {
        "score": final_score,
        "tier": tier,
        "ltv": ltv,
        "interest_rate": interest,
        "recommendation": "APPROVE" if tier != "D" else "REJECT"
    }
