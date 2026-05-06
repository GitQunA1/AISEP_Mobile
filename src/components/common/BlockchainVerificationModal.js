import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Clipboard,
  Linking,
  Platform
} from 'react-native';
import { 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  X, 
  Shield, 
  ExternalLink,
  ChevronRight
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * BlockchainVerificationModal - Mobile implementation
 */
export default function BlockchainVerificationModal({ 
  isOpen, 
  verificationData, 
  onClose, 
  projectName, 
  isLoading, 
  error 
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // Extract data from API response format
  const apiData = verificationData?.data || verificationData || {};
  
  const isFullyVerified = apiData.isFullyVerified ?? apiData.isAuthentic ?? apiData.isVerified ?? false;
  const totalDocs = apiData.totalDocuments ?? 1;
  const verifiedDocs = apiData.verifiedDocuments ?? (isFullyVerified ? 1 : 0);
  
  const docDetails = apiData.verifiedDocumentDetails || [];
  const firstDoc = docDetails[0] || {};
  
  const txHash = firstDoc.txHash || apiData.txHash || apiData.blockchainTxHash || apiData.transactionHash;
  const timestamp = firstDoc.timestampOnBlockchain || apiData.timestampOnBlockchain || apiData.verifiedAt || apiData.timestamp;
  const signerAddress = firstDoc.signerAddress || apiData.signerAddress || apiData.walletAddress;

  const handleViewOnEtherscan = () => {
    if (txHash) {
      Linking.openURL(`https://sepolia.etherscan.io/tx/${txHash}`);
    }
  };

  const handleCopy = (text) => {
    if (text) {
      Clipboard.setString(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerInfo}>
              <View style={[styles.headerIconContainer, { backgroundColor: isLoading ? colors.primary + '15' : error ? 'rgba(244, 33, 46, 0.1)' : isFullyVerified ? 'rgba(39, 174, 96, 0.1)' : 'rgba(245, 166, 35, 0.1)' }]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : error ? (
                  <AlertCircle size={22} color="#f4212e" />
                ) : isFullyVerified ? (
                  <CheckCircle size={22} color="#27AE60" />
                ) : (
                  <AlertCircle size={22} color="#F5A623" />
                )}
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text }]}>Xác thực Blockchain</Text>
                <Text style={[styles.subtitle, { color: colors.secondaryText }]} numberOfLines={1}>
                  {projectName || 'Dự án'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingArea}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang xác minh trên mạng lưới...</Text>
              </View>
            ) : error ? (
              <View style={[styles.errorBox, { backgroundColor: 'rgba(244, 33, 46, 0.05)', borderColor: 'rgba(244, 33, 46, 0.2)' }]}>
                <AlertCircle size={20} color="#f4212e" />
                <View style={styles.errorTextContainer}>
                  <Text style={styles.errorTitle}>Lỗi xác minh</Text>
                  <Text style={[styles.errorDescription, { color: colors.secondaryText }]}>{error}</Text>
                </View>
              </View>
            ) : (
              <>
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: isFullyVerified ? 'rgba(39, 174, 96, 0.08)' : 'rgba(245, 166, 35, 0.08)' }]}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Tình trạng xác thực</Text>
                  <Text style={[styles.statusValue, { color: isFullyVerified ? '#27AE60' : '#F5A623' }]}>
                    {isFullyVerified ? '✓ Đã xác thực thành công' : 'Dữ liệu không đồng nhất'}
                  </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statItem, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Tổng tài liệu</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{totalDocs}</Text>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}>
                    <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Đã khớp</Text>
                    <Text style={[styles.statValue, { color: '#27AE60' }]}>{verifiedDocs}</Text>
                  </View>
                </View>

                {/* Transaction Details */}
                {txHash && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Mã giao dịch (TX Hash)</Text>
                    <TouchableOpacity 
                      style={[styles.copyBox, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}
                      onPress={() => handleCopy(txHash)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.hashText, { color: colors.text }]} numberOfLines={2}>{txHash}</Text>
                      <Copy size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {signerAddress && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Địa chỉ ký (Signer)</Text>
                    <TouchableOpacity 
                      style={[styles.copyBox, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}
                      onPress={() => handleCopy(signerAddress)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.hashText, { color: colors.text }]} numberOfLines={1}>{signerAddress}</Text>
                      <Copy size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {timestamp && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Thời gian xác thực</Text>
                    <View style={[styles.infoBox, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}>
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        {new Date(timestamp).toLocaleString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {!isLoading && !error && txHash && (
              <TouchableOpacity 
                style={[styles.etherscanBtn, { backgroundColor: colors.primary }]}
                onPress={handleViewOnEtherscan}
              >
                <ExternalLink size={16} color="#fff" />
                <Text style={styles.etherscanBtnText}>Xem trên Etherscan</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.closeConfirmBtn, { backgroundColor: !txHash || error ? colors.primary : colors.mutedBackground }]}
              onPress={onClose}
            >
              <Text style={[styles.closeConfirmBtnText, { color: !txHash || error ? '#fff' : colors.text }]}>Đóng</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20
      },
      android: {
        elevation: 10
      }
    })
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 17,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  body: {
    padding: 16
  },
  loadingArea: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center'
  },
  errorBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16
  },
  errorTextContainer: {
    marginLeft: 12,
    flex: 1
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4212e'
  },
  errorDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18
  },
  statusCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4
  },
  copyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12
  },
  hashText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600'
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 10
  },
  etherscanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8
  },
  etherscanBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800'
  },
  closeConfirmBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeConfirmBtnText: {
    fontSize: 15,
    fontWeight: '700'
  }
});
