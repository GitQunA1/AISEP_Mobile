import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, TextInput, ActivityIndicator, SafeAreaView,
  Alert, Dimensions 
} from 'react-native';
import { 
  X, FileText, CheckCircle, AlertCircle, 
  Clock, RotateCcw, Send 
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import consultingReportService from '../../services/consultingReportService';
import Button from '../Button';

const { width } = Dimensions.get('window');

export default function ConsultingReportModal({ isVisible, onClose, bookingId, userRole, advisorName, onDone }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const isAdvisor = userRole === 'Advisor';

  const [phase, setPhase] = useState('loading'); // loading | submit-form | view-report | success | error
  const [report, setReport] = useState(null);
  const [loadError, setLoadError] = useState('');

  // Advisor form
  const [form, setForm] = useState({
    meetingTitle: '',
    location: '',
    meetingTime: new Date().toISOString(),
    meetingPurpose: '',
    content: '',
    decisionsMade: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Startup review
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isVisible && bookingId) {
      loadReport();
    }
  }, [isVisible, bookingId]);

  const loadReport = async () => {
    setPhase('loading');
    setLoadError('');
    try {
      const r = await consultingReportService.getReportByBookingId(bookingId);
      setReport(r);
      if (r) {
        if (isAdvisor && r.status === 'RevisionRequested') {
          setForm({
            meetingTitle: r.meetingTitle || '',
            location: r.location || '',
            meetingTime: r.meetingTime || new Date().toISOString(),
            meetingPurpose: r.meetingPurpose || '',
            content: r.content || '',
            decisionsMade: r.decisionsMade || '',
          });
          setPhase('submit-form');
        } else {
          setPhase('view-report');
        }
      } else {
        setPhase(isAdvisor ? 'submit-form' : 'view-report');
      }
    } catch (e) {
      if (e?.statusCode === 404 || e?.message?.toLowerCase().includes('not found')) {
        setReport(null);
        setPhase(isAdvisor ? 'submit-form' : 'view-report');
      } else {
        setLoadError(e?.message || 'Không thể tải báo cáo.');
        setPhase('error');
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.meetingTitle.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề buổi tư vấn.');
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        bookingId,
        meetingTitle: form.meetingTitle.trim(),
        location: form.location.trim() || undefined,
        meetingTime: new Date(form.meetingTime).toISOString(),
        meetingPurpose: form.meetingPurpose.trim() || undefined,
        content: form.content.trim() || undefined,
        decisionsMade: form.decisionsMade.trim() || undefined,
      };
      const r = await consultingReportService.createReport(data);
      setReport(r);
      setPhase('success');
      onDone?.();
    } catch (e) {
      Alert.alert('Lỗi', e?.message || 'Không thể nộp báo cáo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await consultingReportService.approveReport(report.consultingReportId);
      setPhase('success');
      onDone?.();
    } catch (e) {
      Alert.alert('Lỗi', e?.message || 'Không thể chấp nhận báo cáo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do yêu cầu sửa đổi.');
      return;
    }
    setActionLoading(true);
    try {
      await consultingReportService.requestRevision(report.consultingReportId, revisionReason.trim());
      onClose();
      onDone?.();
    } catch (e) {
      Alert.alert('Lỗi', e?.message || 'Không thể gửi yêu cầu sửa đổi.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

  const reportStatusLabel = {
    'Submitted': 'Đã nộp – Chờ xem xét',
    'Approved': 'Đã chấp nhận',
    'ApprovedByStartup': 'Đã được Startup chấp thuận',
    'RevisionRequested': 'Yêu cầu sửa đổi',
    'Completed': 'Hoàn thành',
    'EscalatedToStaff': 'Đã khiếu nại lên Staff',
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleGrp}>
            <FileText size={20} color={colors.primary} />
            <View>
              <Text style={[styles.headerTitleText, { color: colors.text }]}>Báo Cáo Tư Vấn</Text>
              {advisorName && <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{advisorName}</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {phase === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.secondaryText }}>Đang tải báo cáo...</Text>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.centered}>
            <AlertCircle size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{loadError}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={loadReport}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'success' && (
          <View style={styles.centered}>
            <CheckCircle size={64} color={colors.accentGreen} />
            <Text style={[styles.successTitle, { color: colors.text }]}>
              {isAdvisor ? 'Nộp báo cáo thành công!' : 'Xử lý hoàn tất!'}
            </Text>
            <Text style={[styles.mutedText, { color: colors.secondaryText }]}>Thông tin đã được lưu trên hệ thống AISEP.</Text>
            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'submit-form' && (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {report?.status === 'RevisionRequested' && (
              <View style={[styles.revisionAlert, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
                <View style={styles.raHeader}>
                  <RotateCcw size={18} color={colors.error} />
                  <Text style={[styles.raTitle, { color: colors.error }]}>Yêu cầu sửa đổi báo cáo (Lần {report.revisionCount})</Text>
                </View>
                <Text style={[styles.raReason, { color: colors.text }]}>"{report.revisionRequestReason}"</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Tiêu đề buổi tư vấn</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="VD: Định hướng chiến lược kinh doanh quý 3"
                placeholderTextColor={colors.secondaryText}
                value={form.meetingTitle}
                onChangeText={(t) => setForm(p => ({ ...p, meetingTitle: t }))}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Địa điểm / Hình thức</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="VD: Zoom / Văn phòng đại diện"
                placeholderTextColor={colors.secondaryText}
                value={form.location}
                onChangeText={(t) => setForm(p => ({ ...p, location: t }))}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Nội dung thảo luận chính</Text>
              <TextInput
                style={[styles.textarea, { color: colors.text, borderColor: colors.border }]}
                multiline
                numberOfLines={6}
                placeholder="Mô tả chi tiết nội dung đã thảo luận..."
                placeholderTextColor={colors.secondaryText}
                value={form.content}
                onChangeText={(t) => setForm(p => ({ ...p, content: t }))}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Quyết định & Kết luận</Text>
              <TextInput
                style={[styles.textarea, { color: colors.text, borderColor: colors.border }]}
                multiline
                numberOfLines={4}
                placeholder="Các quyết định đã thống nhất và hướng đi tiếp theo..."
                placeholderTextColor={colors.secondaryText}
                value={form.decisionsMade}
                onChangeText={(t) => setForm(p => ({ ...p, decisionsMade: t }))}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary }]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
              <Text style={styles.submitBtnText}>{submitting ? 'Đang gửi...' : 'Gửi báo cáo'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {phase === 'view-report' && (
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {!report ? (
                <View style={styles.centered}>
                  <FileText size={48} color={colors.border} />
                  <Text style={[styles.mutedText, { color: colors.secondaryText, textAlign: 'center', marginTop: 12 }]}>
                    Chưa có thông tin báo cáo tư vấn. Advisor sẽ chuẩn bị và nộp báo cáo chính thức sau khi buổi tư vấn kết thúc.
                  </Text>
                </View>
              ) : (
                <View style={styles.reportView}>
                  <View style={styles.statusBar}>
                    <View style={[styles.statusBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
                        {reportStatusLabel[report.status] || report.status}
                      </Text>
                    </View>
                    {report.revisionCount > 0 && (
                      <View style={styles.revisionBadge}>
                        <RotateCcw size={14} color={colors.secondaryText} />
                        <Text style={{ color: colors.secondaryText, fontSize: 12 }}> Có {report.revisionCount} lần sửa đổi</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Tiêu đề buổi tư vấn</Text>
                    <Text style={[styles.detailValue, { color: colors.text, fontSize: 18, fontWeight: '800' }]}>{report.meetingTitle}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Thời gian</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(report.meetingTime)}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Địa điểm</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{report.location || 'Chưa xác định'}</Text>
                  </View>

                  {report.content && (
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Nội dung thảo luận</Text>
                      <View style={[styles.contentBox, { backgroundColor: colors.mutedBackground }]}>
                        <Text style={[styles.contentText, { color: colors.text }]}>{report.content}</Text>
                      </View>
                    </View>
                  )}

                  {report.decisionsMade && (
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Quyết định & Kết luận</Text>
                      <Text style={[styles.decisionText, { color: colors.primary }]}>{report.decisionsMade}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {report && !isAdvisor && report.status === 'Submitted' && (
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                {showRevisionInput && (
                   <TextInput
                    style={[styles.textarea, { color: colors.text, borderColor: colors.error, marginBottom: 16 }]}
                    multiline
                    placeholder="Lý do yêu cầu sửa đổi cụ thể..."
                    placeholderTextColor={colors.secondaryText}
                    value={revisionReason}
                    onChangeText={setRevisionReason}
                  />
                )}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {!showRevisionInput ? (
                    <>
                      <TouchableOpacity 
                        style={[styles.secondaryActionBtn, { borderColor: colors.border }]} 
                        onPress={() => setShowRevisionInput(true)}
                        disabled={actionLoading}
                      >
                        <RotateCcw size={16} color={colors.text} />
                        <Text style={[styles.btnText, { color: colors.text }]}>Sửa lại</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.primaryActionBtn, { backgroundColor: colors.accentGreen }]} 
                        onPress={handleApprove}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={16} color="#fff" />
                        <Text style={[styles.btnText, { color: '#fff' }]}>Chấp nhận</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={[styles.secondaryActionBtn, { borderColor: colors.border }]} 
                        onPress={() => { setShowRevisionInput(false); setRevisionReason(''); }}
                        disabled={actionLoading}
                      >
                        <Text style={[styles.btnText, { color: colors.text }]}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]} 
                        onPress={handleRevision}
                        disabled={actionLoading}
                      >
                        <Send size={16} color="#fff" />
                        <Text style={[styles.btnText, { color: '#fff' }]}>Gửi yêu cầu</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitleGrp: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitleText: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, fontWeight: '600' },
  closeBtn: { padding: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  scrollContent: { padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 15 },
  textarea: { padding: 16, borderWidth: 1, borderRadius: 12, fontSize: 15, textAlignVertical: 'top', minHeight: 100 },
  submitBtn: { height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  reportView: { gap: 20 },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  revisionBadge: { flexDirection: 'row', alignItems: 'center' },
  detailItem: { gap: 6 },
  detailLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { fontSize: 15, fontWeight: '600' },
  contentBox: { padding: 16, borderRadius: 16 },
  contentText: { fontSize: 15, lineHeight: 24 },
  decisionText: { fontSize: 15, fontWeight: '700', lineHeight: 24 },
  revisionAlert: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  raHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  raTitle: { fontSize: 14, fontWeight: '800' },
  raReason: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  successTitle: { fontSize: 20, fontWeight: '800', marginTop: 24, marginBottom: 8 },
  mutedText: { fontSize: 14, lineHeight: 20 },
  doneBtn: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  footer: { padding: 20, borderTopWidth: 1 },
  primaryActionBtn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryActionBtn: { paddingHorizontal: 20, height: 48, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 15, fontWeight: '700' },
});
