import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  style, 
  textStyle 
}) => {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const radius = activeTheme.radius;
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  
  const buttonStyles = StyleSheet.create({
    base: {
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    primary: {
      backgroundColor: colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    secondary: {
      backgroundColor: colors.secondaryBackground,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    disabled: {
      opacity: 0.5,
    },
    text: {
      fontWeight: '700',
      fontSize: 16,
    },
    primaryText: {
      color: '#fff',
    },
    outlineText: {
      color: colors.primary,
    },
    ghostText: {
      color: colors.text,
    },
    secondaryText: {
      color: colors.text,
    },
    mdText: {
      fontSize: 16,
    },
    smText: {
      fontSize: 14,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        buttonStyles.base,
        buttonStyles[variant],
        buttonStyles[size],
        disabled && buttonStyles.disabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? colors.primary : '#fff'} />
      ) : (
        <Text style={[
          buttonStyles.text,
          buttonStyles[`${variant}Text`],
          buttonStyles[`${size}Text`],
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
