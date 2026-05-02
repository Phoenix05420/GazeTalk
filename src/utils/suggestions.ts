/**
 * GazeTalk — Client-side word suggestion engine.
 * Runs entirely on-device — no backend required.
 * Ported from backend/suggestions.py with identical logic.
 */

// Top ~200 most common English words, frequency-ordered.
// Curated for AAC (Augmentative & Alternative Communication) use cases.
const COMMON_WORDS: string[] = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'great', 'help', 'need', 'house', 'water', 'food', 'please', 'thank', 'thanks',
  'hello', 'hi', 'goodbye', 'bye', 'yes', 'okay', 'sorry', 'excuse',
  'stop', 'start', 'wait', 'here', 'left', 'right',
  'down', 'more', 'less', 'big', 'small', 'hot', 'cold', 'bad',
  'happy', 'sad', 'hungry', 'thirsty', 'tired', 'sick', 'pain', 'hurt',
  'doctor', 'hospital', 'medicine', 'emergency', 'call', 'phone', 'home',
  'family', 'friend', 'mother', 'father', 'brother', 'sister', 'child',
  'love', 'feel', 'eat', 'drink', 'sleep', 'walk',
  'sit', 'stand', 'open', 'close', 'turn', 'light', 'dark', 'room', 'door',
  'bathroom', 'kitchen', 'bed', 'chair', 'table', 'outside', 'inside',
  'morning', 'afternoon', 'evening', 'night', 'today', 'tomorrow', 'yesterday',
  'where', 'why', 'much', 'many', 'again', 'always',
  'never', 'sometimes', 'soon', 'later', 'before',
  'very', 'really', 'too', 'enough', 'still', 'already', 'almost',
  'understand', 'speak', 'listen', 'read', 'write', 'learn', 'teach',
  'name', 'age', 'address', 'number', 'school', 'job', 'money', 'price',
  'beautiful', 'wonderful', 'amazing', 'important', 'different', 'same',
  'together', 'alone', 'quiet', 'loud', 'fast', 'slow', 'easy', 'hard',
];

// Deduplicate while preserving frequency order
const WORD_LIST: string[] = [...new Set(COMMON_WORDS)];

// Common follow-up words (context-aware next-word prediction)
const FOLLOW_UPS: Record<string, string[]> = {
  i:      ['want', 'need', 'am', 'feel', 'can'],
  please: ['help', 'call', 'give', 'open', 'come'],
  can:    ['you', 'i', 'we', 'help', 'go'],
  help:   ['me', 'please', 'now', 'call', 'emergency'],
  want:   ['to', 'food', 'water', 'help', 'go'],
  need:   ['help', 'water', 'food', 'medicine', 'doctor'],
  thank:  ['you', 'thanks', 'so', 'very', 'much'],
  go:     ['home', 'outside', 'to', 'now', 'there'],
  feel:   ['good', 'bad', 'sick', 'tired', 'hungry'],
  am:     ['good', 'hungry', 'tired', 'sick', 'happy'],
};

/**
 * Return up to `limit` word completions for a partial string.
 * Prioritises frequency rank (earlier in list = more common).
 */
function suggestPrefix(partial: string, limit: number = 5): string[] {
  if (!partial || !partial.trim()) return [];

  const prefix = partial.trim().toLowerCase();
  const results: string[] = [];

  for (const word of WORD_LIST) {
    if (word.startsWith(prefix) && word !== prefix) {
      results.push(word);
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Given the full typed text so far, suggest the next most likely word.
 * Uses prefix matching for incomplete words and context-based follow-ups
 * for completed words.
 */
export function suggestNextWord(context: string, limit: number = 5): string[] {
  if (!context || !context.trim()) {
    // Common conversation starters
    return ['hello', 'i', 'please', 'help', 'thank'].slice(0, limit);
  }

  const words = context.trim().toLowerCase().split(/\s+/);
  const lastWord = words.length > 0 ? words[words.length - 1] : '';

  // If the last word looks incomplete (no trailing space), suggest completions
  if (!context.endsWith(' ')) {
    return suggestPrefix(lastWord, limit);
  }

  // Otherwise suggest common follow-up words
  const followUps = FOLLOW_UPS[lastWord];
  if (followUps) {
    return followUps.slice(0, limit);
  }

  // Default: common words
  return ['please', 'help', 'want', 'need', 'thank'].slice(0, limit);
}

// Debounce utility
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced version of suggestNextWord.
 * Calls the callback with results after `delayMs` of inactivity.
 */
export function suggestNextWordDebounced(
  context: string,
  callback: (suggestions: string[]) => void,
  limit: number = 5,
  delayMs: number = 150,
): void {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    callback(suggestNextWord(context, limit));
  }, delayMs);
}
