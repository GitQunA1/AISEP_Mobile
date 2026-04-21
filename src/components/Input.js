import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import THEME from '../constants/Theme';

const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  error, 
  keyboardType,
  autoCapitalize = 'none',
  style,
  inputStyle
}) => {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.inputBackground || colors.secondaryBackground || colors.background, 
            color: colors.text, 
            borderColor: error ? colors.error : colors.border 
          },
          inputStyle
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: THEME.spacing.xs,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: THEME.spacing.xs,
  },
});

export default Input;
