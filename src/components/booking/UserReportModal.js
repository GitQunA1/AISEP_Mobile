import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, TextInput, ActivityIndicator, SafeAreaView,
  Alert, Dimensions, Image 
} from 'react-native';
import { 
  X, AlertCircle, ShieldAlert, Send, 
  Camera, Video, Trash2, Plus 
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import userReportService from '../../services/userReportService';

const { width } = Dimensions.get('window');

const REPORT_CATEGORIES = [
  { value: 'PaymentDispute', label: 'Tranh chấp thanh toán / báo cáo tư vấn' },
  { value: 'UnprofessionalBehavior', label: 'Hành vi thiếu chuyên nghiệp' },
  { value: 'Harassment', label: 'Quấy rối' },
  { value: 'Scam', label: 'Dấu hiệu lừa đảo' },
  { value: 'Impersonation', label: 'Mạo danh' },
  { value: 'InappropriateContent', label: 'Nội dung không phù hợp' },
  { value: 'Other', label: 'Lý do khác' },
];

export default function UserReportModal({ 
  isVisible, onClose, bookingId, targetUserId, targetUserName, onDone 
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [phase, setPhase] = useState('form'); // form | loading | success
  const [form, setForm] = useState({
    category: 'PaymentDispute',
    description: '',
    videoEvidenceUrl: '',
  });
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickEvidence = async () => {
    if (evidenceFiles.length >= 5) {
      Alert.alert('Giới hạn', 'Tối đa 5 minh chứng hình ảnh.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: true,
      });

      if (!result.canceled) {
        const newFiles = [...evidenceFiles, ...result.assets];
        setEvidenceFiles(newFiles.slice(0, 5));
      }
    } catch (err) {
      console.error('[UserReportModal] pick error:', err);
    }
  };

  const removeEvidence = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả chi tiết vấn đề.');
      return;
    }

    setIsSubmitting(true);
    setPhase('loading');

    try {
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('description', form.description.trim());
      if (bookingId) formData.append('bookingId', bookingId);
      if (targetUserId) formData.append('reportedUserId', targetUserId);
      if (form.videoEvidenceUrl) formData.append('videoEvidenceUrl', form.videoEvidenceUrl.trim());
      
      evidenceFiles.forEach((file, index) => {
        formData.append('evidenceImages', {
          uri: file.uri,
          name: file.name || `evidence_${index}.jpg`,
          type: file.mimeType || 'image/jpeg',
        });
      });

      await userReportService.createReport(formData);
      setPhase('success');
    } catch (e) {
      setPhase('form');
      Alert.alert('Lỗi', e?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleGrp}>
            <ShieldAlert size={24} color={colors.error} />
            <View>
              <Text style={[styles.headerTitleText, { color: colors.text }]}>Khiếu Nại / Báo Cáo</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
                {targetUserName ? `Về: ${targetUserName}` : bookingId ? `Booking #${bookingId}` : 'Báo cáo hệ thống'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {phase === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16, color: colors.secondaryText }}>Đang gửi báo cáo của bạn...</Text>
          </View>
        )}

        {phase === 'success' && (
          <View style={styles.centered}>
            <ShieldAlert size={64} color={colors.accentGreen} />
            <Text style={[styles.successTitle, { color: colors.text }]}>Đã gửi khiếu nại thành công</Text>
            <Text style={[styles.mutedText, { color: colors.secondaryText, textAlign: 'center' }]}>
              Khiếu nại của bạn đang được xem xét. AISEP sẽ giải quyết và phản hồi trong vòng 24–48 giờ làm việc.
            </Text>
            <TouchableOpacity 
              style={[styles.doneBtn, { backgroundColor: colors.primary }]} 
              onPress={() => { onClose(); onDone?.(); }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'form' && (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Loại vi phạm</Text>
              <View style={styles.categoryGrid}>
                {REPORT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryItem,
                      { backgroundColor: form.category === cat.value ? colors.primary + '15' : colors.card, borderColor: form.category === cat.value ? colors.primary : colors.border }
                    ]}
                    onPress={() => setForm(p => ({ ...p, category: cat.value }))}
                  >
                    <Text style={[styles.categoryText, { color: form.category === cat.value ? colors.primary : colors.text }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Mô tả chi tiết</Text>
              <TextInput
                style={[styles.textarea, { color: colors.text, borderColor: colors.border }]}
                multiline
                numberOfLines={5}
                placeholder="Vui lòng mô tả rõ sự việc đã xảy ra..."
                placeholderTextColor={colors.secondaryText}
                value={form.description}
                onChangeText={(t) => setForm(p => ({ ...p, description: t }))}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Bằng chứng hình ảnh (Tối đa 5)</Text>
              <View style={styles.evidenceGrid}>
                {evidenceFiles.map((file, idx) => (
                  <View key={idx} style={[styles.evidenceItem, { borderColor: colors.border }]}>
                    <Image source={{ uri: file.uri }} style={styles.evidenceImg} />
                    <TouchableOpacity 
                      style={styles.removeBtn} 
                      onPress={() => removeEvidence(idx)}
                    >
                      <Trash2 size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {evidenceFiles.length < 5 && (
                  <TouchableOpacity 
                    style={[styles.addEvidenceBtn, { borderColor: colors.border, borderStyle: 'dashed' }]}
                    onPress={handlePickEvidence}
                  >
                    <Plus size={24} color={colors.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Link video minh chứng (Drive, YT...)</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                <Video size={18} color={colors.secondaryText} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Nhập đường dẫn nếu có"
                  placeholderTextColor={colors.secondaryText}
                  value={form.videoEvidenceUrl}
                  onChangeText={(t) => setForm(p => ({ ...p, videoEvidenceUrl: t }))}
                />
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {phase === 'form' && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
             <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.error }]} onPress={handleSubmit}>
              <Send size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Gửi báo cáo ngay</Text>
            </TouchableOpacity>
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
  field: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  categoryText: { fontSize: 13, fontWeight: '600' },
  textarea: { padding: 16, borderWidth: 1, borderRadius: 14, fontSize: 15, textAlignVertical: 'top', minHeight: 120 },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  evidenceItem: { width: (width - 70) / 3, aspectRatio: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  evidenceImg: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  addEvidenceBtn: { width: (width - 70) / 3, aspectRatio: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.02)' },
  inputWrapper: { height: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15 },
  footer: { padding: 20, paddingBottom: 34, borderTopWidth: 1 },
  submitBtn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  successTitle: { fontSize: 20, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  mutedText: { fontSize: 14, lineHeight: 22 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14, marginTop: 32 },
});
