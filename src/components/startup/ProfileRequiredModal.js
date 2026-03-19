import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { AlertCircle, Rocket, ArrowRight, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileRequiredModal({ visible, onRedirect, onDismiss }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          
          <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
            <Rocket size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Cập nhật Hồ sơ Startup</Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            Chào mừng bạn đến với AISEP! Để bắt đầu hành trình gọi vốn và tiếp cận nhà đầu tư, bạn cần hoàn thiện hồ sơ doanh nghiệp của mình.
          </Text>

          <View style={[styles.warningBox, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <AlertCircle size={20} color="#EF4444" style={styles.warningIcon} />
            <Text style={[styles.warningText, { color: '#991B1B' }]}>
              Bạn sẽ không thể <Text style={{ fontWeight: 'bold' }}>đăng dự án</Text> cho đến khi hồ sơ được tạo.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onRedirect}>
              <Text style={styles.primaryBtnText}>Bắt đầu tạo hồ sơ ngay</Text>
              <ArrowRight size={18} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Để sau (Bỏ qua)</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
  },
  warningIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
