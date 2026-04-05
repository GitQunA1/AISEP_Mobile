import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Target, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import dealsService from '../../services/dealsService';
import { useTheme } from '../../context/ThemeContext';
import Button from '../Button';

export default function InvestmentModal({
  isOpen,
  projectId,
  projectName,
  startupName,
  onClose,
  onSuccess
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [dealStatus, setDealStatus] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setDealStatus(null);

    let dealId = null;
    let dealStatusString = 'Pending';

    try {
      const response = await dealsService.createDeal(projectId);
      
      dealId = response?.data?.dealId;
      if (!dealId) {
        throw new Error('No dealId returned from API');
      }
      
      try {
        const statusResponse = await dealsService.getContractStatus(dealId);
        dealStatusString = statusResponse?.data?.status || 'Pending';
        const statusInfo = dealsService.getStatusInfo(dealStatusString);
        
        setDealStatus({
          dealId: dealId,
          projectName: response?.data?.projectName,
          startupName: response?.data?.startupName,
          statusCode: statusInfo.value,
          statusInfo: statusInfo,
          status: dealStatusString,
        });
      } catch (statusErr) {
        // Fallback
        dealStatusString = response?.data?.status || 'Pending';
        const statusInfo = dealsService.getStatusInfo(dealStatusString);
        setDealStatus({
          dealId: dealId,
          projectName: response?.data?.projectName,
          startupName: response?.data?.startupName,
          statusCode: statusInfo.value,
          statusInfo: statusInfo,
          status: dealStatusString,
        });
      }
      
      setSuccessMessage('Đầu tư thành công! Chúng tôi sẽ liên hệ với bạn sớm.');
      
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);
      
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Không thể tạo đơn đầu tư. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setError(null);
    setSuccessMessage(null);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.titleSection}>
              <Target size={24} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.title, { color: colors.text }]}>Đầu tư vào Dự án</Text>
                <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{startupName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={isLoading} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Success State */}
            {successMessage && (
              <View style={styles.successBox}>
                <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
                  <CheckCircle size={32} color={colors.success} />
                </View>
                <Text style={[styles.successText, { color: colors.text }]}>{successMessage}</Text>
                
                {dealStatus && (
                  <View style={[styles.dealInfo, { backgroundColor: colors.mutedBackground }]}>
                    <Text style={[styles.dealInfoLabel, { color: colors.secondaryText }]}>Mã giao dịch</Text>
                    <Text style={[styles.dealInfoValue, { color: colors.text }]}>#{dealStatus.dealId}</Text>
                    
                    <Text style={[styles.dealInfoLabel, { color: colors.secondaryText, marginTop: 8 }]}>Trạng thái</Text>
                    <View style={styles.dealStatusRow}>
                      <CheckCircle size={14} color={dealStatus.statusInfo?.color || colors.primary} />
                      <Text style={[styles.dealStatusText, { color: dealStatus.statusInfo?.color || colors.primary }]}>
                        {dealStatus.statusInfo?.labelVi}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Error State */}
            {error && !successMessage && (
              <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                <AlertCircle size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            {/* Form */}
            {!successMessage && (
              <View>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Dự án</Text>
                  <View style={[styles.staticField, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 16 }}>{projectName}</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Công ty khởi nghiệp</Text>
                  <View style={[styles.staticField, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 16 }}>{startupName}</Text>
                  </View>
                </View>

                <View style={[styles.infoBox, { backgroundColor: colors.primary + '15' }]}>
                  <AlertCircle size={18} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    Nhấn nút <Text style={{ fontWeight: 'bold' }}>"Xác nhận Đầu tư"</Text> để gửi đơn đầu tư. 
                    Sau đó, chúng tôi sẽ xử lý yêu cầu của bạn và liên hệ lại.
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Button 
                    title="Hủy" 
                    variant="outline" 
                    onPress={handleClose} 
                    disabled={isLoading}
                    style={{ flex: 1, marginRight: 12 }} 
                  />
                  <Button 
                    title={isLoading ? "Đang xử lý..." : "Xác nhận Đầu tư"} 
                    onPress={handleSubmit} 
                    disabled={isLoading}
                    loading={isLoading}
                    style={{ flex: 1 }} 
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  dealInfo: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
  },
  dealInfoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dealInfoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  dealStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  staticField: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
