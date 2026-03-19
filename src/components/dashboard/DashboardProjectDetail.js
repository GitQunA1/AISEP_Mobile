import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView, RefreshControl, Dimensions 
} from 'react-native';
import { 
  X, AlertCircle, FileText, TrendingUp, Users, Shield, 
  Target, Lightbulb, Briefcase, Zap, CheckCircle, ChevronRight, Upload, Send
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import DocumentManager from './DocumentManager';
import Button from '../Button';
import Card from '../Card';
import projectSubmissionService from '../../services/projectSubmissionService';

const { width } = Dimensions.get('window');

const getStatusConfig = (status, colors) => {
  const configs = {
    Draft: { label: 'Bản nháp', color: colors.statusDraftText, bg: colors.statusDraftBg },
    Pending: { label: 'Đang chờ duyệt', color: colors.statusPendingText, bg: colors.statusPendingBg },
    Approved: { label: 'Đã duyệt', color: colors.statusApprovedText, bg: colors.statusApprovedBg },
    Published: { label: 'Đã đăng', color: colors.statusApprovedText, bg: colors.statusApprovedBg },
    Rejected: { label: 'Bị từ chối', color: colors.statusRejectedText, bg: colors.statusRejectedBg },
  };
  return configs[status] || configs.Draft;
};

const getStageLabel = (stage) => {
  const stages = { 'idea': 'Ý tưởng', 'mvp': 'MVP', 'growth': 'Tăng trưởng' };
  return stages[stage?.toLowerCase()] || stage || 'Không rõ';
};

export default function DashboardProjectDetail({ visible, project, onClose, onRefresh, onEdit }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [isProtecting, setIsProtecting] = useState(false);

  const [fullData, setFullData] = useState(project);
  const [documents, setDocuments] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const fetchFullDetails = async () => {
    if (!project?.id && !project?.projectId) return;
    const pid = project.id || project.projectId;
    
    setIsLoading(true);
    try {
      // 1. Fetch documents (Required)
      const docsRes = await projectSubmissionService.getDocuments(pid);
      if (docsRes?.success || docsRes?.isSuccess) {
        const docList = Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data?.items || []);
        setDocuments(docList);
      }

      // 2. Fetch AI Analysis (Optional, might be 404 if not evaluated yet)
      try {
        const aiRes = await projectSubmissionService.getAIAnalysisResults(pid);
        if (aiRes?.success || aiRes?.isSuccess) {
          setAiAnalysis(aiRes.data);
        } else {
          setAiAnalysis(null);
        }
      } catch (aiErr) {
        // Silently handle 404 or other errors for AI results
        console.log('No AI analysis found for this project yet');
        setAiAnalysis(null);
      }
      
    } catch (error) {
      // Only log severe errors like network failure or document fetch failure
      console.error('Error fetching project documents:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible && project) {
      setFullData(project);
      fetchFullDetails();
    }
  }, [visible, project?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFullDetails();
  };

  const handleSubmitProject = async () => {
    Alert.alert(
      'Nộp dự án',
      'Sau khi nộp, bạn sẽ không thể chỉnh sửa thông tin cho đến khi có kết quả duyệt. Bạn chắc chắn chứ?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Nộp ngay', 
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const res = await projectSubmissionService.submitProject(project.id || project.projectId);
              if (res?.success || res?.isSuccess) {
                Alert.alert('Thành công', 'Dự án đã được nộp để xem xét.');
                onRefresh?.();
                onClose();
              } else {
                Alert.alert('Lỗi', res?.message || 'Không thể nộp dự án');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Lỗi kết nối máy chủ');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleAIEvaluation = async () => {
    setIsEvaluatingAI(true);
    try {
      const res = await projectSubmissionService.triggerAIAnalysis(project.id || project.projectId);
      if (res?.success || res?.isSuccess) {
        Alert.alert('Thành công', 'Đang tiến hành đánh giá AI. Kết quả sẽ được cập nhật sau vài giây.');
        fetchFullDetails();
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể kích hoạt đánh giá AI');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ');
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  // Sections definition for cleaner rendering
  const SECTIONS = [
    {
      id: 'basic',
      title: '1. Thông tin cơ bản',
      icon: <Lightbulb size={20} color={colors.accentCyan} />,
      accent: colors.accentCyan,
      fields: [
        { label: 'Mô tả ngắn', value: fullData.shortDescription || fullData.description },
        { label: 'Giai đoạn', value: getStageLabel(fullData.developmentStage || fullData.stage), icon: <TrendingUp size={14} color={colors.accentCyan} /> },
        { label: 'Vấn đề', value: fullData.problemStatement || fullData.problemDescription },
        { label: 'Giải pháp', value: fullData.solutionDescription || fullData.proposedSolution || fullData.solution },
      ]
    },
    {
      id: 'market',
      title: '2. Thị trường & Mô hình',
      icon: <Target size={20} color={colors.accentOrange} />,
      accent: colors.accentOrange,
      fields: [
        { label: 'Khách hàng mục tiêu', value: fullData.targetCustomers || fullData.idealCustomerBuyer },
        { label: 'Điểm khác biệt (UVP)', value: fullData.uniqueValueProposition || fullData.differentiator },
        { label: 'Mô hình kinh doanh', value: fullData.businessModel || fullData.revenueMethod },
        { label: 'Quy mô thị trường', value: fullData.marketSize ? `${Number(fullData.marketSize).toLocaleString()} VND` : null },
        { label: 'Doanh thu', value: fullData.revenue ? `${Number(fullData.revenue).toLocaleString()} VND` : null },
      ]
    },
    {
      id: 'team',
      title: '3. Đội ngũ & Kỹ năng',
      icon: <Users size={20} color={colors.accentPurple} />,
      accent: colors.accentPurple,
      fields: [
        { label: 'Thành viên & Vai trò', value: fullData.teamMembers || fullData.teamRoles },
        { label: 'Kỹ năng cốt lõi', value: fullData.keySkills },
      ]
    },
    {
      id: 'competition',
      title: '4. Cạnh tranh',
      icon: <Zap size={20} color={colors.error} />,
      accent: colors.error,
      fields: [
        { label: 'Kinh nghiệm đội ngũ', value: fullData.teamExperience },
        { label: 'Đối thủ cạnh tranh', value: fullData.competitors },
      ]
    }
  ];

  if (!project) return null;
  const statusConfig = getStatusConfig(fullData.status, colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerInfo}>
            <Text style={[styles.projectTitle, { color: colors.text }]} numberOfLines={1}>
              {fullData.projectName || fullData.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.mutedBackground }]}>
            <X size={24} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {/* Rejection Notice */}
          {fullData.status === 'Rejected' && fullData.rejectionReason && (
            <Card style={[styles.rejectionCard, { borderColor: colors.error + '40' }]}>
              <View style={styles.rejectionHeader}>
                <AlertCircle size={18} color={colors.error} />
                <Text style={[styles.rejectionTitle, { color: colors.error }]}>Lý do từ chối:</Text>
              </View>
              <Text style={[styles.rejectionText, { color: colors.text }]}>{fullData.rejectionReason}</Text>
            </Card>
          )}

          {SECTIONS.map(section => (
            <View key={section.id} style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.iconContainer, { backgroundColor: section.accent + '25' }]}>
                  {section.icon}
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              </View>
              <Card style={[styles.sectionCard, { borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: section.accent }]}>
                {section.fields.map((field, fidx) => field.value ? (
                  <View key={fidx} style={[styles.field, fidx === section.fields.length - 1 && styles.noBorder]}>
                    <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{field.label}</Text>
                    <View style={styles.fieldValueRow}>
                      {field.icon}
                      <Text style={[styles.fieldValue, { color: colors.text, marginLeft: field.icon ? 6 : 0 }]}>
                        {field.value}
                      </Text>
                    </View>
                  </View>
                ) : null)}
              </Card>
            </View>
          ))}

          {/* Document Management Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accentGreen + '25' }]}>
                <FileText size={20} color={colors.accentGreen} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Tài liệu & Blockchain</Text>
            </View>
            <DocumentManager 
               project={fullData} 
               initialDocuments={documents} 
               onRefresh={fetchFullDetails} 
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {fullData.status === 'Draft' && (
             <Button 
               title="Nộp dự án" 
               onPress={handleSubmitProject} 
               loading={isSubmitting}
               style={styles.footerBtn}
               icon={<Send size={18} color="#fff" />}
             />
          )}
          {(fullData.status === 'Draft' || fullData.status === 'Rejected') && (
            <Button 
              title="Chỉnh sửa" 
              secondary
              onPress={() => {
                onClose();
                onEdit(fullData);
              }}
              style={[styles.footerBtn, { marginLeft: fullData.status === 'Draft' ? 12 : 0 }]}
            />
          )}
          {fullData.status !== 'Draft' && fullData.status !== 'Rejected' && (
            <Button 
              title="Đóng chi tiết" 
              secondary 
              onPress={onClose} 
              style={styles.footerBtn} 
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerInfo: { flex: 1, gap: 8 },
  projectTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  closeBtn: { padding: 8, borderRadius: 24, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingTop: 20 },
  rejectionCard: { margin: 20, padding: 16, marginBottom: 8, borderWidth: 1, backgroundColor: '#fef2f220', borderRadius: 16 },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  rejectionTitle: { fontSize: 15, fontWeight: '800' },
  rejectionText: { fontSize: 14, lineHeight: 22 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  sectionCard: { padding: 0, overflow: 'hidden', borderRadius: 24, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)' },
  field: { padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  noBorder: { borderBottomWidth: 0 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#71767b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldValueRow: { flexDirection: 'row', alignItems: 'center' },
  fieldValue: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  footer: { flexDirection: 'row', padding: 20, paddingBottom: 34, borderTopWidth: 1 },
  footerBtn: { flex: 1, height: 54, borderRadius: 16 },
});
