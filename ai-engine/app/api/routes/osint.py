from fastapi import APIRouter, HTTPException

from ...models.osint import OSINTRequest, OSINTResponse
from ...services.osint_checker import osint_checker

router = APIRouter(prefix="/ai", tags=["OSINT Anti-Fraud"])


@router.post("/osint", response_model=OSINTResponse)
async def check_osint(request: OSINTRequest):
    """
    Perform OSINT anti-fraud check on a company

    Checks 5 factors (max 20 points each = 100 total):
    1. Website - Existence, SSL, content, domain age
    2. LinkedIn - Company page, employee count, activity
    3. Google Maps - Business listing, rating, reviews
    4. Press/News - News coverage, negative mentions
    5. Social Media - Facebook, Zalo presence

    Auto-reject rules:
    - Business age < 6 months
    - 3+ red flags = Shell company
    - OSINT score < 30

    Returns:
    - OSINT score (0-100)
    - Shell company flag
    - Auto-reject status
    - Individual check results
    - Red flags list
    - Recommendation
    """
    try:
        result = await osint_checker.check_company(
            company_name=request.company_name,
            tax_id=request.tax_id,
            address=request.address,
            website=request.website,
            registration_date=request.registration_date
        )

        return OSINTResponse(
            success=True,
            data=result
        )

    except Exception as e:
        return OSINTResponse(
            success=False,
            error=f"OSINT check error: {str(e)}"
        )


@router.get("/osint/factors")
async def get_osint_factors():
    """
    Get OSINT check factor definitions

    Returns the factors and scoring criteria used for OSINT verification.
    """
    return {
        "factors": [
            {
                "name": "website",
                "max_score": 20,
                "checks": [
                    "Website exists and accessible",
                    "Has SSL certificate (HTTPS)",
                    "Has actual content",
                    "Domain age > 1 year"
                ]
            },
            {
                "name": "linkedin",
                "max_score": 20,
                "checks": [
                    "Company page exists",
                    "Employee count > 5",
                    "Recent activity",
                    "Profile completeness"
                ]
            },
            {
                "name": "google_maps",
                "max_score": 20,
                "checks": [
                    "Business listing exists",
                    "Rating > 3.5",
                    "Has reviews",
                    "Verified business"
                ]
            },
            {
                "name": "press_news",
                "max_score": 20,
                "checks": [
                    "News articles found",
                    "No negative press",
                    "Recent mentions",
                    "Reputable sources"
                ]
            },
            {
                "name": "social_media",
                "max_score": 20,
                "checks": [
                    "Facebook page exists",
                    "Zalo OA exists",
                    "Follower count > 100",
                    "Active posting"
                ]
            }
        ],
        "red_flags": [
            "No website or website not accessible",
            "No LinkedIn presence or 0 employees",
            "No Google Maps listing",
            "No press/news coverage",
            "No social media presence",
            "Business age < 6 months"
        ],
        "auto_reject_rules": {
            "shell_company": "3+ red flags detected",
            "low_score": "OSINT score < 30",
            "new_business": "Business age < 6 months"
        }
    }


@router.post("/osint/quick-check")
async def quick_osint_check(company_name: str, website: str = None):
    """
    Quick OSINT check with minimal inputs

    Use this for fast preliminary checks.
    """
    try:
        result = await osint_checker.check_company(
            company_name=company_name,
            website=website
        )

        return {
            "company_name": company_name,
            "osint_score": result.osint_score,
            "is_shell_company": result.is_shell_company,
            "auto_reject": result.auto_reject,
            "red_flags_count": len(result.red_flags),
            "recommendation": result.recommendation
        }

    except Exception as e:
        return {
            "error": str(e)
        }
