/**
 * SettingsPanel — Modern bottom sheet with theme picker,
 * grouped sections, pill drag handle, and blurred backdrop.
 */
import React from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppSettings, DEFAULT_SETTINGS, RADII, SPACING, ThemeColors, THEMES, ThemeId } from '../config';

interface Props {
  visible: boolean;
  settings: AppSettings;
  theme: ThemeColors;
  onClose: () => void;
  onUpdate: (settings: AppSettings) => void;
}

export default function SettingsPanel({ visible, settings, theme, onClose, onUpdate }: Props) {
  const set = (key: keyof AppSettings, val: any) => onUpdate({ ...settings, [key]: val });

  const adjustValue = (key: keyof AppSettings, delta: number, min: number, max: number) => {
    let newVal = (settings[key] as number) + delta;
    if (newVal < min) newVal = min;
    if (newVal > max) newVal = max;
    set(key, newVal);
  };

  const getValueColor = (val: number, min: number, max: number) => {
    const ratio = (val - min) / (max - min);
    if (ratio < 0.3) return theme.success;
    if (ratio < 0.7) return theme.accent;
    return theme.warning;
  };

  const renderStepper = (
    label: string, sub: string, key: keyof AppSettings,
    step: number, min: number, max: number,
    format: (v: number) => string, icon: string,
  ) => {
    const val = settings[key] as number;
    return (
      <View style={s.settingRow}>
        <View style={s.settingInfo}>
          <View style={s.labelRow}>
            <Ionicons name={icon as any} size={16} color={theme.accent} style={{ marginRight: 8 }} />
            <Text style={[s.label, { color: theme.textPrimary }]}>{label}</Text>
          </View>
          <Text style={[s.sub, { color: theme.textMuted }]}>{sub}</Text>
        </View>
        <View style={s.stepper}>
          <TouchableOpacity style={[s.stepBtn, val <= min && s.stepBtnOff]} onPress={() => adjustValue(key, -step, min, max)}>
            <Ionicons name="remove" size={18} color={val <= min ? theme.textMuted : theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.stepVal, { color: getValueColor(val, min, max) }]}>{format(val)}</Text>
          <TouchableOpacity style={[s.stepBtn, val >= max && s.stepBtnOff]} onPress={() => adjustValue(key, step, min, max)}>
            <Ionicons name="add" size={18} color={val >= max ? theme.textMuted : theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderToggle = (label: string, sub: string, key: keyof AppSettings, icon: string) => (
    <View style={s.settingRow}>
      <View style={s.settingInfo}>
        <View style={s.labelRow}>
          <Ionicons name={icon as any} size={16} color={theme.accent} style={{ marginRight: 8 }} />
          <Text style={[s.label, { color: theme.textPrimary }]}>{label}</Text>
        </View>
        <Text style={[s.sub, { color: theme.textMuted }]}>{sub}</Text>
      </View>
      <Switch value={settings[key] as boolean} onValueChange={(v) => set(key, v)}
        trackColor={{ true: theme.accent, false: 'rgba(255,255,255,0.1)' }}
        thumbColor={settings[key] ? theme.textPrimary : theme.textMuted} />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.backdrop}>
        <TouchableOpacity style={s.backdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={[s.panel, { backgroundColor: theme.bgCard, borderColor: theme.borderGlass }]}>
          <View style={s.handleWrap}><View style={s.handle} /></View>

          <View style={s.header}>
            <View style={s.headerLeft}>
              <Ionicons name="settings-outline" size={22} color={theme.accent} />
              <Text style={[s.title, { color: theme.textPrimary }]}>Settings</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Theme Picker */}
            <Text style={[s.secTitle, { color: theme.textMuted }]}>🎨  Theme</Text>
            <View style={[s.secCard, { borderColor: theme.borderGlass }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.themeScroll}>
                {(Object.values(THEMES)).map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      s.themeBtn,
                      { borderColor: settings.theme === t.id ? t.primary : t.borderGlass }
                    ]}
                    onPress={() => set('theme', t.id)}
                  >
                    <View style={s.themeColors}>
                      <View style={[s.themeColorDot, { backgroundColor: t.primary }]} />
                      <View style={[s.themeColorDot, { backgroundColor: t.secondary }]} />
                    </View>
                    <Text style={[
                      s.themeName,
                      { color: settings.theme === t.id ? t.primary : t.textMuted }
                    ]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[s.secTitle, { color: theme.textMuted }]}>👁️  Eye Tracking</Text>
            <View style={[s.secCard, { borderColor: theme.borderGlass }]}>
              {renderStepper('Dwell Time', 'Hold duration to select', 'dwellTime', 100, 800, 3000, v => `${v}ms`, 'timer-outline')}
              <View style={[s.div, { backgroundColor: theme.borderGlass }]} />
              {renderStepper('Smoothing', 'Lower = smoother cursor', 'smoothing', 0.05, 0.1, 0.8, v => v.toFixed(2), 'water-outline')}
              <View style={[s.div, { backgroundColor: theme.borderGlass }]} />
              {renderStepper('Sensitivity', 'Head movement amplification', 'sensitivity', 0.1, 1.0, 4.0, v => v.toFixed(1), 'speedometer-outline')}
            </View>

            <Text style={[s.secTitle, { color: theme.textMuted }]}>🔊  Feedback</Text>
            <View style={[s.secCard, { borderColor: theme.borderGlass }]}>
              {renderToggle('Auto-Speak', 'Read enhanced sentences aloud', 'autoSpeak', 'volume-high-outline')}
              <View style={[s.div, { backgroundColor: theme.borderGlass }]} />
              {renderToggle('Haptic Feedback', 'Vibrate on key selection', 'hapticFeedback', 'phone-portrait-outline')}
            </View>

            <Text style={[s.secTitle, { color: theme.textMuted }]}>⌨️  Display</Text>
            <View style={[s.secCard, { borderColor: theme.borderGlass }]}>
              {renderToggle('Show Numbers', 'Display number row', 'showNumbers', 'keypad-outline')}
            </View>

            <TouchableOpacity style={[s.resetBtn, { borderColor: theme.borderGlass }]} onPress={() => onUpdate(DEFAULT_SETTINGS)}>
              <Ionicons name="refresh-outline" size={16} color={theme.textMuted} />
              <Text style={[s.resetText, { color: theme.textMuted }]}>Reset to Defaults</Text>
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  backdropTouch: { flex: 1 },
  panel: {
    borderTopLeftRadius: RADII.xl, borderTopRightRadius: RADII.xl,
    paddingHorizontal: SPACING.xl, borderWidth: 1, borderBottomWidth: 0,
    maxHeight: '85%',
  },
  handleWrap: { alignItems: 'center', paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 8, borderRadius: RADII.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  secTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm, marginTop: SPACING.xl },
  secCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADII.md, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2 },
  settingInfo: { flex: 1, marginRight: SPACING.md },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2, marginLeft: 24 },
  div: { height: 1, marginLeft: SPACING.lg },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADII.sm, padding: 3, gap: 2 },
  stepBtn: { padding: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADII.xs },
  stepBtnOff: { opacity: 0.3 },
  stepVal: { width: 58, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 14 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: RADII.sm, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)' },
  resetText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  themeScroll: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  themeBtn: { padding: SPACING.sm, borderRadius: RADII.sm, borderWidth: 2, marginRight: SPACING.md, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  themeColors: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  themeColorDot: { width: 16, height: 16, borderRadius: 8 },
  themeName: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
