import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BookPage, ImageRef, SupportedLanguage } from '../types';
import { toImageSource } from '../services/imageService';

// Bundled photo of an open printed book for the 1-click scan demo
const SAMPLE_BOOK_PHOTO = require('../../assets/stories/book-photo.jpg');
import { recognizePageText, createBookPageFromCapture } from '../services/ocrService';
import { playChime } from '../services/ttsService';
import { getTranslation } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, DISPLAY_FONT } from '../styles/theme';

interface CameraCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onPageCreated: (page: BookPage) => void;
  language: SupportedLanguage;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  visible,
  onClose,
  onPageCreated,
  language,
}) => {
  const t = getTranslation(language);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [capturedImageUri, setCapturedImageUri] = useState<ImageRef | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sample physical book photos for quick demonstration
  const samplePhotoMap: Record<SupportedLanguage, { title: string; sampleText: string; uri: ImageRef }[]> = {
    en: [
      {
        title: 'Nature Reading',
        sampleText: 'A tiny hummingbird fluttered its colorful wings near the tall green trees. The morning breeze was fresh and gentle. With joyful courage, it found the sweetest flower.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Evening Reading',
        sampleText: 'Deep in the enchanted forest, the ancient oak tree whispered secrets to the stars. The silver moon shone brightly through the peaceful branches.',
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
    es: [
      {
        title: 'Lectura Dominicana',
        sampleText: 'El gallito despertó antes de la madrugada. Subió a la cerca de madera y cantó con alegría. Sus plumas doradas brillaban con el resplandor del sol.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Fábulas',
        sampleText: 'La pequeña tortuga nadaba feliz en las aguas tibias de Samaná. Observaba las gigantescas ballenas jorobadas saltar sobre las olas azules con gran emoción.',
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
    fr: [
      {
        title: 'Lecture Nature',
        sampleText: 'Un petit colibri agitait ses ailes colorées près des grands arbres verts. La brise du matin était douce et fraîche. Avec un courage joyeux, il trouva la plus douce des fleurs.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Contes Illustrés',
        sampleText: "Au fond de la forêt enchantée, le grand chêne chuchotait des secrets aux étoiles. La lune d'argent brillait paisiblement.",
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
    pt: [
      {
        title: 'Leitura da Natureza',
        sampleText: 'Um pequeno beija-flor bateu suas asas coloridas perto das árvores verdes. A brisa da manhã era suave e fresca. Com muita coragem e alegria, ele encontrou a flor mais doce.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Aventuras Ilustradas',
        sampleText: 'Lucas caminhava pela praia ao pôr do sol. O farol dourado brilhava com uma luz amarela e quente sobre as ondas do oceano.',
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
    de: [
      {
        title: 'Deutsches Lesebuch',
        sampleText: 'Ein winziger Kolibri flatterte mit bunten Flügeln zwischen den grünen Bäumen. Die Morgenluft war frisch und friedlich. Mit frohem Mut fand er die süßeste Blume.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Abenteuer am Meer',
        sampleText: 'Lukas spazierte am felsigen Ufer im goldenen Licht der Abendsonne. Der Leuchtturm strahlte ein warmes gelbes Licht über die sanften Meereswellen.',
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
    it: [
      {
        title: 'Libro di Lettura',
        sampleText: 'Un piccolo colibrì sbatteva le ali colorate vicino ai grandi alberi verdi. La brezza del mattino era fresca e dolce. Con gioioso coraggio, trovò il fiore più profumato.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Avventure sul Mare',
        sampleText: 'Matteo camminava lungo la riva rocciosa al tramonto. Il vecchio faro emanava una luce calda e dorata sopra le onde calme del mare.',
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
    nl: [
      {
        title: 'Nederlands Leesboek',
        sampleText: 'Een piepkleine kolibrie fladderde met kleurrijke vleugels tussen de hoge groene bomen. De ochtendbries was heerlijk fris en zacht. Met een vrolijk hart vond het vogeltje de zoetste bloem.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Klassieke Zeeavonturen',
        sampleText: 'Daan wandelde over het schelpenstrand tijdens de zonsondergang. De gouden vuurtoren scheen een warm geel licht over de golven van de zee.',
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
    pl: [
      {
        title: 'Czytanka Przyrodnicza',
        sampleText: 'Malutki koliber trzepotał barwnymi skrzydełkami wśród wysokich zielonych drzew. Poranny wietrzyk był świeży i delikatny. Z radosną odwagą ptaszek odnalazł najsłodszy kwiat.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Morskie Opowieści',
        sampleText: 'Jaś spacerował wzdłuż kamienistego brzegu o zachodzie słońca. Złota latarnia morska rzucała ciepłe żółte światło na błękitne fale oceanu.',
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
    tr: [
      {
        title: 'Doğa Okuması',
        sampleText: 'Minik bir sinek kuşu yeşil ağaçların arasında rengarenk kanatlarını neşeyle çırptı. Sabah rüzgarı tatlı ve serindi. Cesur minik kuş bahçedeki en tatlı çiçeği buldu.',
        uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&auto=format&fit=crop&q=80',
      },
      {
        title: 'Okyanus Maceraları',
        sampleText: 'Emre gün batımında taşlı kumsalda yürüyordu. Altın renkli deniz feneri dalgaların üzerine sıcacık sarı bir ışık saçıyordu.',
        uri: SAMPLE_BOOK_PHOTO,
      },
    ],
  };

  const SAMPLE_BOOK_PHOTOS = samplePhotoMap[language] || samplePhotoMap.en;

  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      startWebCamera();
    } else {
      stopWebCamera();
    }
    return () => {
      stopWebCamera();
    };
  }, [visible]);

  const startWebCamera = async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera access denied or unavailable:', err);
        setCameraActive(false);
      }
    }
  };

  const stopWebCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCaptureVideoFrame = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 800;
      canvas.height = videoRef.current.videoHeight || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImageUri(dataUrl);
        stopWebCamera();
        processImageOCR(dataUrl);
      }
    } catch (e) {
      console.warn('Frame capture error:', e);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setCapturedImageUri(uri);
        stopWebCamera();
        processImageOCR(uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleUseSamplePhoto = (sample: (typeof SAMPLE_BOOK_PHOTOS)[0]) => {
    setCapturedImageUri(sample.uri);
    stopWebCamera();
    // Simulate instant clean OCR
    setIsProcessing(true);
    setProgressStatus(t.ocrProcessing);
    setTimeout(() => {
      setProgressStatus(t.ocrProcessing);
      setTimeout(() => {
        setIsProcessing(false);
        playChime('complete');
        const page = createBookPageFromCapture(sample.sampleText, sample.uri, language);
        onPageCreated(page);
        onClose();
      }, 700);
    }, 500);
  };

  const processImageOCR = async (imageUri: string) => {
    setIsProcessing(true);
    setProgressStatus(t.ocrProcessing);
    try {
      const ocrResult = await recognizePageText(imageUri, language, (_p, status) => {
        setProgressStatus(status);
      });

      playChime('complete');
      const page = createBookPageFromCapture(ocrResult.text, imageUri, language);
      setIsProcessing(false);
      onPageCreated(page);
      onClose();
    } catch (err) {
      console.error('OCR failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerTextCol}>
            <Text style={styles.modalTitle}>{t.cameraTitle}</Text>
            <Text style={styles.modalSubtitle}>{t.cameraSubtitle}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {/* Privacy Banner */}
          <View style={styles.privacyBanner}>
            <Ionicons name="lock-closed" size={18} color={theme.badges.kpiAccuracyText} />
            <Text style={styles.privacyBannerText}>{t.privacyGuarantee}</Text>
          </View>

          {/* Camera Viewfinder */}
          <View style={styles.viewfinderContainer}>
            {Platform.OS === 'web' && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 320,
                  backgroundColor: '#1D1B22', // camera viewfinder stays dark in both themes
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current && !el.srcObject) {
                      el.srcObject = streamRef.current;
                      el.play().catch(() => { });
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Focus target overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12%',
                    left: '8%',
                    right: '8%',
                    bottom: '12%',
                    border: '2px dashed #f59e0b',
                    borderRadius: '12px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: theme.surfaceSecondary,
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 600,
                    }}
                  >
                    {t.cameraAlignHint}
                  </span>
                </div>
              </div>
            )}

            {/* Shutter & File Buttons */}
            <View style={styles.cameraControlsRow}>
              <TouchableOpacity
                style={styles.captureShutterButton}
                onPress={handleCaptureVideoFrame}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <View style={styles.shutterInner} />
                <Text style={styles.shutterText}>{t.takePhotoBtn}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handlePickImage}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={20} color={theme.text} />
                <Text style={styles.galleryButtonText}>{t.uploadPhotoBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Demo Book Samples */}
          <View style={styles.sampleSection}>
            <Text style={styles.sampleSectionTitle}>
              {t.cameraSampleSectionTitle}
            </Text>
            <View style={styles.sampleCardsRow}>
              {SAMPLE_BOOK_PHOTOS.map((sample, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sampleCard}
                  onPress={() => handleUseSamplePhoto(sample)}
                  activeOpacity={0.7}
                  disabled={isProcessing}
                >
                  <Image source={toImageSource(sample.uri)} style={styles.sampleImage} />
                  <View style={styles.sampleCardContent}>
                    <Text style={styles.sampleCardTitle}>{sample.title}</Text>
                    <Text style={styles.sampleCardSnippet} numberOfLines={2}>
                      "{sample.sampleText}"
                    </Text>
                    <View style={styles.sampleBadge}>
                      <Text style={styles.sampleBadgeText}>
                        {t.cameraSample1Click}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.processingTitle}>
                {t.cameraProcessingTitle}
              </Text>
              <Text style={styles.processingSubtitle}>{progressStatus}</Text>
              <View style={styles.processingTip}>
                <Ionicons name="sparkles" size={16} color={theme.badges.starBadgeText} />
                <Text style={styles.processingTipText}>
                  {t.cameraProcessingTip}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

// Styles read storybook theme tokens, so light and night mode share one definition
const createStyles = (theme: ThemeColors) => {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaceSecondary,
  },
  headerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    ...DISPLAY_FONT,
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.badges.kpiAccuracyBg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.words.correctBorder,
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 12,
    color: theme.text,
    fontWeight: '500',
    lineHeight: 17,
  },
  viewfinderContainer: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cameraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  captureShutterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shutterInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.surface,
  },
  shutterText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.surfaceSecondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.border,
  },
  galleryButtonText: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 14,
  },
  sampleSection: {
    marginTop: 8,
  },
  sampleSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 10,
  },
  sampleCardsRow: {
    gap: 12,
  },
  sampleCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sampleImage: {
    width: 100,
    height: 100,
    backgroundColor: theme.border,
  },
  sampleCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  sampleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  sampleCardSnippet: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  sampleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 6,
  },
  sampleBadgeText: {
    color: theme.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  processingCard: {
    backgroundColor: theme.surface,
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    gap: 12,
  },
  processingTitle: {
    ...DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  processingTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  processingTipText: {
    fontSize: 11,
    color: theme.text,
    fontWeight: '600',
    flex: 1,
  },
});
};
