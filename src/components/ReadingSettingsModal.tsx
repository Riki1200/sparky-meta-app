import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ChildFontFamily, ChildFontSize } from '../styles/theme';
import { playChime } from '../services/ttsService';

interface ReadingSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  language: string;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  visible,
  onClose,
  language,
}) => {
  const {
    themeMode,
    theme,
    toggleTheme,
    setThemeMode,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    readingRuler,
    toggleReadingRuler,
    syllableMode,
    toggleSyllableMode,
    activeFontFamilyCss,
    fontScale,
  } = useTheme();

  const isEs = language === 'es';

  const fonts: { id: ChildFontFamily; name: string; tag: string; description: string; sample: string }[] = [
    {
      id: 'lexend',
      name: 'Lexend',
      tag: isEs ? '⭐ Recomendada para Fluidez' : '⭐ Fluency Recommended',
      description: isEs
        ? 'Diseñada por expertos para reducir la aglomeración de letras y acelerar la lectura.'
        : 'Scientifically designed to reduce visual crowding and increase reading speed.',
      sample: 'El oso come miel dulce',
    },
    {
      id: 'comic',
      name: 'Comic & Nunito',
      tag: isEs ? '🎈 Amigable e Infantil' : '🎈 Friendly & Rounded',
      description: isEs
        ? 'Letras redondeadas y cálidas similares a los libros infantiles y cartillas escolares.'
        : 'Warm, rounded letterforms similar to classic early children storybooks.',
      sample: 'La cometa vuela alto',
    },
    {
      id: 'dyslexic',
      name: 'Apoyo para Dislexia',
      tag: isEs ? '👓 Alto Contraste y Espaciado' : '👓 High Spacing & Contrast',
      description: isEs
        ? 'Mayor peso en la base de las letras para evitar que el niño confunda b/d o p/q.'
        : 'Weighted character stems and wide spacing to prevent letter confusion.',
      sample: 'Los barcos navegan rápido',
    },
    {
      id: 'system',
      name: isEs ? 'Estándar del Sistema' : 'System Default',
      tag: isEs ? '📱 Neutra' : '📱 Neutral',
      description: isEs ? 'Tipografía predeterminada del dispositivo.' : 'Standard device system typeface.',
      sample: 'Lectura clara y sencilla',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]}>
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="text" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {isEs ? 'Ajustes de Lectura y Accesibilidad' : 'Reading & Accessibility Settings'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {isEs ? 'Personaliza la fuente, tamaño y contraste para el niño' : 'Customize typography, contrast & size for child comfort'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
              onPress={() => {
                playChime('tap');
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Live Preview Box */}
            <View style={[styles.previewCard, { backgroundColor: theme.paperCardBg, borderColor: theme.borderActive }]}>
              <View style={styles.previewHeader}>
                <Text style={[styles.previewTag, { color: theme.primary }]}>
                  {isEs ? 'VISTA PREVIA EN VIVO' : 'LIVE READING PREVIEW'}
                </Text>
                <Text style={[styles.previewMeta, { color: theme.textMuted }]}>
                  {fontFamily.toUpperCase()} • {fontSize.toUpperCase()} • {themeMode.toUpperCase()}
                </Text>
              </View>
              <Text
                style={[
                  styles.previewText,
                  {
                    color: theme.text,
                    fontSize: fontScale.size,
                    lineHeight: fontScale.lineHeight,
                    letterSpacing: fontScale.letterSpacing,
                    ...(Platform.OS === 'web' ? { fontFamily: activeFontFamilyCss } : {}),
                  },
                ]}
              >
                {isEs
                  ? '✨ Sparky acompaña al niño palabra por palabra en su libro real.'
                  : '✨ Sparky patiently guides the child word by word in their physical book.'}
              </Text>
            </View>

            {/* Section 1: Dark / Light Mode */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {isEs ? '🌓 Tema Visual (Modo Día / Noche)' : '🌓 Visual Theme (Light / Dark Mode)'}
              </Text>
              <View style={styles.themeRow}>
                <TouchableOpacity
                  style={[
                    styles.themeOptionCard,
                    {
                      backgroundColor: themeMode === 'light' ? '#fff7ed' : theme.surfaceSecondary,
                      borderColor: themeMode === 'light' ? '#ea580c' : theme.border,
                    },
                  ]}
                  onPress={() => {
                    playChime('tap');
                    setThemeMode('light');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.themeEmoji}>☀️</Text>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeLabel, { color: themeMode === 'light' ? '#9a3412' : theme.text }]}>
                      {isEs ? 'Modo Claro (Día)' : 'Light Mode (Day)'}
                    </Text>
                    <Text style={[styles.themeSub, { color: theme.textSecondary }]}>
                      {isEs ? 'Fondo blanco cálido tipo papel escolar' : 'Warm paper white for daylight reading'}
                    </Text>
                  </View>
                  {themeMode === 'light' && (
                    <Ionicons name="checkmark-circle" size={22} color="#ea580c" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOptionCard,
                    {
                      backgroundColor: themeMode === 'dark' ? '#1e293b' : theme.surfaceSecondary,
                      borderColor: themeMode === 'dark' ? '#fb923c' : theme.border,
                    },
                  ]}
                  onPress={() => {
                    playChime('tap');
                    setThemeMode('dark');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.themeEmoji}>🌙</Text>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeLabel, { color: themeMode === 'dark' ? '#fed7aa' : theme.text }]}>
                      {isEs ? 'Modo Oscuro (Noche)' : 'Dark Mode (Night)'}
                    </Text>
                    <Text style={[styles.themeSub, { color: theme.textSecondary }]}>
                      {isEs ? 'Descanso visual y bajo brillo en la noche' : 'Prevents eye strain in dimmer rooms'}
                    </Text>
                  </View>
                  {themeMode === 'dark' && (
                    <Ionicons name="checkmark-circle" size={22} color="#fb923c" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Child Font Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {isEs ? '🔤 Tipografía Especializada para Niños' : '🔤 Child-Optimized Typography'}
              </Text>
              <View style={styles.fontsList}>
                {fonts.map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.fontCard,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.borderActive : theme.border,
                        },
                      ]}
                      onPress={() => {
                        playChime('tap');
                        setFontFamily(f.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.fontCardTop}>
                        <View style={styles.fontNameCol}>
                          <Text style={[styles.fontName, { color: theme.text }]}>{f.name}</Text>
                          <Text style={[styles.fontTag, { color: theme.primary }]}>{f.tag}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                        )}
                      </View>
                      <Text style={[styles.fontDesc, { color: theme.textSecondary }]}>{f.description}</Text>
                      <View style={[styles.fontSamplePill, { backgroundColor: theme.surface }]}>
                        <Text
                          style={[
                            styles.fontSampleText,
                            {
                              color: theme.text,
                              ...(Platform.OS === 'web'
                                ? { fontFamily: f.id === 'lexend' ? "'Lexend', sans-serif" : f.id === 'comic' ? "'Comic Neue', cursive" : "'Lexend', sans-serif" }
                                : {}),
                            },
                          ]}
                        >
                          "{f.sample}"
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Text Size */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {isEs ? '🔍 Tamaño de las Letras' : '🔍 Text Size'}
              </Text>
              <View style={styles.sizeRow}>
                {(['normal', 'large', 'extra'] as ChildFontSize[]).map((sz) => {
                  const isSelected = fontSize === sz;
                  const label = sz === 'normal' ? (isEs ? 'Normal (23px)' : 'Regular') : sz === 'large' ? (isEs ? 'Grande (28px)' : 'Large') : (isEs ? 'Gigante (34px)' : 'Extra Large');
                  return (
                    <TouchableOpacity
                      key={sz}
                      style={[
                        styles.sizeBtn,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.primaryDark : theme.border,
                        },
                      ]}
                      onPress={() => {
                        playChime('tap');
                        setFontSize(sz);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.sizeLetter,
                          {
                            color: isSelected ? '#ffffff' : theme.text,
                            fontSize: sz === 'normal' ? 16 : sz === 'large' ? 20 : 25,
                          },
                        ]}
                      >
                        A
                      </Text>
                      <Text
                        style={[
                          styles.sizeLabel,
                          { color: isSelected ? '#ffffff' : theme.textSecondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Visual Reading Aids */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {isEs ? '🛠️ Herramientas de Apoyo Visual' : '🛠️ Visual Reading Aids'}
              </Text>

              {/* Reading Ruler Toggle */}
              <TouchableOpacity
                style={[
                  styles.aidRow,
                  {
                    backgroundColor: readingRuler ? theme.primaryLight : theme.surfaceSecondary,
                    borderColor: readingRuler ? theme.borderActive : theme.border,
                  },
                ]}
                onPress={() => {
                  playChime('tap');
                  toggleReadingRuler();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.aidLeft}>
                  <Text style={styles.aidEmoji}>📏</Text>
                  <View style={styles.aidTexts}>
                    <Text style={[styles.aidTitle, { color: theme.text }]}>
                      {isEs ? 'Regla Visual de Enfoque' : 'Reading Focus Ruler'}
                    </Text>
                    <Text style={[styles.aidSub, { color: theme.textSecondary }]}>
                      {isEs
                        ? 'Resalta la palabra activa y atenúa el resto para evitar saltarse renglones'
                        : 'Highlights active word line to prevent skipping lines on real pages'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={readingRuler ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={readingRuler ? theme.primary : theme.textMuted}
                />
              </TouchableOpacity>

              {/* Syllable Mode Toggle */}
              <TouchableOpacity
                style={[
                  styles.aidRow,
                  {
                    backgroundColor: syllableMode ? theme.primaryLight : theme.surfaceSecondary,
                    borderColor: syllableMode ? theme.borderActive : theme.border,
                  },
                ]}
                onPress={() => {
                  playChime('tap');
                  toggleSyllableMode();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.aidLeft}>
                  <Text style={styles.aidEmoji}>🔤</Text>
                  <View style={styles.aidTexts}>
                    <Text style={[styles.aidTitle, { color: theme.text }]}>
                      {isEs ? 'Modo Silábico (Método Fonético)' : 'Syllable Mode (Phonics)'}
                    </Text>
                    <Text style={[styles.aidSub, { color: theme.textSecondary }]}>
                      {isEs
                        ? 'Separa palabras largas en sílabas (es•tre•lla) para facilitar el deletreo'
                        : 'Divides long words into clickable syllables (star•light) for easy blending'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={syllableMode ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={syllableMode ? theme.primary : theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                playChime('sparkle');
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-sharp" size={20} color="#ffffff" />
              <Text style={styles.saveBtnText}>
                {isEs ? 'Listo, Continuar Leyendo' : 'Done, Continue Reading'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewMeta: {
    fontSize: 10,
    fontWeight: '700',
  },
  previewText: {
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  themeEmoji: {
    fontSize: 24,
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  themeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  fontsList: {
    gap: 10,
  },
  fontCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  fontCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontNameCol: {
    gap: 2,
  },
  fontName: {
    fontSize: 16,
    fontWeight: '800',
  },
  fontTag: {
    fontSize: 11,
    fontWeight: '800',
  },
  fontDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  fontSamplePill: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  fontSampleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  sizeLetter: {
    fontWeight: '900',
  },
  sizeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  aidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  aidLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aidEmoji: {
    fontSize: 22,
  },
  aidTexts: {
    flex: 1,
  },
  aidTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  aidSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
