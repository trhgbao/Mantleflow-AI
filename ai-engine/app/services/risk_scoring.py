"""
Risk Scoring Service - 8-Feature Credit Risk Assessment
Calculates risk score and determines loan tier
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class RiskTier(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


@dataclass
class FeatureScore:
    """Individual feature score breakdown"""
    score: float
    weight: float
    weighted: float
    raw_value: Any
    description: str


@dataclass
class RiskScoreResult:
    """Risk score calculation result"""
    total_score: float
    tier: RiskTier
    ltv: int
    interest_rate: float
    breakdown: Dict[str, FeatureScore]
    recommendation: str
    is_approved: bool


class RiskScoringService:
    """
    8-Feature Risk Scoring Service

    Features and weights:
    1. wallet_age (10%): Borrower wallet age
    2. tx_volume_30d (15%): 30-day transaction volume
    3. debtor_reputation (15%): Historical reputation
    4. debtor_business_age (15%): Debtor business age (< 6 months = REJECT)
    5. debtor_osint_score (15%): OSINT verification score
    6. invoice_amount (10%): Invoice size risk
    7. payment_term_days (5%): Payment term length
    8. past_loan_history (10%): Default history
    """

    # Feature weights (total = 100%)
    WEIGHTS = {
        "wallet_age": 10,
        "tx_volume_30d": 15,
        "debtor_reputation": 15,
        "debtor_business_age": 15,
        "debtor_osint_score": 15,
        "invoice_amount": 10,
        "payment_term_days": 5,
        "past_loan_history": 10
    }

    # Tier thresholds
    TIERS = {
        "A": {"min_score": 80, "ltv": 80, "interest_rate": 5.0},
        "B": {"min_score": 50, "ltv": 60, "interest_rate": 8.0},
        "C": {"min_score": 30, "ltv": 40, "interest_rate": 12.0},
        "D": {"min_score": 0, "ltv": 0, "interest_rate": 0}
    }

    def calculate_score(
        self,
        wallet_address: str,
        invoice_amount: float,
        payment_term_days: int = 30,
        debtor_business_age_months: int = 24,
        osint_score: Optional[float] = None,
        wallet_age_days: Optional[int] = None,
        tx_volume_30d: Optional[float] = None,
        past_defaults: Optional[int] = None,
        debtor_tax_id: Optional[str] = None
    ) -> RiskScoreResult:
        """
        Calculate comprehensive risk score

        Auto-reject rules:
        - Business age < 6 months
        - OSINT score < 30
        - Total score < 30 (Tier D)
        """
        breakdown = {}

        # 1. Wallet Age (10%)
        wallet_age = wallet_age_days or 365  # Default 1 year if not provided
        wallet_age_score = min(100, (wallet_age / 365) * 100)
        breakdown["wallet_age"] = FeatureScore(
            score=wallet_age_score,
            weight=self.WEIGHTS["wallet_age"],
            weighted=wallet_age_score * self.WEIGHTS["wallet_age"] / 100,
            raw_value=wallet_age,
            description=f"Wallet age: {wallet_age} days"
        )

        # 2. Transaction Volume 30d (15%)
        tx_vol = tx_volume_30d or 10000  # Default $10k if not provided
        if tx_vol >= 100000:
            tx_score = 100
        elif tx_vol >= 50000:
            tx_score = 80
        elif tx_vol >= 10000:
            tx_score = 60
        else:
            tx_score = 40
        breakdown["tx_volume_30d"] = FeatureScore(
            score=tx_score,
            weight=self.WEIGHTS["tx_volume_30d"],
            weighted=tx_score * self.WEIGHTS["tx_volume_30d"] / 100,
            raw_value=tx_vol,
            description=f"30-day volume: ${tx_vol:,.0f}"
        )

        # 3. Debtor Reputation (15%) - Placeholder
        reputation_score = 70  # Default good reputation
        breakdown["debtor_reputation"] = FeatureScore(
            score=reputation_score,
            weight=self.WEIGHTS["debtor_reputation"],
            weighted=reputation_score * self.WEIGHTS["debtor_reputation"] / 100,
            raw_value="Good",
            description="Debtor reputation: Good"
        )

        # 4. Debtor Business Age (15%) - AUTO REJECT if < 6 months
        if debtor_business_age_months < 6:
            business_age_score = 0
            auto_reject_reason = "Business age < 6 months"
        elif debtor_business_age_months < 12:
            business_age_score = 40
            auto_reject_reason = None
        elif debtor_business_age_months < 24:
            business_age_score = 70
            auto_reject_reason = None
        else:
            business_age_score = 100
            auto_reject_reason = None
        breakdown["debtor_business_age"] = FeatureScore(
            score=business_age_score,
            weight=self.WEIGHTS["debtor_business_age"],
            weighted=business_age_score * self.WEIGHTS["debtor_business_age"] / 100,
            raw_value=debtor_business_age_months,
            description=f"Business age: {debtor_business_age_months} months"
        )

        # 5. OSINT Score (15%) - AUTO REJECT if < 30
        osint = osint_score or 70  # Default if not provided
        if osint < 30:
            auto_reject_reason = "OSINT score < 30"
        breakdown["debtor_osint_score"] = FeatureScore(
            score=osint,
            weight=self.WEIGHTS["debtor_osint_score"],
            weighted=osint * self.WEIGHTS["debtor_osint_score"] / 100,
            raw_value=osint,
            description=f"OSINT score: {osint}"
        )

        # 6. Invoice Amount (10%)
        if invoice_amount < 50000:
            invoice_score = 100
        elif invoice_amount < 100000:
            invoice_score = 70
        elif invoice_amount < 500000:
            invoice_score = 50
        else:
            invoice_score = 30
        breakdown["invoice_amount"] = FeatureScore(
            score=invoice_score,
            weight=self.WEIGHTS["invoice_amount"],
            weighted=invoice_score * self.WEIGHTS["invoice_amount"] / 100,
            raw_value=invoice_amount,
            description=f"Invoice: ${invoice_amount:,.0f}"
        )

        # 7. Payment Term (5%)
        if payment_term_days <= 30:
            term_score = 100
        elif payment_term_days <= 60:
            term_score = 80
        elif payment_term_days <= 90:
            term_score = 60
        else:
            term_score = 40
        breakdown["payment_term_days"] = FeatureScore(
            score=term_score,
            weight=self.WEIGHTS["payment_term_days"],
            weighted=term_score * self.WEIGHTS["payment_term_days"] / 100,
            raw_value=payment_term_days,
            description=f"Payment term: {payment_term_days} days"
        )

        # 8. Past Loan History (10%)
        defaults = past_defaults or 0
        if defaults == 0:
            history_score = 100
        elif defaults == 1:
            history_score = 50
        else:
            history_score = 0
        breakdown["past_loan_history"] = FeatureScore(
            score=history_score,
            weight=self.WEIGHTS["past_loan_history"],
            weighted=history_score * self.WEIGHTS["past_loan_history"] / 100,
            raw_value=defaults,
            description=f"Past defaults: {defaults}"
        )

        # Calculate total weighted score
        total_score = sum(f.weighted for f in breakdown.values())
        total_score = round(total_score, 2)

        # Determine tier
        if total_score >= 80:
            tier = RiskTier.A
        elif total_score >= 50:
            tier = RiskTier.B
        elif total_score >= 30:
            tier = RiskTier.C
        else:
            tier = RiskTier.D

        # Get tier parameters
        tier_params = self.TIERS[tier.value]

        # Auto-reject checks
        is_approved = tier != RiskTier.D
        if debtor_business_age_months < 6:
            is_approved = False
            tier = RiskTier.D
        if osint and osint < 30:
            is_approved = False
            tier = RiskTier.D

        # Build recommendation
        if is_approved:
            recommendation = f"APPROVE - Tier {tier.value}: LTV {tier_params['ltv']}%, Rate {tier_params['interest_rate']}%"
        else:
            recommendation = f"REJECT - {auto_reject_reason or 'Score too low'}"

        return RiskScoreResult(
            total_score=total_score,
            tier=tier,
            ltv=tier_params["ltv"] if is_approved else 0,
            interest_rate=tier_params["interest_rate"] if is_approved else 0,
            breakdown=breakdown,
            recommendation=recommendation,
            is_approved=is_approved
        )


# Global instance
risk_scoring_service = RiskScoringService()


# Legacy function for backward compatibility
def calculate_risk_score(invoice_amount: float, osint_score: int, history_defaults: int = 0):
    """Legacy simple risk scoring function"""
    score = 0

    # OSINT (40%)
    score += (osint_score / 100) * 40

    # Invoice Amount (30%)
    if invoice_amount < 50000:
        score += 30
    elif invoice_amount < 100000:
        score += 20
    else:
        score += 10

    # History (30%)
    if history_defaults == 0:
        score += 30
    elif history_defaults == 1:
        score += 10
    else:
        score += 0

    final_score = round(score)

    if final_score >= 80:
        tier, ltv, interest = "A", 80, 5
    elif final_score >= 50:
        tier, ltv, interest = "B", 60, 8
    elif final_score >= 30:
        tier, ltv, interest = "C", 40, 12
    else:
        tier, ltv, interest = "D", 0, 0

    return {
        "score": final_score,
        "tier": tier,
        "ltv": ltv,
        "interest_rate": interest,
        "recommendation": "APPROVE" if tier != "D" else "REJECT"
    }
