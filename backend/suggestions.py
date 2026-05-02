"""
GazeTalk Backend — Word suggestion / prediction engine.
Uses a frequency-ranked English word list with prefix matching.
Returns top-N completions for a partial word input.
"""
import logging
from typing import List

logger = logging.getLogger("gztalk.suggestions")

# Top ~500 most common English words, frequency-ordered
# This is a lightweight, offline approach — no external deps needed
COMMON_WORDS = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
    "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
    "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
    "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
    "great", "help", "need", "house", "water", "food", "please", "thank", "thanks",
    "hello", "hi", "goodbye", "bye", "yes", "no", "okay", "sorry", "excuse",
    "stop", "start", "go", "wait", "come", "here", "there", "left", "right",
    "up", "down", "more", "less", "big", "small", "hot", "cold", "good", "bad",
    "happy", "sad", "hungry", "thirsty", "tired", "sick", "pain", "hurt",
    "doctor", "hospital", "medicine", "emergency", "call", "phone", "home",
    "family", "friend", "mother", "father", "brother", "sister", "child",
    "love", "feel", "want", "need", "can", "eat", "drink", "sleep", "walk",
    "sit", "stand", "open", "close", "turn", "light", "dark", "room", "door",
    "bathroom", "kitchen", "bed", "chair", "table", "outside", "inside",
    "morning", "afternoon", "evening", "night", "today", "tomorrow", "yesterday",
    "what", "where", "when", "why", "how", "much", "many", "again", "always",
    "never", "sometimes", "soon", "later", "before", "after", "now",
    "very", "really", "too", "enough", "just", "still", "already", "almost",
    "understand", "speak", "listen", "read", "write", "learn", "teach",
    "name", "age", "address", "number", "school", "job", "money", "price",
    "beautiful", "wonderful", "amazing", "important", "different", "same",
    "together", "alone", "quiet", "loud", "fast", "slow", "easy", "hard",
]

# Deduplicate while preserving order
_seen = set()
WORD_LIST: List[str] = []
for w in COMMON_WORDS:
    if w not in _seen:
        _seen.add(w)
        WORD_LIST.append(w)


def suggest(partial: str, limit: int = 5) -> List[str]:
    """Return up to `limit` word completions for a partial string.
    Prioritises frequency rank (earlier in list = more common).
    """
    if not partial or not partial.strip():
        return []

    prefix = partial.strip().lower()
    results = []

    for word in WORD_LIST:
        if word.startswith(prefix) and word != prefix:
            results.append(word)
            if len(results) >= limit:
                break

    return results


def suggest_next_word(context: str, limit: int = 5) -> List[str]:
    """Given the full typed text so far, suggest the next most likely word.
    Currently uses simple heuristics — could be replaced with an ML model.
    """
    if not context or not context.strip():
        # Common conversation starters
        return ["hello", "i", "please", "help", "thank"]

    words = context.strip().lower().split()
    last_word = words[-1] if words else ""

    # If the last word looks incomplete (no space at end), suggest completions
    if not context.endswith(' '):
        return suggest(last_word, limit)

    # Otherwise suggest common follow-up words
    FOLLOW_UPS = {
        "i": ["want", "need", "am", "feel", "can"],
        "please": ["help", "call", "give", "open", "come"],
        "can": ["you", "i", "we", "help", "go"],
        "help": ["me", "please", "now", "call", "emergency"],
        "want": ["to", "food", "water", "help", "go"],
        "need": ["help", "water", "food", "medicine", "doctor"],
        "thank": ["you", "thanks", "so", "very", "much"],
        "go": ["home", "outside", "to", "now", "there"],
        "feel": ["good", "bad", "sick", "tired", "hungry"],
        "am": ["good", "hungry", "tired", "sick", "happy"],
    }

    suggestions = FOLLOW_UPS.get(last_word, [])
    if suggestions:
        return suggestions[:limit]

    # Default: common words
    return ["please", "help", "want", "need", "thank"][:limit]
