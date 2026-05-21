/**
 * GazeTalk — App configuration & Design System
 */
import { Dimensions, NativeModules } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Backend ──────────────────────────────────────────
// Automatically extract the host IP from the React Native bundle server
let backendIp = '10.241.202.82'; // Fallback IP (LAN)
if (__DEV__) {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:]+)/);
    if (match && match[1]) {
      backendIp = match[1];
    }
  }
}
export const BACKEND_URL = `http://${backendIp}:8000`;

// ─── Keyboard Layout ──────────────────────────────────
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const NUMBERS = '1234567890'.split('');
export const PUNCTUATION = ['.', ',', '?', '!', "'", '-'];

// QWERTY Row layouts (letter keys only)
export const QWERTY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

// ─── Indian Language Keyboard Layouts ─────────────────
// Tamil vowels + consonants (10 | 9 | 7 rows matching QWERTY)
export const TAMIL_ROWS = [
  ['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ'],
  ['க','ச','ட','த','ந','ப','ம','ய','ர','ல'],
  ['வ','ழ','ள','ற','ண','ன','ஷ'],
];

// Malayalam vowels + consonants
export const MALAYALAM_ROWS = [
  ['അ','ആ','ഇ','ഈ','ഉ','ഊ','എ','ഏ','ഐ','ഒ'],
  ['ക','ച','ട','ത','ന','പ','മ','യ','ര','ല'],
  ['വ','ശ','ഷ','സ','ഹ','ണ','ഴ'],
];

// Kannada vowels + consonants
export const KANNADA_ROWS = [
  ['ಅ','ಆ','ಇ','ಈ','ಉ','ಊ','ಎ','ಏ','ಐ','ಒ'],
  ['ಕ','ಚ','ಟ','ತ','ನ','ಪ','ಮ','ಯ','ರ','ಲ'],
  ['ವ','ಶ','ಷ','ಸ','ಹ','ಣ','ಳ'],
];

// Language → keyboard layout mapping
export const KEYBOARD_LAYOUTS: Record<LanguageId, string[][]> = {
  english:   QWERTY_ROWS,
  tamil:     TAMIL_ROWS,
  malayalam: MALAYALAM_ROWS,
  kannada:   KANNADA_ROWS,
};

// Vowel signs / matras for Indian languages (replaces punctuation row)
export const TAMIL_VOWEL_SIGNS = ['்','ா','ி','ீ','ு','ூ','ெ','ே','ை','ொ','ோ','ௌ'];
export const MALAYALAM_VOWEL_SIGNS = ['്','ാ','ി','ീ','ു','ൂ','െ','േ','ൈ','ൊ','ോ','ൌ'];
export const KANNADA_VOWEL_SIGNS = ['್','ಾ','ಿ','ೀ','ು','ೂ','ೆ','ೇ','ೈ','ೊ','ೋ','ೌ'];

export const VOWEL_SIGNS: Record<LanguageId, string[]> = {
  english:   PUNCTUATION,
  tamil:     TAMIL_VOWEL_SIGNS,
  malayalam: MALAYALAM_VOWEL_SIGNS,
  kannada:   KANNADA_VOWEL_SIGNS,
};

export const COLUMNS = 10;
const keyGutter = 4;
const rowPadding = 16;
export const BUTTON_SIZE = Math.min(36, (SCREEN_WIDTH - rowPadding * 2 - keyGutter * (COLUMNS - 1)) / COLUMNS);
export const KEY_GAP = keyGutter;

// ─── Gaze / Dwell ─────────────────────────────────────
export const DEFAULT_DWELL_TIME = 1500;    // ms to select key via gaze dwell
export const BLINK_COOLDOWN = 1000;        // ms between blink selections
export const SMOOTHING_FACTOR = 0.35;      // EMA smoothing (lower = smoother)
export const SENSITIVITY = 2.2;            // Gaze amplification factor

// ─── Dimensions ───────────────────────────────────────
export const SCREEN = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };

// ═══════════════════════════════════════════════════════
// ─── DESIGN SYSTEM & THEME ENGINE ─────────────────────
// ═══════════════════════════════════════════════════════

export type ThemeId = 'deep_space' | 'cyber_neon' | 'ocean_glass';

// ─── Languages ────────────────────────────────────────
export type LanguageId = 'english' | 'tamil' | 'malayalam' | 'kannada';

export interface Language {
  id: LanguageId;
  label: string;
  nativeLabel: string;
  nllbCode: string;
  ttsLocale: string;
}

export const LANGUAGES: Record<LanguageId, Language> = {
  english:   { id: 'english',   label: 'English',   nativeLabel: 'English',      nllbCode: 'eng_Latn', ttsLocale: 'en' },
  tamil:     { id: 'tamil',     label: 'Tamil',     nativeLabel: 'தமிழ்',         nllbCode: 'tam_Taml', ttsLocale: 'ta-IN' },
  malayalam: { id: 'malayalam', label: 'Malayalam', nativeLabel: 'മലയാളം',        nllbCode: 'mal_Mlym', ttsLocale: 'ml-IN' },
  kannada:   { id: 'kannada',   label: 'Kannada',   nativeLabel: 'ಕನ್ನಡ',         nllbCode: 'kan_Knda', ttsLocale: 'kn-IN' },
};

// Unicode ranges for Indian-language script detection
export const SCRIPT_PATTERNS: Record<Exclude<LanguageId, 'english'>, RegExp> = {
  tamil:     /[\u0B80-\u0BFF]/,
  malayalam: /[\u0D00-\u0D7F]/,
  kannada:   /[\u0C80-\u0CFF]/,
};

