/**
 * SettingsPanel — Modern bottom sheet with grouped sections,
 * live theme cards, stepper controls, and animated transitions.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Modal, ScrollView, Animated, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppSettings, DEFAULT_SETTINGS, RADII, SPACING, ThemeColors, THEMES, ThemeId, Shortcut, LANGUAGES, LanguageId } from '../config';

interface Props {
  visible: boolean;
  settings: AppSettings;
  theme: ThemeColors;
  onClose: () => void;
  onUpdate: (settings: AppSettings) => void;
}

function Section({ icon, label, color, children }: { icon: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Ionicons name={icon as any} size={14} color={color} />
        <Text style={[s.sectionTitle, { color }]}>{label}</Text>
      </View>
      <View style={s.sectionBody}>
        {children}
      </View>
    </View>
  );
}

function SettingRow({ icon, label, sub, color, children }: { icon: string; label: string; sub: string; color: string; children: React.ReactNode }) {
  return (
    <View style={s.row}>
      <View style={s.rowInfo}>
        <View style={s.rowLabelRow}>
          <Ionicons name={icon as any} size={14} color={color} style={{ marginRight: 6 }} />
          <Text style={[s.rowLabel, { color: 'rgba(255,255,255,0.9)' }]}>{label}</Text>
        </View>
        <Text style={[s.rowSub, { color: 'rgba(255,255,255,0.35)' }]}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

export default function SettingsPanel({ visible, settings, theme, onClose, onUpdate }: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut>({ id: '', label: '', text: '' });

  const addShortcut = () => {
    const newId = `s${Date.now()}`;
    setEditingShortcut({ id: newId, label: '', text: '' });
    setEditingIndex(-1);
    setEditorVisible(true);
  };

  const editShortcut = (idx: number) => {
    setEditingShortcut({ ...settings.shortcuts[idx] });
    setEditingIndex(idx);
    setEditorVisible(true);
  };

  const deleteShortcut = (idx: number) => {
    const updated = settings.shortcuts.filter((_, i) => i !== idx);
    onUpdate({ ...settings, shortcuts: updated });
  };

  const saveShortcut = (sc: Shortcut) => {
    let updated: Shortcut[];
    if (editingIndex < 0) {
      updated = [...settings.shortcuts, sc];
    } else {
      updated = settings.shortcuts.map((s, i) => i === editingIndex ? sc : s);
    }
    onUpdate({ ...settings, shortcuts: updated });
    setEditorVisible(false);
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const set = (key: keyof AppSettings, val: any) => onUpdate({ ...settings, [key]: val });

  const adjustValue = (key: keyof AppSettings, delta: number, min: number, max: number) => {
    let newVal = (settings[key] as number) + delta;
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;
    set(key, newVal);
  };

  const getValueColor = (val: number, min: number, max: number) => {
    const ratio = (val - min) / (max - min);
    if (ratio < 0.3) return THEMES.deep_space.success;
    if (ratio < 0.7) return THEMES.deep_space.accent;
    return THEMES.deep_space.warning;
  };

  const renderStepper = (
    label: string, sub: string, key: keyof AppSettings,
    step: number, min: number, max: number,
    format: (v: number) => string, icon: string,
  ) => {
    const val = settings[key] as number;
    const color = getValueColor(val, min, max);
    return (
      <SettingRow icon={icon} label={label} sub={sub} color={color}>
        <View style={s.stepper}>
          <TouchableOpacity
            style={[s.stepBtn, val <= min && s.stepBtnOff]}
            onPress={() => adjustValue(key, -step, min, max)}
          >
            <Ionicons name="remove" size={16} color={val <= min ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)'} />
          </TouchableOpacity>
          <Text style={[s.stepVal, { color }]}>{format(val)}</Text>
          <TouchableOpacity
            style={[s.stepBtn, val >= max && s.stepBtnOff]}
            onPress={() => adjustValue(key, step, min, max)}
          >
            <Ionicons name="add" size={16} color={val >= max ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)'} />
          </TouchableOpacity>
        </View>
      </SettingRow>
    );
  };

  const renderToggle = (label: string, sub: string, key: keyof AppSettings, icon: string) => (
    <SettingRow icon={icon} label={label} sub={sub} color={THEMES.deep_space.accent}>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(v) => set(key, v)}
        trackColor={{ true: THEMES.deep_space.accent, false: 'rgba(255,255,255,0.15)' }}
        thumbColor={settings[key] ? '#fff' : 'rgba(255,255,255,0.4)'}
      />
    </SettingRow>
  );

  const panelTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={s.backdrop}>
        <Animated.View style={[s.backdropTouch, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            s.panel,
            {
              backgroundColor: 'rgba(8, 8, 24, 0.96)',
              borderColor: 'rgba(255,255,255,0.06)',
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
        >
          <View style={s.handleWrap}>
            <View style={s.handle} />
          </View>

          <View style={s.header}>
            <View style={s.headerLeft}>
              <Ionicons name="settings-outline" size={20} color={theme.accent} />
              <Text style={[s.title, { color: theme.textPrimary }]}>Settings</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Theme Picker */}
            <Section icon="color-palette-outline" label="Theme" color={theme.secondary}>
              <View style={s.themeRow}>
                {(Object.values(THEMES)).map((t) => {
                  const isActive = settings.theme === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[s.themeCard, isActive && s.themeCardActive]}
                      onPress={() => set('theme', t.id)}
                    >
                      <LinearGradient
                        colors={[t.bg, t.bg]}
                        style={s.themePreview}
                      >
                        <View style={[s.themeDot, { backgroundColor: t.primary }]} />
                        <View style={[s.themeDot, { backgroundColor: t.secondary }]} />
                        <View style={[s.themeDotSmall, { backgroundColor: t.accent }]} />
                      </LinearGradient>
                      <Text style={[s.themeName, { color: isActive ? t.primary : 'rgba(255,255,255,0.5)' }]}>
                        {t.name}
                      </Text>
                      {isActive && <Ionicons name="checkmark-circle" size={16} color={t.primary} style={{ position: 'absolute', top: 4, right: 4 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Section>

            {/* Keyboard Layout */}
            <Section icon="keyboard-outline" label="Keyboard Layout" color={theme.secondary}>
              <View style={s.langGrid}>
                {(Object.values(LANGUAGES)).map((lang) => {
                  const isActive = settings.keyboardLanguage === lang.id;
                  return (
                    <TouchableOpacity
                      key={lang.id}
                      style={[s.langCard, isActive && { borderColor: theme.primary, backgroundColor: theme.primaryDim }]}
                      onPress={() => set('keyboardLanguage', lang.id)}
                    >
                      <Text style={[s.langLabel, { color: isActive ? theme.primary : theme.textMuted }]}>
                        {lang.nativeLabel}
                      </Text>
                      <Text style={[s.langSub, { color: isActive ? theme.textSecondary : theme.textMuted }]}>
                        {lang.label}
                      </Text>
                      {isActive && (
                        <View style={[s.langCheck, { backgroundColor: theme.primary }]}>
                          <Ionicons name="checkmark" size={10} color={theme.textInverse} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Section>

            {/* Output Language (TTS) */}
            <Section icon="volume-high-outline" label="Output Language (TTS)" color={theme.secondary}>
              <View style={s.langGrid}>
                {(Object.values(LANGUAGES)).map((lang) => {
                  const isActive = settings.outputLanguage === lang.id;
                  return (
                    <TouchableOpacity
                      key={lang.id}
                      style={[s.langCard, isActive && { borderColor: theme.success, backgroundColor: theme.successGlow }]}
                      onPress={() => set('outputLanguage', lang.id)}
                    >
                      <Text style={[s.langLabel, { color: isActive ? theme.success : theme.textMuted }]}>
                        {lang.nativeLabel}
                      </Text>
                      <Text style={[s.langSub, { color: isActive ? theme.textSecondary : theme.textMuted }]}>
                        {lang.label}
                      </Text>
                      {isActive && (
                        <View style={[s.langCheck, { backgroundColor: theme.success }]}>
                          <Ionicons name="checkmark" size={10} color={theme.textInverse} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ padding: 12, paddingTop: 0 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.35)', lineHeight: 14 }}>
                  Text-to-speech and translation target. Keyboard layout is set separately above.
                </Text>
              </View>
            </Section>

            {/* Eye Tracking */}
            <Section icon="eye-outline" label="Eye Tracking" color={theme.primary}>
              {renderStepper('Dwell Time', 'Hold duration to select', 'dwellTime', 100, 800, 3000, v => `${v}ms`, 'timer-outline')}
              <View style={s.div} />
              {renderStepper('Smoothing', 'Lower = smoother cursor', 'smoothing', 0.05, 0.1, 0.8, v => v.toFixed(2), 'water-outline')}
              <View style={s.div} />
              {renderStepper('Sensitivity', 'Head movement amplification', 'sensitivity', 0.1, 1.0, 4.0, v => v.toFixed(1), 'speedometer-outline')}
            </Section>

            {/* Feedback */}
            <Section icon="volume-high-outline" label="Feedback" color={theme.success}>
              {renderToggle('Auto-Speak', 'Read enhanced sentences aloud', 'autoSpeak', 'volume-high-outline')}
              <View style={s.div} />
              {renderToggle('Haptic Feedback', 'Vibrate on key selection', 'hapticFeedback', 'phone-portrait-outline')}
            </Section>

            {/* Display */}
            <Section icon="keypad-outline" label="Display" color={theme.warning}>
              {renderToggle('Show Number Row', 'Display number row above QWERTY', 'showNumbers', 'keypad-outline')}
              <View style={s.div} />
              {renderToggle('Show Shortcuts', 'Display shortcut phrase buttons', 'showShortcuts', 'flash-outline')}
            </Section>

            {/* Shortcuts */}
            <Section icon="flash-outline" label="Shortcuts" color={theme.warning}>
              {settings.shortcuts.map((sc, i) => (
                <View key={sc.id}>
                  {i > 0 && <View style={s.div} />}
                  <View style={s.shortcutRow}>
                    <TouchableOpacity
                      style={s.shortcutBadge}
                      onPress={() => editShortcut(i)}
                    >
                      <Text style={s.shortcutBadgeText}>{sc.label}</Text>
                    </TouchableOpacity>
                    <Text style={[s.shortcutPreview, { color: 'rgba(255,255,255,0.6)' }]} numberOfLines={1}>
                      {sc.text}
                    </Text>
                    <TouchableOpacity
                      style={s.shortcutDel}
                      onPress={() => deleteShortcut(i)}
                    >
                      <Ionicons name="close-circle" size={18} color="rgba(255,59,48,0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={s.addShortcutBtn} onPress={addShortcut}>
                <Ionicons name="add-circle-outline" size={14} color={theme.warning} />
                <Text style={[s.addShortcutText, { color: theme.warning }]}>Add Shortcut</Text>
              </TouchableOpacity>
            </Section>

            <ShortcutEditor
              visible={editorVisible}
              shortcut={editingShortcut}
              theme={theme}
              onSave={(updated) => saveShortcut(updated)}
              onClose={() => setEditorVisible(false)}
            />

            {/* Reset */}
            <TouchableOpacity style={s.resetBtn} onPress={() => onUpdate(DEFAULT_SETTINGS)}>
              <Ionicons name="refresh-outline" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={s.resetText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ShortcutEditor({ visible, shortcut, theme, onSave, onClose }: {
  visible: boolean;
  shortcut: Shortcut;
  theme: ThemeColors;
  onSave: (sc: Shortcut) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(shortcut.label);
  const [text, setText] = useState(shortcut.text);

  useEffect(() => {
    setLabel(shortcut.label);
    setText(shortcut.text);
  }, [shortcut]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={editor.backdrop}>
        <View style={[editor.card, { backgroundColor: 'rgba(12,12,35,0.98)', borderColor: theme.borderGlass }]}>
          <Text style={[editor.title, { color: theme.textPrimary }]}>Edit Shortcut</Text>

          <Text style={[editor.label, { color: theme.textSecondary }]}>Trigger Label</Text>
          <TextInput
            style={[editor.input, { color: theme.textPrimary, borderColor: theme.borderGlass, backgroundColor: theme.bgCard }]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. GM"
            placeholderTextColor="rgba(255,255,255,0.3)"
            maxLength={6}
            autoCapitalize="characters"
          />

          <Text style={[editor.label, { color: theme.textSecondary }]}>Phrase</Text>
          <TextInput
            style={[editor.input, { color: theme.textPrimary, borderColor: theme.borderGlass, backgroundColor: theme.bgCard, minHeight: 60 }]}
            value={text}
            onChangeText={setText}
            placeholder="e.g. Good morning"
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
          />

          <View style={editor.btnRow}>
            <TouchableOpacity style={[editor.btn, { backgroundColor: 'rgba(255,255,255,0.06)' }]} onPress={onClose}>
              <Text style={[editor.btnText, { color: 'rgba(255,255,255,0.6)' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[editor.btn, { backgroundColor: theme.warning }]}
              onPress={() => label.trim() && text.trim() && onSave({ ...shortcut, label: label.trim(), text: text.trim() })}
            >
              <Text style={[editor.btnText, { color: '#000', fontWeight: '700' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const editor = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '88%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBody: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  rowSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
    marginLeft: 20,
  },
  div: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 14,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  stepBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
  },
  stepBtnOff: {
    opacity: 0.3,
  },
  stepVal: {
    width: 54,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  shortcutBadge: {
    backgroundColor: 'rgba(255,149,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,149,0,0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  shortcutBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#ff9500',
    letterSpacing: 0.5,
  },
  shortcutPreview: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  shortcutDel: {
    padding: 4,
  },
  addShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    marginTop: 2,
  },
  addShortcutText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginTop: 4,
  },
  resetText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.4)',
  },
  themeRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  themeCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  themeCardActive: {
    borderColor: THEMES.deep_space.primary,
  },
  themePreview: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    flexDirection: 'row',
    gap: 4,
  },
  themeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  themeName: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  langCard: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
  },
  langLabel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  langSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
    textAlign: 'center',
    opacity: 0.7,
  },
  langCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
