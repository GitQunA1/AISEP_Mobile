import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Easing } from 'react-native';

export default function TabIcon({ Icon, color, size, label, focused }) {
  // Independent animations for opacity and translate
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    if (focused) {
      // Label fade in and slide up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Return to normal
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      Animated.timing(translateY, {
        toValue: 4,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [focused]);

  return (
    <Animated.View style={styles.container}>
      <Icon size={size} color={color} />
      <Animated.Text 
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.label, 
          { 
            color, 
            opacity, 
            transform: [{ translateY }] 
          }
        ]}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
