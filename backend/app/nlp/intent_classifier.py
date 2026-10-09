"""
NLP Intent Classifier

Classifies user messages into one of 5 intent categories using
a TF-IDF + Logistic Regression pipeline trained on a small
labeled dataset.

This is a real NLP classification pipeline, not a prompt trick.
"""

import pickle
import os
from pathlib import Path
from typing import Optional

# Lazy imports — only load sklearn when needed
_classifier = None
_vectorizer = None
_is_trained = False

MODEL_PATH = Path(__file__).parent.parent.parent / "data" / "intent_model.pkl"
DATASET_PATH = Path(__file__).parent.parent.parent / "data" / "intent_dataset.csv"

INTENT_LABELS = {
    "emotional_support": "Emotional Support",
    "asking_for_advice": "Asking for Advice",
    "goal_planning": "Goal Planning",
    "journaling": "Journaling",
    "general_conversation": "General Conversation",
}

# Maps intents to suggested conversation modes
INTENT_TO_MODE = {
    "emotional_support": "talk_reflect",
    "asking_for_advice": "problem_solver",
    "goal_planning": "goal_planner",
    "journaling": "talk_reflect",
    "general_conversation": "talk_reflect",
}


def _load_or_train() -> bool:
    """
    Load a saved model from disk, or train a new one if none exists.
    Returns True if the classifier is ready, False if training data is missing.
    """
    global _classifier, _vectorizer, _is_trained

    if _is_trained:
        return True

    # Try loading a pre-trained model first
    if MODEL_PATH.exists():
        try:
            with open(MODEL_PATH, "rb") as f:
                bundle = pickle.load(f)
                _vectorizer = bundle["vectorizer"]
                _classifier = bundle["classifier"]
                _is_trained = True
                return True
        except Exception:
            pass

    # Train from dataset
    if not DATASET_PATH.exists():
        return False

    return _train_and_save()


def _train_and_save() -> bool:
    """Train the classifier on the dataset and save to disk."""
    global _classifier, _vectorizer, _is_trained
    try:
        import csv
        from sklearn.pipeline import Pipeline
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import LabelEncoder

        texts, labels = [], []
        with open(DATASET_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                texts.append(row["text"])
                labels.append(row["intent"])

        if len(texts) < 10:
            return False

        _vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True,
            strip_accents="unicode",
            analyzer="word",
            token_pattern=r"\w{1,}",
        )
        _classifier = LogisticRegression(
            max_iter=1000,
            C=5.0,
            solver="lbfgs",
            multi_class="auto",
        )

        X = _vectorizer.fit_transform(texts)
        _classifier.fit(X, labels)
        _is_trained = True

        # Save to disk
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({"vectorizer": _vectorizer, "classifier": _classifier}, f)

        return True
    except Exception:
        return False


def classify_intent(text: str) -> dict:
    """
    Classify the intent of a user message.

    Returns a dict with:
      - intent: the predicted intent label (str)
      - confidence: probability of the predicted class (float 0-1)
      - label: human-readable intent name (str)
      - suggested_mode: recommended conversation mode (str)
      - available: whether the classifier is working (bool)

    If the classifier is unavailable or uncertain, returns a safe fallback.
    """
    if not _load_or_train():
        return _fallback_response()

    try:
        X = _vectorizer.transform([text])
        predicted = _classifier.predict(X)[0]
        proba = _classifier.predict_proba(X)[0]
        confidence = float(max(proba))

        # If confidence is low, treat as general conversation
        if confidence < 0.35:
            return {
                "intent": "general_conversation",
                "confidence": confidence,
                "label": INTENT_LABELS["general_conversation"],
                "suggested_mode": "talk_reflect",
                "available": True,
            }

        return {
            "intent": predicted,
            "confidence": round(confidence, 3),
            "label": INTENT_LABELS.get(predicted, predicted),
            "suggested_mode": INTENT_TO_MODE.get(predicted, "talk_reflect"),
            "available": True,
        }
    except Exception:
        return _fallback_response()


def _fallback_response() -> dict:
    return {
        "intent": "general_conversation",
        "confidence": 0.0,
        "label": "General Conversation",
        "suggested_mode": "talk_reflect",
        "available": False,
    }


def evaluate_classifier() -> Optional[dict]:
    """
    Run a quick train/test split evaluation and return metrics.
    Used by the /api/nlp/evaluate endpoint.
    """
    if not DATASET_PATH.exists():
        return None

    try:
        import csv
        from sklearn.model_selection import train_test_split
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import (
            accuracy_score,
            f1_score,
            classification_report,
        )

        texts, labels = [], []
        with open(DATASET_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                texts.append(row["text"])
                labels.append(row["intent"])

        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )

        vec = TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)
        clf = LogisticRegression(max_iter=1000, C=5.0)

        X_tr = vec.fit_transform(X_train)
        X_te = vec.transform(X_test)
        clf.fit(X_tr, y_train)
        y_pred = clf.predict(X_te)

        accuracy = round(accuracy_score(y_test, y_pred), 4)
        macro_f1 = round(f1_score(y_test, y_pred, average="macro"), 4)
        report = classification_report(y_test, y_pred, output_dict=True)

        return {
            "accuracy": accuracy,
            "macro_f1": macro_f1,
            "train_size": len(X_train),
            "test_size": len(X_test),
            "classes": list(INTENT_LABELS.keys()),
            "report": report,
        }
    except Exception as e:
        return {"error": str(e)}
