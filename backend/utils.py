"""
GazeTalk Backend — Utility functions for sentence enhancement.
"""
import logging

logger = logging.getLogger("gztalk.utils")

# Lazy ML import — don't crash if model deps are missing
try:
    from ml_enhancer import enhance_sentence_ml
    ML_AVAILABLE = True
except Exception:
    ML_AVAILABLE = False
    logger.info("ML enhancer not available — using rule-based fallback")


# Gesture → word mapping for gaze+gesture fusion
GESTURE_MAP = {
    'open_palm': 'hello',
    'fist': 'stop',
    'point': 'look',
    'thumbs_up': 'good',
    'none': ''
}


def enhance_sentence(fused: dict) -> str:
    """Server-side sentence enhancer for gaze+gesture fusion.
    Uses ML model when available, else falls back to rule-based mapping.
    """
    gesture = fused.get('gesture', 'unknown')
    gx = fused.get('gaze_x', 0.5)
    gy = fused.get('gaze_y', 0.5)

    word = GESTURE_MAP.get(gesture, gesture)

    if ML_AVAILABLE and word:
        try:
            keywords = [word, f"at ({gx:.2f}, {gy:.2f})"]
            return enhance_sentence_ml(keywords)
        except Exception as e:
            logger.warning("ML enhancement failed, using fallback: %s", e)

    if word:
        return f"{word.capitalize()} at ({gx:.2f}, {gy:.2f})"
    return ''


def enhance_from_keywords(keywords: list) -> str:
    """Enhance a list of typed keywords (from the React Native eye-typing
    interface) into a natural sentence.
    Uses ML model when available, otherwise joins words with basic
    capitalisation as fallback.
    """
    if not keywords:
        return ''

    # Normalise: strip empty strings, lowercase
    words = [w.strip().lower() for w in keywords if w.strip()]
    if not words:
        return ''

    if ML_AVAILABLE:
        try:
            return enhance_sentence_ml(words)
        except Exception as e:
            logger.warning("ML keyword enhancement failed: %s", e)

    # Fallback: capitalise first word and join
    sentence = ' '.join(words)
    return sentence[0].upper() + sentence[1:] + '.'
