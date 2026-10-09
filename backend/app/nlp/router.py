"""
NLP API Routes

Exposes intent classification and evaluation endpoints.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.models.db_models import User
from app.nlp.intent_classifier import classify_intent, evaluate_classifier

router = APIRouter(prefix="/api/nlp", tags=["NLP"])


class ClassifyRequest(BaseModel):
    text: str


@router.post("/classify")
def classify(
    data: ClassifyRequest,
    current_user: User = Depends(get_current_user),
):
    """Classify the intent of a text message."""
    return classify_intent(data.text)


@router.get("/evaluate")
def evaluate(current_user: User = Depends(get_current_user)):
    """
    Run a train/test split evaluation on the intent dataset.
    Returns accuracy, macro F1, and a per-class report.
    """
    result = evaluate_classifier()
    if result is None:
        return {"error": "Dataset not found at data/intent_dataset.csv"}
    return result