// TTS pitch adjustment per language for more natural pronunciation
export const TTS_PITCH: Record<LanguageId, number> = {
  english:   1.0,
  tamil:     0.95,
  malayalam: 0.95,
  kannada:   0.95,
};

// TTS rate per language (slower for Indian languages aids clarity)
export const TTS_RATE: Record<LanguageId, number> = {
  english:   0.9,
  tamil:     0.78,
  malayalam: 0.78,
  kannada:   0.78,
};

export const THEMES = {
  deep_space: {
    id: 'deep_space',
    name: 'Deep Space',
    primary:      '#00f2fe',   // Cyan
    primaryDim:   'rgba(0, 242, 254, 0.25)',
    secondary:    '#a855f7',   // Purple
    secondaryDim: 'rgba(168, 85, 247, 0.25)',
    accent:       '#4facfe',   // Blue
    accentDim:    'rgba(79, 172, 254, 0.2)',
    success:      '#43e97b',
    successGlow:  'rgba(67, 233, 123, 0.5)',
    danger:       '#ff3b30',
    warning:      '#ff9500',
    bg:           '#050510',
    bgCard:       'rgba(10, 10, 30, 0.85)',
    bgKeyTop:     'rgba(30, 30, 60, 0.6)',
    bgKeyBottom:  'rgba(8, 8, 20, 0.8)',
    textPrimary:  '#ffffff',
    textSecondary:'rgba(255, 255, 255, 0.7)',
    textMuted:    'rgba(255, 255, 255, 0.4)',
    textInverse:  '#0a0a1a',
    borderGlass:  'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(0, 242, 254, 0.6)',
  },
  cyber_neon: {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    primary:      '#ff00ff',   // Hot Pink
    primaryDim:   'rgba(255, 0, 255, 0.25)',
    secondary:    '#00ffff',   // Electric Blue
    secondaryDim: 'rgba(0, 255, 255, 0.25)',
    accent:       '#fcee0a',   // Cyber Yellow
    accentDim:    'rgba(252, 238, 10, 0.2)',
    success:      '#00ff00',
    successGlow:  'rgba(0, 255, 0, 0.5)',
    danger:       '#ff003c',
    warning:      '#ff8a00',
    bg:           '#000000',
    bgCard:       'rgba(15, 0, 15, 0.85)',
    bgKeyTop:     'rgba(40, 0, 40, 0.6)',
    bgKeyBottom:  'rgba(10, 0, 10, 0.8)',
    textPrimary:  '#ffffff',
    textSecondary:'rgba(255, 255, 255, 0.8)',
    textMuted:    'rgba(255, 255, 255, 0.5)',
    textInverse:  '#000000',
    borderGlass:  'rgba(255, 0, 255, 0.15)',
    borderActive: 'rgba(0, 255, 255, 0.8)',
  },
  ocean_glass: {
    id: 'ocean_glass',
    name: 'Ocean Glass',
    primary:      '#00ff87',   // Sea Green
    primaryDim:   'rgba(0, 255, 135, 0.25)',
    secondary:    '#60efff',   // Aqua
    secondaryDim: 'rgba(96, 239, 255, 0.25)',
    accent:       '#0061ff',   // Deep Blue
    accentDim:    'rgba(0, 97, 255, 0.2)',
    success:      '#00ff87',
    successGlow:  'rgba(0, 255, 135, 0.5)',
    danger:       '#ff4b2b',
    warning:      '#f7b733',
    bg:           '#001020',
    bgCard:       'rgba(0, 20, 40, 0.85)',
    bgKeyTop:     'rgba(0, 40, 70, 0.6)',
    bgKeyBottom:  'rgba(0, 10, 25, 0.8)',
    textPrimary:  '#ffffff',
    textSecondary:'rgba(255, 255, 255, 0.8)',
    textMuted:    'rgba(255, 255, 255, 0.5)',
    textInverse:  '#001020',
    borderGlass:  'rgba(96, 239, 255, 0.12)',
    borderActive: 'rgba(0, 255, 135, 0.6)',
  }
};

export type ThemeColors = typeof THEMES.deep_space;

export const SHADOWS = {
  glow: (color: string, radius = 12, opacity = 0.8) => ({
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  }),
  glassBead: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  }
} as const;

export const RADII = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Shortcuts ────────────────────────────────────────
export interface Shortcut {
  id: string;
  label: string;
  text: string;
}

export type Shortcuts = Shortcut[];

export const DEFAULT_SHORTCUTS: Shortcuts = [
  { id: 's1', label: 'GM', text: 'Good morning' },
  { id: 's2', label: 'GN', text: 'Good night' },
  { id: 's3', label: 'TY', text: 'Thank you' },
  { id: 's4', label: 'PL', text: 'Please' },
  { id: 's5', label: 'SR', text: 'Sorry' },
  { id: 's6', label: 'IDK', text: "I don't know" },
];

// ─── Defaults ─────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  dwellTime: DEFAULT_DWELL_TIME,
  smoothing: SMOOTHING_FACTOR,
  sensitivity: SENSITIVITY,
  autoSpeak: true,
  hapticFeedback: true,
  showNumbers: false,
  showShortcuts: true,
  shortcuts: DEFAULT_SHORTCUTS as Shortcuts,
  theme: 'deep_space' as ThemeId,
  keyboardLanguage: 'english' as LanguageId,
  outputLanguage: 'english' as LanguageId,
};

export type AppSettings = typeof DEFAULT_SETTINGS;
