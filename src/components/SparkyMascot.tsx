import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MascotMood, SupportedLanguage } from '../types';
import { playChime } from '../services/ttsService';
import { useTheme } from '../context/ThemeContext';

interface SparkyMascotProps {
  mood?: MascotMood;
  size?: 'small' | 'medium' | 'large';
  speechBubbleText?: string;
  onPress?: () => void;
  language?: SupportedLanguage;
}

const MOTIVATIONAL_MESSAGES: Record<SupportedLanguage, string[]> = {
  en: [
    "You're doing fantastic! Keep reading!",
    "Point at any word if you'd like me to say it!",
    "Take your time, I love listening to you!",
    "Great reader in action! Let's conquer the page!",
  ],
  es: [
    "¡Vas súper bien! ¡Sigue leyendo con ganas!",
    "¡Toca cualquier palabra si quieres que la pronuncie!",
    "Lee con calma, ¡me encanta escucharte!",
    "¡Eres un gran lector! ¡Vamos a terminar la página!",
  ],
  fr: [
    "Tu lis très bien ! Continue comme ça !",
    "Touche un mot si tu veux que je le prononce !",
    "Prends ton temps, j'adore t'écouter lire !",
    "Super lecteur en action ! On y va !",
  ],
  pt: [
    "Você está lendo super bem! Continue!",
    "Toque em qualquer palavra para ouvir o som!",
    "Vá no seu ritmo, adoro ouvir você!",
    "Você é um grande leitor! Vamos juntos!",
  ],
  de: [
    "Du machst das fantastisch! Weiter so!",
    "Tippe auf ein Wort, wenn ich es vorlesen soll!",
    "Lies ganz in Ruhe, ich höre dir gern zu!",
    "Toller Leser am Werk! Lass uns die Seite lesen!",
  ],
  it: [
    "Stai leggendo benissimo! Continua così!",
    "Tocca qualsiasi parola se vuoi ascoltarla!",
    "Fai con calma, adoro ascoltarti leggere!",
    "Un piccolo grande lettore! Andiamo!",
  ],
  nl: [
    "Je doet het geweldig! Blijf lekker lezen!",
    "Tik op een woord als je het wilt horen!",
    "Neem je tijd, ik luister met plezier!",
    "Wat een geweldige lezer! Zet 'm op!",
  ],
  pl: [
    "Idzie ci wspaniale! Czytaj dalej!",
    "Dotknij słowa, jeśli chcesz usłyszeć wymowę!",
    "Nie spiesz się, uwielbiam cię słuchać!",
    "Wspaniały czytelnik! Damy radę!",
  ],
  tr: [
    "Harika okuyorsun! Aynen böyle devam!",
    "Kelimeye dokunursan senin için okurum!",
    "Acele etme, seni dinlemeyi çok seviyorum!",
    "Harika bir okuyucu! Sayfayı bitirelim!",
  ],
};

export const SparkyMascot: React.FC<SparkyMascotProps> = ({
  mood = 'idle',
  size = 'medium',
  speechBubbleText,
  onPress,
  language = 'en',
}) => {
  const { theme, themeMode } = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle floating loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    return () => floatLoop.stop();
  }, []);

  useEffect(() => {
    if (mood === 'listening') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else if (mood === 'celebrating') {
      const celebrateLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      );
      celebrateLoop.start();
      return () => celebrateLoop.stop();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [mood]);

  const spin = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const getIcon = (): React.ComponentProps<typeof Ionicons>['name'] => {
    switch (mood) {
      case 'listening':
        return 'ear';
      case 'celebrating':
        return 'trophy';
      case 'thinking':
        return 'bulb';
      case 'encouraging':
        return 'heart';
      case 'idle':
      default:
        return 'book';
    }
  };

  const getBadgeColor = () => {
    switch (mood) {
      case 'listening':
        return '#f43f5e'; // vibrant coral
      case 'celebrating':
        return '#f59e0b'; // golden amber
      case 'thinking':
        return '#8b5cf6'; // violet
      case 'encouraging':
        return '#10b981'; // emerald
      case 'idle':
      default:
        return '#6366f1'; // indigo
    }
  };

  const sizeDimensions = {
    small: { container: 36, emoji: 18, glow: 44 },
    medium: { container: 52, emoji: 24, glow: 62 },
    large: { container: 72, emoji: 32, glow: 86 },
  }[size];

  const handleMascotTap = () => {
    playChime('sparkle');
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.25,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    }
  };

  const displayMessage =
    speechBubbleText ||
    MOTIVATIONAL_MESSAGES[language]?.[0] ||
    "Let's read together!";

  return (
    <View style={styles.outerContainer}>
      <Animated.View
        style={[
          styles.mascotWrapper,
          {
            transform: [
              { translateY: floatAnim },
              { scale: pulseAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleMascotTap}
          style={[
            styles.avatarCircle,
            {
              width: sizeDimensions.container,
              height: sizeDimensions.container,
              borderRadius: sizeDimensions.container / 2,
              backgroundColor: getBadgeColor(),
              borderColor: '#ffffff',
              shadowColor: getBadgeColor(),
            },
          ]}
        >
          {/* Glowing Aura Ring */}
          <View
            style={[
              styles.glowRing,
              {
                width: sizeDimensions.glow,
                height: sizeDimensions.glow,
                borderRadius: sizeDimensions.glow / 2,
                borderColor: getBadgeColor(),
              },
            ]}
          />
          <Ionicons name={getIcon()} size={sizeDimensions.emoji} color="#ffffff" />

          {/* Mini Spark Icon */}
          <View style={styles.sparkBadge}>
            <Ionicons name="sparkles" size={10} color={getBadgeColor()} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Optional Speech Bubble */}
      {speechBubbleText !== undefined && (
        <View style={[styles.bubbleCard, { backgroundColor: theme.surface, borderColor: theme.accentLight }]}>
          <View style={[styles.bubbleArrow, { backgroundColor: theme.surface, borderColor: theme.accentLight }]} />
          <Text style={[styles.bubbleText, { color: themeMode === 'dark' ? '#c7d2fe' : '#312e81' }]}>{displayMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.25,
  },
  sparkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  bubbleArrow: {
    position: 'absolute',
    left: -7,
    top: '40%',
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#e0e7ff',
    transform: [{ rotate: '45deg' }],
  },
  bubbleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312e81',
    lineHeight: 18,
  },
});
