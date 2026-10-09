"""
Pre-train the NLP intent classifier and save the model to disk.
Run this once after setup: .venv\Scripts\python.exe scripts/train_intent_classifier.py
"""
import sys
from pathlib import Path

# Allow imports from the app package
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.nlp.intent_classifier import _train_and_save, DATASET_PATH, MODEL_PATH

print("Training intent classifier...")
if not DATASET_PATH.exists():
    print(f"ERROR: Dataset not found at {DATASET_PATH}")
    sys.exit(1)

success = _train_and_save()
if success:
    print(f"Model saved to {MODEL_PATH}")
    # Quick smoke test
    from app.nlp.intent_classifier import classify_intent
    tests = [
        "I feel really anxious and overwhelmed",
        "Help me make a plan to get fit",
        "I don't know how to deal with my boss",
        "I want to write about today",
        "Hey, how are you?",
    ]
    print("\nSmoke test results:")
    for text in tests:
        r = classify_intent(text)
        print(f"  '{text[:40]}...' -> {r['intent']} ({r['confidence']:.0%})")
else:
    print("ERROR: Training failed.")
    sys.exit(1)
