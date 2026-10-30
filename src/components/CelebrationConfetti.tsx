import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface CelebrationConfettiProps {
  active: boolean;
  onAnimationEnd?: () => void;
}

const PARTICLE_COUNT = 36;
const COLORS = ['#f59e0b', '#ec4899', '#6366f1', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6'];
// Paper confetti pieces: circle, square and ribbon strip
const SHAPES = [
  { width: 10, height: 10, borderRadius: 5 },
  { width: 9, height: 9, borderRadius: 2 },
  { width: 6, height: 14, borderRadius: 2 },
];

export const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({
  active,
  onAnimationEnd,
}) => {
  const animatedValues = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      y: new Animated.Value(-50),
      x: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    // Reset particles
    animatedValues.forEach((p) => {
      p.y.setValue(-50);
      p.opacity.setValue(1);
    });

    const screenWidth = Dimensions.get('window').width || 400;

    const animations = animatedValues.map((p, idx) => {
      const startX = (idx / PARTICLE_COUNT) * screenWidth;
      const drift = (Math.random() - 0.5) * 120;
      const duration = 2200 + Math.random() * 800;
      const delay = Math.random() * 400;

      p.x.setValue(startX);

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.y, {
            toValue: 650,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: startX + drift,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotate, {
            toValue: Math.random() > 0.5 ? 4 : -4,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: duration,
            delay: duration * 0.7,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(30, animations).start(() => {
      if (onAnimationEnd) onAnimationEnd();
    });
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {animatedValues.map((p, idx) => {
        const shape = SHAPES[idx % SHAPES.length];
        const color = COLORS[idx % COLORS.length];
        const spin = p.rotate.interpolate({
          inputRange: [-4, 0, 4],
          outputRange: ['-360deg', '0deg', '360deg'],
        });

        return (
          <Animated.View
            key={idx}
            style={[
              styles.particle,
              {
                transform: [
                  { translateY: p.y },
                  { translateX: p.x },
                  { rotate: spin },
                ],
                opacity: p.opacity,
              },
            ]}
          >
            <View style={[shape, { backgroundColor: color, transform: [{ scale: 1 + (idx % 3) * 0.25 }] }]} />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
