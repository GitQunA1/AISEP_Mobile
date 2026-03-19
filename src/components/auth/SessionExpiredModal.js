import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { AlertTriangle, LogIn, Home } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * SessionExpiredModal - A global modal that blocks the UI when the user's session ends.
 * It forces the user to log in again or go to the home page as a guest.
 */
export default function SessionExpiredModal({ visible, onLogin, onHome }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalBody}>
            <View style={[styles.iconWrapper, { backgroundColor: activeTheme.isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB' }]}>
              <AlertTriangle size={36} color="#F59E0B" />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Phiên Đăng Nhập Đã Hết Hạn</Text>
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              Phiên làm việc của bạn đã kết thúc để đảm bảo an toàn. Vui lòng đăng nhập lại để tiếp tục sử dụng các tính năng của AISEP.
            </Text>

            <View style={[styles.warningBox, { backgroundColor: activeTheme.isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2' }]}>
              <Text style={[styles.warningText, { color: '#EF4444' }]}>
                Tài khoản của bạn đã được đăng xuất khỏi thiết bị này.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]} 
              onPress={onLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Đăng nhập lại</Text>
              <LogIn size={18} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryBtn, { borderColor: colors.border }]} 
              onPress={onHome}
              activeOpacity={0.7}
            >
              <Home size={18} color={colors.text} style={{ marginRight: 8 }} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalBody: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
