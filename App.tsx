/**
 * GazeTalk — AI-Powered Eye-Tracking Communication App
 * Main entry point. Orchestrates all components with Ultra Premium dynamic themes.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

// Components
import MediaPipeWebView from './src/components/MediaPipeWebView';
import OutputBar from './src/components/OutputBar';
import GazeKeyboard from './src/components/GazeKeyboard';
import GazeCursor from './src/components/GazeCursor';
import SuggestionBar from './src/components/SuggestionBar';
import SettingsPanel from './src/components/SettingsPanel';
import SplashLoader from './src/components/SplashLoader';
import DynamicBackground from './src/components/DynamicBackground';

// Hooks & Utils
import { useGazeTracking } from './src/hooks/useGazeTracking';
import { enhanceSentence, checkHealth } from './src/utils/api';
import { suggestNextWord } from './src/utils/suggestions';
import { DEFAULT_SETTINGS, AppSettings, THEMES, RADII, SPACING, LANGUAGES, LanguageId, TTS_PITCH, TTS_RATE } from './src/config';
import { useCameraPermissions } from 'expo-camera';

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const [permission, requestPermission] = useCameraPermissions();

  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceTrackingActive, setIsFaceTrackingActive] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const faceTrackingStarted = useRef(false);

  const gearRotation = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  const currentTheme = THEMES[settings.theme] || THEMES.deep_space;

  // ─── High-quality TTS with voice discovery ───────────
  const preferredVoice = useRef<Record<LanguageId, string | undefined>>({
    english: undefined, tamil: undefined, malayalam: undefined, kannada: undefined,
  });

  // Discover best available voices on startup
  useEffect(() => {
    (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        for (const lang of ['tamil', 'malayalam', 'kannada', 'english'] as LanguageId[]) {
          const locale = LANGUAGES[lang].ttsLocale;
          // Prefer Enhanced quality voice for this locale; fall back to any match
          const match = voices.find(v => v.language === locale && v.quality === 'Enhanced')
                    ?? voices.find(v => v.language === locale)
                    ?? voices.find(v => v.identifier.toLowerCase().includes(lang));
          if (match) preferredVoice.current[lang] = match.identifier;
        }
      } catch { /* voice discovery non-critical */ }
    })();
  }, []);

  const speakText = useCallback((text: string, lang: LanguageId) => {
    if (!text) return;
    // NFC normalisation ensures Tamil vowel signs are composed for better TTS
    const normalized = text.normalize('NFC');
    Speech.speak(normalized, {
      language: LANGUAGES[lang].ttsLocale,
      voice: preferredVoice.current[lang],
      rate: TTS_RATE[lang],
      pitch: TTS_PITCH[lang],
    });
  }, []);

  const { pan, blinkAnim, dwellProgress, hoveredKey, registerKeyLayout, clearKeyLayouts, handleGazeData } =
    useGazeTracking(settings.dwellTime);

  useEffect(() => {
    checkHealth().then(setIsConnected);
    const interval = setInterval(() => checkHealth().then(setIsConnected), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Clear stale key layouts + force remount on language switch.
  // Without clearKeyLayouts(), old English keys remain in the ref
  // and match before the new Indian-language keys at the same coordinates.
  // Without key={...} the control buttons wouldn't re-register.
  useEffect(() => {
    clearKeyLayouts();
  }, [settings.keyboardLanguage]);

  // Auditory/Haptic feedback on key hover
  useEffect(() => {
    if (hoveredKey && settings.hapticFeedback) {
      Haptics.selectionAsync().catch(() => {});
    }
  }, [hoveredKey, settings.hapticFeedback]);

  useEffect(() => {
    if (outputText.length > 0) {
      setSuggestions(suggestNextWord(outputText));
    } else {
      setSuggestions([]);
    }
  }, [outputText]);

  const handleSettingsPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(gearRotation, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(gearRotation, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    setShowSettings(true);
  }, []);

  const gearSpin = gearRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const handleKeyPress = useCallback((key: string) => {
    if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (key.startsWith('SUG_')) {
      const idx = parseInt(key.replace('SUG_', ''), 10);
      if (suggestions[idx]) {
        setOutputText((prev) => {
          const word = suggestions[idx].toUpperCase();
          if (prev.endsWith(' ')) {
            return prev + word + ' ';
          }
          const words = prev.trimEnd().split(' ');
          words[words.length - 1] = word;
          return words.join(' ') + ' ';
        });
        setSuggestions([]);
      }
      return;
    }

    if (key.startsWith('SHORTCUT_')) {
      const idx = parseInt(key.replace('SHORTCUT_', ''), 10);
      const sc = settings.shortcuts[idx];
      if (sc) {
        setOutputText((prev) => {
          const needsSpace = prev.length > 0 && !prev.endsWith(' ');
          return needsSpace ? prev + ' ' + sc.text + ' ' : prev + sc.text + ' ';
        });
      }
      return;
    }

    switch (key) {
      case 'SPACE': setOutputText((prev) => prev + ' '); break;
      case 'DEL': setOutputText((prev) => {
        if (prev.endsWith(' ')) {
          return prev.trimEnd().split(' ').slice(0, -1).join(' ') + ' ';
        }
        return prev.slice(0, -1);
      }); break;
      case 'CLEAR':
        setUndoStack((prev) => [outputText, ...prev.slice(0, 9)]);
        setOutputText(''); setSuggestions([]);
        break;
      case 'UNDO':
        setUndoStack((prev) => {
          if (prev.length === 0) return prev;
          const [restored, ...rest] = prev;
          setOutputText(restored);
          return rest;
        });
        break;
      case 'SPEAK': if (outputText.length > 0) {
        speakText(outputText, settings.outputLanguage);
      } break;
      case 'SEND': confirmSentence(); break;
      default: setOutputText((prev) => prev + key); break;
    }
  }, [outputText, suggestions, settings.hapticFeedback, settings.shortcuts, settings.outputLanguage]);

  const confirmSentence = async () => {
    if (outputText.length === 0) return;
    setIsLoading(true);
    const words = outputText.trim().split(/\s+/);
    try {
      const sentence = await enhanceSentence(words);
      setOutputText(sentence);
      if (settings.autoSpeak) {
        speakText(sentence, settings.outputLanguage);
      }
    } catch {
      const fallback = words.join(' ');
      const enhanced = fallback.charAt(0).toUpperCase() + fallback.slice(1) + '.';
      setOutputText(enhanced);
      if (settings.autoSpeak) {
        speakText(enhanced, settings.outputLanguage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onGazeData = useCallback((x: number, y: number, blink: boolean, faceDetected: boolean) => {
    if (!faceTrackingStarted.current) {
      faceTrackingStarted.current = true;
      setIsFaceTrackingActive(true);
    }
    setIsFaceDetected(faceDetected);
    if (faceDetected) {
      handleGazeData(x, y, blink, handleKeyPress);
    }
  }, [handleGazeData, handleKeyPress]);

  if (!fontsLoaded) return <SplashLoader />;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      <DynamicBackground theme={currentTheme} />

      {permission?.granted && (
        <MediaPipeWebView
          onGazeData={onGazeData}
          onReady={() => setIsFaceTrackingActive(true)}
          smoothing={settings.smoothing}
          sensitivity={settings.sensitivity}
        />
      )}

      <View style={styles.overlay} pointerEvents="box-none">
        <View>
          <OutputBar
            text={outputText}
            isLoading={isLoading}
            isFaceTrackingActive={isFaceTrackingActive}
            isFaceDetected={isFaceDetected}
            isConnected={isConnected}
            theme={currentTheme}
          />
          <TouchableOpacity activeOpacity={0.7} onPress={handleSettingsPress}>
            <Animated.View style={[styles.settingsFab, { transform: [{ scale: fabScale }], borderColor: currentTheme.borderGlass }]}>
              <Animated.View style={{ transform: [{ rotate: gearSpin }] }}>
                <Ionicons name="settings-outline" size={20} color={currentTheme.textSecondary} />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View>
          <SuggestionBar suggestions={suggestions} hoveredKey={hoveredKey} dwellProgress={dwellProgress} theme={currentTheme} onKeyLayout={registerKeyLayout} />
          <GazeKeyboard key={settings.keyboardLanguage} hoveredKey={hoveredKey} showNumbers={settings.showNumbers} showShortcuts={settings.showShortcuts} shortcuts={settings.shortcuts} dwellProgress={dwellProgress} theme={currentTheme} onKeyLayout={registerKeyLayout} language={settings.keyboardLanguage} />
        </View>
      </View>

      <GazeCursor pan={pan} blinkAnim={blinkAnim} dwellProgress={dwellProgress} hoveredKey={hoveredKey} theme={currentTheme} />

      <SettingsPanel visible={showSettings} settings={settings} theme={currentTheme} onClose={() => setShowSettings(false)} onUpdate={setSettings} />

      <StatusBar style="light" translucent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'space-between', padding: SPACING.lg, paddingTop: 55, ...StyleSheet.absoluteFillObject },
  settingsFab: { position: 'absolute', top: 10, right: 10, width: 40, height: 40, borderRadius: RADII.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
});
