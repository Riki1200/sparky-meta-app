import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupportedLanguage } from '../types';
import { getTranslation } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import {
  getCloudVisionConsent,
  getCloudVoiceConsent,
  setCloudVisionConsent,
  setCloudVoiceConsent,
} from '../services/storageService';
import { playChime } from '../services/ttsService';

interface PrivacyBadgeModalProps {
  visible: boolean;
  onClose: () => void;
  language: SupportedLanguage;
}

export const PrivacyBadgeModal: React.FC<PrivacyBadgeModalProps> = ({
  visible,
  onClose,
  language,
}) => {
  const t = getTranslation(language);
  const { theme, themeMode } = useTheme();
  const [cloudVoiceAllowed, setCloudVoiceAllowed] = useState(false);
  const [cloudVisionAllowed, setCloudVisionAllowed] = useState(false);

  useEffect(() => {
    if (visible) {
      getCloudVoiceConsent().then(setCloudVoiceAllowed);
      getCloudVisionConsent().then(setCloudVisionAllowed);
    }
  }, [visible]);

  const isDark = themeMode === 'dark';
  const principles: {
    key: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    tint: string;
    bg: string;
    title: string;
    desc: string;
  }[] = [
    {
      key: 'ocr',
      icon: 'camera-outline',
      tint: theme.badges.kpiAccuracyText,
      bg: theme.badges.kpiAccuracyBg,
      title: t.localDataTitle,
      desc: t.localDataDesc,
    },
    {
      key: 'speech',
      icon: 'mic-outline',
      tint: theme.badges.kpiSpeedText,
      bg: theme.badges.kpiSpeedBg,
      title: t.coppaTitle,
      desc: t.coppaDesc,
    },
    {
      key: 'meta',
      icon: 'sparkles-outline',
      tint: theme.badges.kpiStreakText,
      bg: theme.badges.kpiStreakBg,
      title: t.metaApiTitle,
      desc: t.metaApiDesc,
    },
  ];

  const renderConsent = (consent: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    desc: string;
    allowed: boolean;
    onChange: (allowed: boolean) => void;
  }) => (
    <View
      style={[
        styles.consentCard,
        {
          backgroundColor: consent.allowed ? theme.accentLight : theme.surfaceSecondary,
          borderColor: consent.allowed ? theme.accent : theme.border,
        },
      ]}
    >
      <View style={styles.consentHeader}>
        <View style={[styles.bulletIcon, { backgroundColor: theme.surface }]}>
          <Ionicons name={consent.icon} size={18} color={theme.accent} />
        </View>
        <View style={styles.principleTextCol}>
          <Text style={[styles.principleTitle, { color: theme.text }]}>{consent.title}</Text>
          <Text style={[styles.consentState, { color: consent.allowed ? theme.accent : theme.textMuted }]}>
            {consent.allowed ? t.cloudVoiceOn : t.cloudVoiceOff}
          </Text>
        </View>
        <Switch
          value={consent.allowed}
          onValueChange={(allowed) => {
            playChime('tap');
            consent.onChange(allowed);
          }}
          trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: theme.accent }}
          thumbColor="#ffffff"
          accessibilityLabel={consent.title}
        />
      </View>
      <Text style={[styles.principleDesc, { color: theme.textSecondary }]}>{consent.desc}</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]}>
        <View style={[styles.dialogCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.headerRow, { borderBottomColor: theme.borderLight }]}>
            <View style={[styles.shieldIconCircle, { backgroundColor: theme.badges.kpiAccuracyBg }]}>
              <Ionicons name="shield-checkmark" size={26} color={theme.badges.kpiAccuracyText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>{t.privacyModalTitle}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t.privacyModalSubtitle}</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
              onPress={onClose}
              accessibilityLabel={t.gotItBtn}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {principles.map((item) => (
              <View key={item.key} style={styles.principleItem}>
                <View style={[styles.bulletIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.tint} />
                </View>
                <View style={styles.principleTextCol}>
                  <Text style={[styles.principleTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.principleDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                </View>
              </View>
            ))}

            {/* Parent controls: optional Meta cloud features, each off by default */}
            {renderConsent({
              icon: 'cloud-upload-outline',
              title: t.cloudVoiceTitle,
              desc: t.cloudVoiceDesc,
              allowed: cloudVoiceAllowed,
              onChange: (allowed) => {
                setCloudVoiceAllowed(allowed);
                setCloudVoiceConsent(allowed);
              },
            })}
            {renderConsent({
              icon: 'scan-outline',
              title: t.cloudVisionTitle,
              desc: t.cloudVisionDesc,
              allowed: cloudVisionAllowed,
              onChange: (allowed) => {
                setCloudVisionAllowed(allowed);
                setCloudVisionConsent(allowed);
              },
            })}
          </ScrollView>

          <TouchableOpacity style={styles.gotItButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.gotItText}>{t.gotItBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    borderRadius: 20,
    borderWidth: 1,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
  },
  shieldIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 20,
    gap: 16,
  },
  principleItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bulletIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  principleTextCol: {
    flex: 1,
    gap: 3,
  },
  principleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  principleDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  consentCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consentState: {
    fontSize: 12,
    fontWeight: '800',
  },
  gotItButton: {
    backgroundColor: '#059669',
    margin: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  gotItText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
