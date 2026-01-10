from fastapi import APIRouter, HTTPException

from ...models.agent import EscalateRequest, EscalateResponse
from ...services.agent_service import agent_service

router = APIRouter(prefix="/ai", tags=["AI Collection Agent"])


@router.post("/agent/escalate", response_model=EscalateResponse)
async def escalate_loan(request: EscalateRequest):
    """
    Trigger AI agent escalation for a loan

    Escalation Ladder:
    - Level 1: 3 days before due → Email friendly reminder
    - Level 2: Due date → Email urgent + SMS
    - Level 3: 7 days overdue → Email final warning + List NFT on marketplace
    - Level 4: 14 days overdue → Trigger liquidation

    The agent automatically:
    - Determines appropriate escalation level
    - Sends notifications (email, SMS)
    - Lists NFT for auction (level 3)
    - Triggers liquidation (level 4)

    Returns:
    - Current escalation level
    - Actions taken
    - Next escalation info
    """
    try:
        result = await agent_service.escalate(
            loan_id=request.loan_id,
            current_level=request.current_level,
            days_overdue=request.days_overdue,
            borrower_email=request.borrower_email,
            borrower_phone=request.borrower_phone,
            amount_owed=request.amount_owed,
            currency=request.currency,
            borrower_name=request.borrower_name,
            company_name=request.company_name
        )

        return EscalateResponse(
            success=True,
            data=result
        )

    except Exception as e:
        return EscalateResponse(
            success=False,
            error=f"Escalation error: {str(e)}"
        )


@router.get("/agent/escalation-rules")
async def get_escalation_rules():
    """
    Get escalation rules and ladder

    Returns the escalation triggers and actions for each level.
    """
    return {
        "levels": [
            {
                "level": 1,
                "name": "Friendly Reminder",
                "trigger": "3 days before due date",
                "days_overdue": -3,
                "actions": ["Email (friendly tone)"],
                "tone": "friendly"
            },
            {
                "level": 2,
                "name": "Urgent Notice",
                "trigger": "Due date",
                "days_overdue": 0,
                "actions": ["Email (urgent tone)", "SMS notification"],
                "tone": "urgent"
            },
            {
                "level": 3,
                "name": "Final Warning",
                "trigger": "7 days overdue",
                "days_overdue": 7,
                "actions": ["Email (final warning)", "List NFT on marketplace"],
                "tone": "final"
            },
            {
                "level": 4,
                "name": "Liquidation",
                "trigger": "14 days overdue",
                "days_overdue": 14,
                "actions": ["Email (liquidation notice)", "Trigger Dutch auction"],
                "tone": "liquidation"
            }
        ],
        "email_tones": {
            "friendly": "Polite reminder with helpful tone",
            "urgent": "Serious but professional urgency",
            "final": "Stern warning about consequences",
            "liquidation": "Formal notice of asset liquidation"
        }
    }
