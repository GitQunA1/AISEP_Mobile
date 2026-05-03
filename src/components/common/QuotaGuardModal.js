import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Zap, Brain, Crown, Check, ShieldAlert, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';

/**
 * QuotaGuardModal
 * Dùng cho cả Unlock Project View và AI Analyze.
 * type: 'unlock' | 'ai'
 */
const QuotaGuardModal = ({
  visible,
  onClose,
  onConfirm,
  type = 'unlock',
  projectName,
  isProcessing,
  isLoadingQuota,
  remaining,
  packageName,
}) => {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const router = useRouter();

  const afterAction = Math.max(0, (remaining ?? 0) - 1);
  const isOutOfQuota = !isLoadingQuota && remaining <= 0;

  const config = type === 'ai' ? {
    icon: <Brain size={32} color="#a78bfa" />,
    iconBg: 'rgba(167,139,250,0.15)',
    title: 'Phân tích Dự án bằng AI',
    desc: 'Hệ thống AI sẽ thực hiện quét sâu và đánh giá chi tiết dự án:',
    quotaLabel: 'Quota AI',
    currentLabel: 'Hiện tại',
    afterLabel: 'Dự kiến còn',
    benefits: [
      'Phân tích tiềm năng & chỉ số rủi ro chi tiết',
      'Khuyến nghị đầu tư & bước tiếp theo từ AI',
      'Lưu kết quả vào lịch sử để xem lại',
    ],
    confirmText: 'Xác nhận Phân tích',
    confirmColor: '#a78bfa',
    outOfQuotaMsg: 'Số lượt phân tích AI đã hết. Vui lòng nâng cấp gói.',
  } : {
    icon: <Lock size={32} color={colors.primary} />,
    iconBg: colors.primary + '20',
    title: 'Mở khóa thông tin',
    desc: 'Bạn đang yêu cầu mở khóa toàn bộ thông tin dự án:',
    quotaLabel: 'Quota chi tiết',
    currentLabel: 'Lượt hiện tại',
    afterLabel: 'Sau khi mở',
    benefits: [
      'Xem Doanh thu, Mô hình KD & Team đầy đủ',
      'Dự án được lưu vào danh sách "Đã mở khóa" vĩnh viễn',
    ],
    confirmText: 'Xác nhận mở khóa',
    confirmColor: colors.primary,
    outOfQuotaMsg: 'Số lượt xem đã hết. Vui lòng nâng cấp gói.',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
            {config.icon}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
          <Text style={[styles.desc, { color: colors.secondaryText }]}>{config.desc}</Text>
          {projectName && (
            <Text style={[styles.projectName, { color: colors.text }]}>{projectName}</Text>
          )}

          {/* Quota Card */}
          <View style={[styles.quotaCard, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}>
            <View style={styles.quotaHeader}>
              <Zap size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={[styles.quotaHeaderText, { color: colors.secondaryText }]}>
                {config.quotaLabel} ({packageName || 'Gói của bạn'})
              </Text>
            </View>
            <View style={styles.quotaStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{config.currentLabel}</Text>
                {isLoadingQuota ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>{remaining ?? 0}</Text>
                )}
              </View>
              <ChevronRight size={16} color={colors.secondaryText} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{config.afterLabel}</Text>
                {isLoadingQuota ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.statValue, { color: isOutOfQuota ? colors.error : '#60a5fa' }]}>
                    {afterAction}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.benefitList}>
            {config.benefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Check size={14} color="#10b981" />
                <Text style={[styles.benefitText, { color: colors.secondaryText }]}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Out of quota warning */}
          {isOutOfQuota && (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
              <ShieldAlert size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{config.outOfQuotaMsg}</Text>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity
            style={[styles.confirmBtn, {
              backgroundColor: isOutOfQuota ? colors.mutedBackground : config.confirmColor,
              opacity: isProcessing ? 0.7 : 1,
            }]}
            onPress={isOutOfQuota ? () => { onClose(); router.push('/subscription/management'); } : onConfirm}
            disabled={isProcessing || isLoadingQuota}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.confirmText, { color: isOutOfQuota ? colors.secondaryText : '#fff' }]}>
                {isOutOfQuota ? 'Nâng cấp gói ngay →' : config.confirmText}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.secondaryText }]}>Hủy bỏ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center', position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 4 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  projectName: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  quotaCard: { width: '100%', borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 16 },
  quotaHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  quotaHeaderText: { fontSize: 12, fontWeight: '700' },
  quotaStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 24, fontWeight: '900' },
  benefitList: { width: '100%', gap: 8, marginBottom: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 13, flex: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, width: '100%', marginBottom: 16 },
  errorText: { fontSize: 13, flex: 1 },
  confirmBtn: { width: '100%', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  confirmText: { fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 10 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});

export default QuotaGuardModal;
