import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import validationService from '../../services/validationService';

/**
 * DynamicInputField
 * A React Native TextInput wrapper that automatically handles validation rules
 * fetched from the backend, including character counts, required stars, and hints.
 */
const DynamicInputField = ({
  name,
  value,
  onChangeText,
  validationRule,
  currentStage,
  label,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  style,
  keyboardType = 'default',
  icon,
  colors = {
    text: '#1e293b',
    error: '#ef4444',
    secondaryText: '#64748b',
    inputBackground: '#ffffff',
    inputBorder: '#e2e8f0',
    primary: '#3b82f6',
  },
  error,
  ...props
}) => {
  const currentLength = value ? String(value).length : 0;
  const maxLength = validationRule?.maxLength;
  const minLength = validationRule?.minLength;
  const isOverLimit = maxLength && currentLength > maxLength;
  const isUnderLimit = minLength && currentLength > 0 && currentLength < minLength;

  // Determine dynamic required status
  let isRequired = validationRule?.required;
  if (currentStage !== null && currentStage !== undefined && validationRule?.stageOptionIds && validationRule.stageOptionIds.length > 0) {
    const stageId = Number(currentStage);
    const isStageInList = validationRule.stageOptionIds.some(id => Number(id) === stageId);
    isRequired = isStageInList ? validationRule.required : !validationRule.required;
  }

  const displayLabel = validationRule?.displayName || label || validationRule?.fieldKey || name;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          {displayLabel} {isRequired && <Text style={{ color: colors.error }}>*</Text>}
        </Text>
        
        {maxLength ? (
          <Text style={[
            styles.charCount,
            { color: colors.secondaryText, backgroundColor: colors.mutedBackground || (colors.text + '10') },
            isOverLimit && { color: colors.error, backgroundColor: colors.error + '15' }
          ]}>
            {currentLength}/{maxLength}
          </Text>
        ) : (
          currentLength > 0 && (
            <Text style={[
              styles.charCount,
              { color: colors.secondaryText, backgroundColor: colors.mutedBackground || (colors.text + '10') }
            ]}>
              {currentLength} ký tự
            </Text>
          )
        )}
      </View>

      <View style={[
        styles.inputWrapper,
        { 
          backgroundColor: colors.inputBackground, 
          borderColor: error ? colors.error : colors.inputBorder 
        },
        multiline && styles.textAreaWrapper,
        style
      ]}>
        {icon && (
          <View style={styles.iconWrapper}>
            {React.cloneElement(icon, { size: 18, color: colors.secondaryText })}
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            multiline && styles.textArea,
          ]}
          value={value}
          onChangeText={(text) => onChangeText(name, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          keyboardType={keyboardType}
          {...props}
        />
      </View>

      {isUnderLimit && !error && (
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={14} color="#f59e0b" />
          <Text style={styles.hintText}>Cần ít nhất {minLength} ký tự</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  requiredStar: {
    color: '#ef4444',
  },
  charCount: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  charCountError: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 52,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  iconWrapper: {
    paddingLeft: 12,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hintText: {
    color: '#f59e0b',
    fontSize: 12,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default DynamicInputField;
