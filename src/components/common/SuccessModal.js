import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { CheckCircle, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SuccessModal({ visible, onClose, title = 'Thành công!', message = 'Thông tin đã được lưu thành công.', primaryBtnText = 'Xong', secondaryBtnText, onSecondaryClick }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.iconWrapper}>
            <CheckCircle size={64} color="#10B981" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          
          {typeof message === 'string' ? (
            <Text style={[styles.description, { color: colors.secondaryText }]}>{message}</Text>
          ) : (
            <View style={styles.messageView}>{message}</View>
          )}

          <View style={styles.buttonGroup}>
            {secondaryBtnText && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondaryClick || onClose}>
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{secondaryBtnText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={styles.primaryBtnText}>{primaryBtnText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconWrapper: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  messageView: {
    marginBottom: 24,
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#F1F5F9', // light gray
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
