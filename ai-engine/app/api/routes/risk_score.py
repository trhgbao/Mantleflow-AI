from fastapi import APIRouter, HTTPException
from typing import Optional

from ...models.risk import RiskScoreRequest, RiskScoreResponse
from ...services.risk_scoring import risk_scoring_service

router = APIRouter(prefix="/ai", tags=["Risk Scoring"])


@router.post("/risk-score", response_model=RiskScoreResponse)
async def calculate_risk_score(request: RiskScoreRequest):
    """
    Calculate risk score for a loan application

    8-Feature Scoring:
    1. wallet_age (10%): Borrower wallet age
    2. tx_volume_30d (15%): 30-day transaction volume
    3. debtor_reputation (15%): Historical reputation
    4. debtor_business_age (15%): Debtor business age (< 6 months = REJECT)
    5. debtor_osint_score (15%): OSINT verification score
    6. invoice_amount (10%): Invoice size risk
    7. payment_term_days (5%): Payment term length
    8. past_loan_history (10%): Default history

    Returns:
    - Total score (0-100)
    - Risk tier (A/B/C/D)
    - LTV percentage (80/60/40/0)
    - Interest rate (5/8/12/0)
    - Score breakdown
    - Approval status
    """
    try:
        result = risk_scoring_service.calculate_score(
            wallet_address=request.wallet_address,
            invoice_amount=request.invoice_amount,
            payment_term_days=request.payment_term_days,
            debtor_business_age_months=request.debtor_business_age_months,
            osint_score=request.osint_score,
            wallet_age_days=request.wallet_age_days,
            tx_volume_30d=request.tx_volume_30d,
            past_defaults=request.past_defaults,
            debtor_tax_id=request.debtor_tax_id
        )

        return RiskScoreResponse(
            success=True,
            data={
                "total_score": result.total_score,
                "tier": result.tier.value,
                "ltv": result.ltv,
                "interest_rate": result.interest_rate,
                "breakdown": {
                    k: {
                        "score": v.score,
                        "weight": v.weight,
                        "weighted": v.weighted,
                        "raw_value": v.raw_value,
                        "description": v.description
                    }
                    for k, v in result.breakdown.items()
                },
                "recommendation": result.recommendation,
                "is_approved": result.is_approved
            }
        )

    except Exception as e:
        return RiskScoreResponse(
            success=False,
            error=f"Risk scoring error: {str(e)}"
        )


@router.get("/risk-tiers")
async def get_risk_tiers():
    """
    Get risk tier definitions

    Returns the tier thresholds and parameters used for scoring.
    """
    return {
        "tiers": {
            "A": {
                "score_range": [80, 100],
                "ltv": 80,
                "interest_rate": 5.0,
                "description": "Excellent credit - lowest risk"
            },
            "B": {
                "score_range": [50, 79],
                "ltv": 60,
                "interest_rate": 8.0,
                "description": "Good credit - moderate risk"
            },
            "C": {
                "score_range": [30, 49],
                "ltv": 40,
                "interest_rate": 12.0,
                "description": "Fair credit - elevated risk"
            },
            "D": {
                "score_range": [0, 29],
                "ltv": 0,
                "interest_rate": 0,
                "description": "Poor credit - rejected"
            }
        },
        "features": [
            {"name": "wallet_age", "weight": 10, "description": "Borrower wallet age in days"},
            {"name": "tx_volume_30d", "weight": 15, "description": "30-day transaction volume in USD"},
            {"name": "debtor_reputation", "weight": 15, "description": "Debtor historical reputation"},
            {"name": "debtor_business_age", "weight": 15, "description": "Debtor business age in months"},
            {"name": "debtor_osint_score", "weight": 15, "description": "OSINT verification score"},
            {"name": "invoice_amount", "weight": 10, "description": "Invoice amount in USD"},
            {"name": "payment_term_days", "weight": 5, "description": "Payment term in days"},
            {"name": "past_loan_history", "weight": 10, "description": "Past default count"}
        ],
        "auto_reject_rules": [
            "Business age < 6 months",
            "OSINT score < 30",
            "Total score < 30 (Tier D)"
        ]
    }
