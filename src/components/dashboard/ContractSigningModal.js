import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ActivityIndicator, Dimensions, Alert 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, Check, FileText, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import dealsService from '../../services/dealsService';

const { width, height } = Dimensions.get('window');

/**
 * ContractSigningModal - Modal for viewing and confirming investment contracts
 * Updated for New Flow: No physical signature, only digital confirmation
 */
export default function ContractSigningModal({ visible, deal, onClose, onShowSuccess }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [isLoading, setIsLoading] = useState(false);
  const [contractHtml, setContractHtml] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    if (visible && deal) {
      fetchContractPreview();
    } else {
      setContractHtml(null);
      setShowRejectInput(false);
      setRejectReason('');
    }
  }, [visible, deal]);

  const fetchContractPreview = async () => {
    setIsLoading(true);
    try {
      const response = await dealsService.getContractPreview(deal.dealId);
      if (response && response.data) {
        setContractHtml(response.data);
      } else if (typeof response === 'string') {
        setContractHtml(response);
      }
    } catch (error) {
      console.error('[ContractSigningModal] Load preview error:', error);
      Alert.alert('Lỗi', 'Không thể tải bản xem trước hợp đồng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // New Flow: Calling verifyDeal(id, true, '') instead of signContractStartup
      const response = await dealsService.verifyDeal(deal.dealId, true, '');

      if (response && (response.success || response.data)) {
        onShowSuccess('✓ Hợp đồng đã được xác nhận thành công!');
        onClose();
      } else {
        Alert.alert('Lỗi', response?.message || 'Không thể xác nhận hợp đồng');
      }
    } catch (error) {
      console.error('[ContractSigningModal] Confirmation error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xác nhận hợp đồng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do từ chối.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await dealsService.verifyDeal(deal.dealId, false, rejectReason);
      if (response && (response.success || response.data)) {
        onShowSuccess('✓ Thỏa thuận đã bị từ chối.');
        onClose();
      } else {
        Alert.alert('Lỗi', 'Không thể từ chối thỏa thuận.');
      }
    } catch (error) {
      console.error('[ContractSigningModal] Rejection error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi gửi yêu cầu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadySigned = deal?.statusStr === 'CONTRACT_SIGNED' || deal?.statusStr === 'MINTED_NFT' || deal?.status === 3 || deal?.status === 4;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Xác nhận thỏa thuận
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.previewContainer}>
            {isLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.secondaryText }}>Đang tải hợp đồng...</Text>
              </View>
            ) : (
              <>
                <View style={[styles.webviewWrapper, { borderColor: colors.border }]}>
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: contractHtml || '<html><body style="font-family: sans-serif; padding: 20px;"><h2>Bản thảo thỏa thuận đầu tư</h2><p>Đang chuẩn bị nội dung...</p></body></html>' }}
                    style={styles.webview}
                  />
                </View>

                {!isAlreadySigned && (
                  <View style={styles.footer}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.confirmBtn, { backgroundColor: colors.primary }]}
                      onPress={handleConfirm}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Check size={20} color="#fff" />
                          <Text style={styles.btnText}>Xác nhận & Chấp thuận</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn, { borderColor: colors.error }]}
                      onPress={() => {
                        Alert.prompt(
                          "Từ chối thỏa thuận",
                          "Vui lòng nhập lý do từ chối:",
                          [
                            { text: "Hủy", style: "cancel" },
                            { 
                              text: "Gửi", 
                              onPress: (reason) => {
                                setRejectReason(reason);
                                handleReject();
                              },
                              style: "destructive"
                            }
                          ]
                        );
                      }}
                      disabled={isSubmitting}
                    >
                      <X size={18} color={colors.error} />
                      <Text style={[styles.btnText, { color: colors.error }]}>Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isAlreadySigned && (
                  <View style={styles.signedStatus}>
                    <ShieldCheck size={20} color={colors.success} />
                    <Text style={[styles.signedText, { color: colors.success }]}>Thỏa thuận này đã được xác nhận</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewContainer: { flex: 1, padding: 20 },
  webviewWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  webview: { flex: 1 },
  footer: { gap: 12, marginBottom: 20 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 10,
  },
  confirmBtn: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  rejectBtn: { borderWidth: 1.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  signedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#10b98110',
    borderRadius: 12,
    marginBottom: 20,
  },
  signedText: { fontSize: 14, fontWeight: '700' },
});
