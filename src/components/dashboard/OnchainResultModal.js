import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, Linking, Dimensions 
} from 'react-native';
import { X, ExternalLink, ShieldCheck, Hash, Calendar, Layers } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';

const { width } = Dimensions.get('window');

/**
 * OnchainResultModal - Displays blockchain verification details for a deal
 */
export default function OnchainResultModal({ visible, data, onClose }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  if (!data) return null;

  const handleOpenExplorer = () => {
    if (data.explorerLink) {
      Linking.openURL(data.explorerLink);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.titleRow}>
              <ShieldCheck size={20} color={colors.accentGreen} />
              <Text style={[styles.title, { color: colors.text }]}>Xác thực Blockchain</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.successHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.accentGreen + '20' }]}>
                <ShieldCheck size={40} color={colors.accentGreen} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Deal đã được On-chain</Text>
              <Text style={[styles.successSubtitle, { color: colors.secondaryText }]}>
                Thỏa thuận đầu tư này đã được ghi nhận vĩnh viễn trên mạng lưới blockchain.
              </Text>
            </View>

            <Card style={styles.detailsCard}>
              <DetailRow 
                icon={<Hash size={16} color={colors.primary} />}
                label="Mã giao dịch (TxHash)"
                value={data.txHash}
                colors={colors}
                isHash
              />
              <DetailRow 
                icon={<Layers size={16} color={colors.primary} />}
                label="Block"
                value={data.blockNumber?.toString() || 'Đang cập nhật...'}
                colors={colors}
              />
              <DetailRow 
                icon={<Calendar size={16} color={colors.primary} />}
                label="Thời gian xác nhận"
                value={data.timestamp ? new Date(data.timestamp).toLocaleString('vi-VN') : 'Mới đây'}
                colors={colors}
              />
            </Card>

            <TouchableOpacity 
              style={[styles.explorerBtn, { backgroundColor: colors.primary + '10' }]}
              onPress={handleOpenExplorer}
            >
              <Text style={[styles.explorerBtnText, { color: colors.primary }]}>Xem trên Blockchain Explorer</Text>
              <ExternalLink size={16} color={colors.primary} />
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.doneBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ icon, label, value, colors, isHash = false }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.labelRow}>
        {icon}
        <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>{label}</Text>
      </View>
      <Text 
        style={[
          styles.detailValue, 
          { color: colors.text },
          isHash && styles.hashText
        ]}
        numberOfLines={isHash ? 1 : 2}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  detailsCard: {
    padding: 16,
    gap: 16,
    marginBottom: 20,
  },
  detailRow: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: 8,
  },
  explorerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  explorerBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  }
});
