import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ActivityIndicator, ScrollView, Dimensions, Alert 
} from 'react-native';
import { WebView } from 'react-native-webview';
import SignatureCanvas from 'react-native-signature-canvas';
import { X, Check, RotateCcw, FileText, ChevronRight, PenTool } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import dealsService from '../../services/dealsService';

const { width, height } = Dimensions.get('window');

/**
 * ContractSigningModal - Modal for viewing and signing investment contracts
 * Features: HTML Preview, E-Signature Pad, Submission
 */
export default function ContractSigningModal({ visible, deal, onClose, onShowSuccess }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [step, setStep] = useState(1); // 1: Preview, 2: Sign
  const [isLoading, setIsLoading] = useState(false);
  const [contractHtml, setContractHtml] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  
  const signatureRef = useRef();

  useEffect(() => {
    if (visible && deal) {
      fetchContractPreview();
    } else {
      // Reset state when closing
      setStep(1);
      setContractHtml(null);
      setIsSignatureEmpty(true);
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

  const handleOK = (signature) => {
    // Signature is base64 string
    submitSignature(signature);
  };

  const submitSignature = async (signatureBase64) => {
    setIsSubmitting(true);
    try {
      // For mobile, we strip the prefix if it exists in the data returned by signature-canvas
      const cleanBase64 = signatureBase64.replace('data:image/png;base64,', '');
      
      const response = await dealsService.signContractStartup(deal.dealId, {
        signatureBase64: cleanBase64
      });

      if (response && (response.success || response.data)) {
        onShowSuccess('✓ Hợp đồng đã được ký kết thành công!');
        onClose();
      } else {
        Alert.alert('Lỗi', response?.message || 'Không thể ký hợp đồng');
      }
    } catch (error) {
      console.error('[ContractSigningModal] Submission error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi gửi chữ ký.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    signatureRef.current.clearSignature();
    setIsSignatureEmpty(true);
  };

  const handleEnd = () => {
    setIsSignatureEmpty(false);
  };

  const isAlreadySigned = deal?.status === 'Contract_Signed' || deal?.status === 3 || deal?.status === 'Minted_NFT' || deal?.status === 4;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {step === 1 ? 'Xem hợp đồng' : 'Ký tên xác nhận'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 1 ? (
            /* Step 1: Preview HTML */
            <View style={styles.previewContainer}>
              {isLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ marginTop: 12, color: colors.secondaryText }}>Đang tải hợp đồng...</Text>
                </View>
              ) : (
                <>
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: contractHtml || '<html><body><p>Không có nội dung</p></body></html>' }}
                    style={[styles.webview, { backgroundColor: 'white' }]}
                  />
                  {!isAlreadySigned && (
                    <TouchableOpacity 
                      style={[styles.footerBtn, { backgroundColor: colors.primary }]}
                      onPress={() => setStep(2)}
                    >
                      <PenTool size={18} color="#fff" />
                      <Text style={styles.footerBtnText}>Tiếp tục ký tên</Text>
                      <ChevronRight size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          ) : (
            /* Step 2: Signature Canvas */
            <View style={styles.signatureContainer}>
              <View style={styles.signHeader}>
                <Text style={[styles.signInstructions, { color: colors.secondaryText }]}>
                  Vui lòng ký tên vào khung bên dưới để xác nhận thỏa thuận đầu tư.
                </Text>
              </View>

              <View style={[styles.canvasWrapper, { borderColor: colors.border }]}>
                <SignatureCanvas
                  ref={signatureRef}
                  onEnd={handleEnd}
                  onOK={handleOK}
                  descriptionText="Ký tên tại đây"
                  clearText="Xóa"
                  confirmText="Xác nhận"
                  webStyle={`.m-signature-pad--footer { display: none; } body,html { width: 100%; height: 100%; }`}
                  autoClear={false}
                  imageType="image/png"
                />
              </View>

              <View style={styles.signActions}>
                <TouchableOpacity 
                  style={[styles.smallBtn, { backgroundColor: colors.mutedBackground }]}
                  onPress={handleClear}
                >
                  <RotateCcw size={16} color={colors.text} />
                  <Text style={[styles.smallBtnText, { color: colors.text }]}>Ký lại</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.submitBtn, 
                    { backgroundColor: colors.accentGreen },
                    (isSignatureEmpty || isSubmitting) && { opacity: 0.5 }
                  ]}
                  onPress={() => signatureRef.current.readSignature()}
                  disabled={isSignatureEmpty || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Check size={20} color="#fff" />
                      <Text style={styles.submitBtnText}>Hoàn tất ký kết</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Quay lại xem hợp đồng</Text>
              </TouchableOpacity>
            </View>
          )}
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewContainer: { flex: 1, padding: 0 },
  webview: { flex: 1 },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  footerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  signatureContainer: {
    flex: 1,
    padding: 20,
  },
  signHeader: {
    marginBottom: 24,
  },
  signInstructions: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  canvasWrapper: {
    width: '100%',
    height: height * 0.4,
    borderWidth: 2,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  signActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 24,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  smallBtnText: {
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  backBtn: {
    marginTop: 30,
    alignItems: 'center',
  }
});
