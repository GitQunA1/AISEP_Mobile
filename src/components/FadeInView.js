import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function FadeInView({ children, delay = 0, duration = 500, style }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: duration,
        delay: delay,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, translateY, delay, duration]);

  return (
    <Animated.View
      style={{
        ...style,
        opacity: fadeAnim,
        transform: [{ translateY: translateY }],
      }}>
      {children}
    </Animated.View>
  );
}
