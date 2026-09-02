def classify_severity(confidence: float) -> str:
    """
    Classifies detection severity based on confidence threshold:
    - "HIGH" if confidence >= 0.90
    - "MEDIUM" if confidence >= 0.70
    - "FILTERED" if confidence < 0.70
    """
    if confidence >= 0.90:
        return "HIGH"
    elif confidence >= 0.70:
        return "MEDIUM"
    else:
        return "FILTERED"
