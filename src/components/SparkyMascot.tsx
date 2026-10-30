import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { MascotMood, SupportedLanguage } from '../types';
import { playChime } from '../services/ttsService';
import { useTheme } from '../context/ThemeContext';

// Sparky the reading owl, same mark as the app icon
const OWL_MARK = require('../../assets/brand/owl-mark.png');

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
  const { theme } = useTheme();
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

  const sizeDimensions = {
    small: { container: 40, owl: 30 },
    medium: { container: 52, owl: 40 },
    large: { container: 76, owl: 58 },
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
        style={{
          transform: [{ translateY: floatAnim }, { scale: pulseAnim }, { rotate: spin }],
        }}
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
              backgroundColor: theme.primary,
            },
          ]}
        >
          <Image source={OWL_MARK} style={{ width: sizeDimensions.owl, height: sizeDimensions.owl }} />
        </TouchableOpacity>
      </Animated.View>

      {speechBubbleText !== undefined && (
        <View style={[styles.bubbleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.bubbleText, { color: theme.text }]}>{displayMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleCard: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
