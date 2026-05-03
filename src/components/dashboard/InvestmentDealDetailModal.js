import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, Dimensions, ActivityIndicator 
} from 'react-native';
import { 
  X, DollarSign, PieChart, Calendar, 
  FileText, ShieldCheck, CheckCircle, Clock 
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function InvestmentDealDetailModal({ 
  visible, 
  onClose, 
  deal, 
  onApprove, 
  onReject,
  isResponding 
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  if (!deal) return null;

  const formatCurrency = (amount) => {
    if (!amount) return '0 đ';
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const isPending = (deal.statusStr === 'PENDING' || deal.status === 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Chi tiết thỏa thuận</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.accentCyan + '15' }]}>
                  <DollarSign size={20} color={colors.accentCyan} />
                </View>
                <View style={styles.infoBody}>
                  <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Số vốn đầu tư</Text>
                  <Text style={[styles.infoValue, { color: colors.accentCyan }]}>{formatCurrency(deal.amount)}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                  <PieChart size={20} color={colors.primary} />
                </View>
                <View style={styles.infoBody}>
                  <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Cổ phần đề nghị</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{deal.equityOffer}%</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.success + '15' }]}>
                  <Calendar size={20} color={colors.success} />
                </View>
                <View style={styles.infoBody}>
                  <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>Ngày đề xuất</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(deal.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
            </Card>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Nhà đầu tư</Text>
              <View style={styles.investorBox}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{deal.investorName?.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={[styles.investorName, { color: colors.text }]}>{deal.investorName}</Text>
                  <Text style={[styles.investorRole, { color: colors.secondaryText }]}>Nhà đầu tư chiến lược</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ghi chú & Điều khoản</Text>
              <View style={[styles.termsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.termsText, { color: colors.text }]}>
                  {deal.message || 'Thỏa thuận đầu tư dựa trên định giá hiện tại của dự án. Các điều khoản chi tiết sẽ được cụ thể hóa trong hợp đồng chính thức sau khi Startup chấp nhận đề nghị này.'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trạng thái hiện tại</Text>
              <View style={styles.statusBox}>
                <Clock size={16} color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  {deal.statusStr || 'PENDING'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {isPending && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.rejectBtn, { borderColor: colors.error }]}
                onPress={() => onReject(deal.dealId)}
                disabled={isResponding}
              >
                <Text style={[styles.btnText, { color: colors.error }]}>Từ chối</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.primary }]}
                onPress={() => onApprove(deal.dealId)}
                disabled={isResponding}
              >
                {isResponding ? <ActivityIndicator size="small" color="#fff" /> : <CheckCircle size={18} color="#fff" />}
                <Text style={[styles.btnText, { color: '#fff' }]}>Chấp nhận đầu tư</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { height: SCREEN_HEIGHT * 0.8, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 24, borderBottomWidth: 1 
  },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  closeBtn: { padding: 4 },
  content: { padding: 24, paddingBottom: 100 },
  infoCard: { padding: 20, borderRadius: 24, marginBottom: 32 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: '900' },
  divider: { height: 1, marginVertical: 16 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  investorBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  investorName: { fontSize: 17, fontWeight: '800' },
  investorRole: { fontSize: 13, fontWeight: '600' },
  termsBox: { padding: 16, borderRadius: 16, borderWidth: 1 },
  termsText: { fontSize: 14, lineHeight: 22 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 14, fontWeight: '700' },
  footer: { 
    flexDirection: 'row', gap: 12, padding: 24, paddingBottom: 40, 
    borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 
  },
  actionBtn: { 
    flex: 1, height: 56, borderRadius: 16, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 
  },
  rejectBtn: { borderWidth: 1.5 },
  approveBtn: { flex: 1.5 },
  btnText: { fontSize: 16, fontWeight: '800' }
});
