from app.config import CONFIDENCE_THRESHOLD, SEVERITY_HIGH


def classify_severity(confidence: float) -> str:
    """
    Classifies detection severity based on confidence thresholds in app.config:
    - "HIGH" if confidence >= SEVERITY_HIGH (0.90)
    - "MEDIUM" if confidence >= CONFIDENCE_THRESHOLD (0.65)
    """
    if confidence >= SEVERITY_HIGH:
        return "HIGH"
    elif confidence >= CONFIDENCE_THRESHOLD:
        return "MEDIUM"
    else:
        return "MEDIUM"

