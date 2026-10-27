import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupportedLanguage } from '../types';
import { getTranslation } from '../i18n/translations';

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

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialogCard}>
          <View style={styles.headerRow}>
            <View style={styles.shieldIconCircle}>
              <Ionicons name="shield-checkmark" size={28} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t.privacyModalTitle}</Text>
              <Text style={styles.subtitle}>{t.privacyModalSubtitle}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Principle 1 */}
            <View style={styles.principleItem}>
              <View style={[styles.bulletIcon, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="camera-outline" size={18} color="#059669" />
              </View>
              <View style={styles.principleTextCol}>
                <Text style={styles.principleTitle}>{t.localDataTitle}</Text>
                <Text style={styles.principleDesc}>{t.localDataDesc}</Text>
              </View>
            </View>

            {/* Principle 2 */}
            <View style={styles.principleItem}>
              <View style={[styles.bulletIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="mic-outline" size={18} color="#2563eb" />
              </View>
              <View style={styles.principleTextCol}>
                <Text style={styles.principleTitle}>{t.coppaTitle}</Text>
                <Text style={styles.principleDesc}>{t.coppaDesc}</Text>
              </View>
            </View>

            {/* Principle 3 */}
            <View style={styles.principleItem}>
              <View style={[styles.bulletIcon, { backgroundColor: '#fff7ed' }]}>
                <Ionicons name="sparkles-outline" size={18} color="#ea580c" />
              </View>
              <View style={styles.principleTextCol}>
                <Text style={styles.principleTitle}>{t.metaApiTitle}</Text>
                <Text style={styles.principleDesc}>{t.metaApiDesc}</Text>
              </View>
            </View>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
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
    borderBottomColor: '#f1f5f9',
  },
  shieldIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
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
    color: '#0f172a',
  },
  principleDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
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
