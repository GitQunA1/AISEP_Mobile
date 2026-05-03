import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import RenderHtml from 'react-native-render-html';
import THEME from '../../constants/Theme';

export default function TermsModal({ visible, onClose, termsContent, termsVersion, error, isLoading }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const { width } = useWindowDimensions();

  // Basic styling for the HTML content
  const tagsStyles = {
    body: { color: colors.text, fontSize: 14, lineHeight: 22, fontFamily: 'System' },
    h1: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    h2: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    h3: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
    p: { marginBottom: 12 },
    ul: { paddingLeft: 20, marginBottom: 12 },
    li: { marginBottom: 6 },
    strong: { fontWeight: 'bold', color: colors.text },
    a: { color: colors.primary, textDecorationLine: 'none' }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.modalContent, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleContainer}>
              <ShieldCheck size={24} color={colors.primary} />
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Điều khoản sử dụng</Text>
                {termsVersion && (
                  <View style={[styles.versionBadge, { backgroundColor: colors.mutedBackground }]}>
                    <Text style={[styles.versionText, { color: colors.secondaryText }]}>Phiên bản {termsVersion}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.mutedBackground }]}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải điều khoản...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <AlertCircle size={48} color={colors.error} style={{ marginBottom: 16 }} />
                <Text style={[styles.errorTitle, { color: colors.text }]}>Không thể tải nội dung</Text>
                <Text style={[styles.errorText, { color: colors.secondaryText }]}>
                  Vui lòng kiểm tra kết nối mạng và thử lại sau.
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                {termsContent ? (
                  <RenderHtml
                    contentWidth={width - 48}
                    source={{ html: termsContent }}
                    tagsStyles={tagsStyles}
                  />
                ) : (
                  <Text style={{ color: colors.text }}>Không có nội dung điều khoản.</Text>
                )}
              </ScrollView>
            )}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.acceptButtonText}>Đã hiểu & Đóng</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  versionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  acceptButton: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
