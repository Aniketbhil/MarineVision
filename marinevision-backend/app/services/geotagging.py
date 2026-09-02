from typing import List, Dict, Any


def attach_location(detections: List[Dict[str, Any]], latitude: float, longitude: float) -> List[Dict[str, Any]]:
    """
    Attaches scan-level latitude and longitude coordinates to every detection dictionary in the list.
    Modifies detection dicts in-place and returns the list.
    """
    for det in detections:
        det["latitude"] = float(latitude)
        det["longitude"] = float(longitude)
    return detections
