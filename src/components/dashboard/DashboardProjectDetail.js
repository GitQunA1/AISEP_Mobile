import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Dimensions,
  Animated, Image
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import {
  X, AlertCircle, FileText, TrendingUp, Users, Shield,
  Target, Lightbulb, Briefcase, Zap, CheckCircle, ChevronRight, Upload, Send
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';
import DocumentManager from './DocumentManager';
import Button from '../Button';
import Card from '../Card';
import projectSubmissionService from '../../services/projectSubmissionService';
import advisorService from '../../services/advisorService';
import AdvisorBookingModal from '../AdvisorBookingModal';
import AIEvaluationModal from '../common/AIEvaluationModal';
import QuotaGuardModal from '../common/QuotaGuardModal';

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

const parseTeamMembers = (text) => {
  if (!text) return [];
  const members = text.split(/[\n,]+/).map(m => m.trim()).filter(Boolean);
  return members.map(m => {
    const match = m.match(/^(.*?)\s*\((.*?)\)$/) || m.match(/^(.*?)\s*-\s*(.*?)$/);
    if (match) {
      return { name: match[1].trim(), role: match[2].trim() };
    }
    return { name: m, role: 'Thành viên' };
  });
};

export default function DashboardProjectDetail({ visible, project, onClose, onRefresh, onEdit }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();
  const { isPremium, quota, refreshSubscription } = useSubscription();

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [isProtecting, setIsProtecting] = useState(false);

  const [fullData, setFullData] = useState(project);
  const [documents, setDocuments] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [assignedAdvisor, setAssignedAdvisor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAIResultModal, setShowAIResultModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

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
        console.log('No AI analysis found');
        setAiAnalysis(null);
      }

      // 3. Fetch Advisor Info if assigned
      const advisorId = fullData.assignedAdvisorId || project.assignedAdvisorId;
      if (advisorId) {
        try {
          const advData = await advisorService.getAdvisorById(advisorId);
          if (advData) {
            setAssignedAdvisor(advData);
          }
        } catch (advErr) {
          console.log('Error fetching advisor:', advErr);
        }
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
    if (!isPremium) {
      Alert.alert(
        'Tính năng Premium',
        'Bạn cần nâng cấp gói dịch vụ để thực hiện phân tích AI cho dự án này.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Nâng cấp ngay', onPress: () => { onClose(); router.push('/subscription/management'); } }
        ]
      );
      return;
    }
    setShowQuotaModal(true);
  };

  const handleConfirmAIAnalysis = async () => {
    setShowQuotaModal(false);
    setIsEvaluatingAI(true);
    try {
      const res = await projectSubmissionService.triggerAIAnalysis(project.id || project.projectId);
      if (res?.success || res?.isSuccess) {
        Alert.alert('Thành công', 'Đang tiến hành đánh giá AI. Kết quả sẽ được cập nhật sau vài giây.');
        refreshSubscription();

        // Wait a bit and fetch results
        setTimeout(async () => {
          await fetchFullDetails();
          // If we have new results, show them
          if (aiAnalysis) setShowAIResultModal(true);
        }, 2000);
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
        { label: 'Thành viên & Vai trò', value: fullData.teamMembers || fullData.teamRoles, isTeam: true },
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
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text allowFontScaling={false} style={[styles.projectTitle, { color: colors.text }]} numberOfLines={1}>
                {fullData.projectName || fullData.name}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Text allowFontScaling={false} style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              </View>
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
          {(!fullData.projectImageUrl && fullData.status !== 'Rejected') && <View style={{ height: 20 }} />}
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

          {/* Hero Section if image exists */}
          {fullData.projectImageUrl && (
            <View style={styles.heroContainer}>
              <Image
                source={{ uri: fullData.projectImageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.2)']}
                style={styles.heroOverlay}
              />
            </View>
          )}

          {/* AI Evaluation History (Score Chips) */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconContainer, { backgroundColor: '#F5A62325' }]}>
                <Zap size={20} color="#F5A623" fill={aiAnalysis ? "#F5A623" : "transparent"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Đánh giá tiềm năng</Text>
                <Text style={{ fontSize: 11, color: colors.secondaryText, fontWeight: '600' }}>Cung cấp bởi AISEP AI</Text>
              </View>
              {fullData.status === 'Draft' && (
                <TouchableOpacity
                  onPress={handleAIEvaluation}
                  disabled={isEvaluatingAI}
                  style={[styles.smallActionBtn, { backgroundColor: colors.primary }]}
                >
                  {isEvaluatingAI ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.smallActionBtnText}>{aiAnalysis ? 'Phân tích lại' : 'Phân tích ngay'}</Text>}
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (aiAnalysis) {
                  setShowAIResultModal(true);
                }
              }}
            >
              <Card style={[styles.sectionCard, { padding: 16, backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.05)' : colors.card, borderColor: activeTheme.isDark ? colors.primary + '20' : colors.border + '40' }]}>
                {aiAnalysis ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={[styles.scoreCircle, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                      <Text style={[styles.scoreValue, { color: colors.primary }]}>{aiAnalysis.potentialScore || aiAnalysis.score}</Text>
                      <Text style={[styles.scoreMax, { color: colors.secondaryText }]}>/100</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.aiSummaryTitle, { color: colors.text }]}>Dự án có tiềm năng cao</Text>
                      <Text style={[styles.aiSummaryText, { color: colors.secondaryText }]} numberOfLines={2}>
                        Bản phân tích gần nhất: {new Date(aiAnalysis.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.border} />
                  </View>
                ) : (
                  <Text style={{ color: colors.secondaryText, fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
                    Dự án này chưa có bản phân tích tiềm năng nào.
                  </Text>
                )}
              </Card>
            </TouchableOpacity>
          </View>

          {/* Assigned Advisor Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconContainer, { backgroundColor: '#10b98125' }]}>
                <Users size={20} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Cố vấn được phân công</Text>
                <Text style={{ fontSize: 11, color: colors.secondaryText, fontWeight: '600' }}>Hỗ trợ chuyên môn trực tiếp</Text>
              </View>
              {fullData.status === 'Draft' && assignedAdvisor && (
                <TouchableOpacity
                  onPress={() => setShowBookingModal(true)}
                  style={[styles.smallActionBtn, { backgroundColor: '#10b981' }]}
                >
                  <Text style={styles.smallActionBtnText}>Đặt lịch ngay</Text>
                </TouchableOpacity>
              )}
            </View>
            <Card style={[styles.sectionCard, { padding: 16, backgroundColor: activeTheme.isDark ? 'rgba(255,255,255,0.05)' : colors.card, borderColor: activeTheme.isDark ? colors.primary + '20' : colors.border + '40' }]}>
              {assignedAdvisor ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.miniAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.miniAvatarText}>{(assignedAdvisor.userName || 'A').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.advisorName, { color: colors.text }]}>{assignedAdvisor.userName}</Text>
                    <Text style={[styles.advisorExpertise, { color: colors.secondaryText }]}>{assignedAdvisor.expertise || 'Chuyên gia cố vấn'}</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ color: colors.secondaryText, fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
                  Dự án đang trong quá trình phân công cố vấn phù hợp.
                </Text>
              )}
            </Card>
          </View>

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
                  <View key={fidx} style={[styles.field, fidx === section.fields.length - 1 && styles.noBorder, { borderBottomColor: colors.border + '30' }]}>
                    <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{field.label}</Text>
                    {field.isTeam ? (
                      <View style={styles.teamGrid}>
                        {parseTeamMembers(field.value).map((member, idx) => (
                          <View key={idx} style={[styles.teamMemberCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <View style={[styles.teamMemberAvatar, { backgroundColor: colors.accentPurple + '20' }]}>
                              <Users size={16} color={colors.accentPurple} />
                            </View>
                            <View style={styles.teamMemberInfo}>
                              <Text style={[styles.teamMemberName, { color: colors.text }]} numberOfLines={1}>{member.name}</Text>
                              <Text style={[styles.teamMemberRole, { color: colors.secondaryText }]} numberOfLines={1}>{member.role}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.fieldValueRow}>
                        {field.icon}
                        <Text style={[styles.fieldValue, { color: colors.text, marginLeft: field.icon ? 6 : 0 }]}>
                          {field.value}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null)}
              </Card>
            </View>
          ))}

          {/* Project Image Detail View (if no hero) */}
          {!fullData.projectImageUrl && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '25' }]}>
                  <Zap size={20} color={colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Hình ảnh dự án</Text>
              </View>
              <Card style={[styles.sectionCard, { padding: 0, overflow: 'hidden', height: 200 }]}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <FileText size={40} color={colors.secondaryText} opacity={0.3} />
                  <Text style={{ color: colors.secondaryText, fontSize: 14 }}>Chưa có hình ảnh mô tả</Text>
                </View>
              </Card>
            </View>
          )}

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
        <View style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom || 12
          }
        ]}>
          {fullData.status === 'Draft' && (
            <>
              <Button
                title={isSubmitting ? "Đang nộp..." : "Nộp dự án"}
                onPress={handleSubmitProject}
                loading={isSubmitting}
                style={styles.footerBtn}
              />
              <View style={{ width: 12 }} />
              <Button
                title="Chỉnh sửa"
                variant="outline"
                onPress={() => { onClose(); onEdit?.(fullData); }}
                style={styles.footerBtn}
              />
            </>
          )}
          {fullData.status === 'Rejected' && (
            <Button
              title="Chỉnh sửa lại dự án"
              onPress={() => { onClose(); onEdit?.(fullData); }}
              style={styles.footerBtn}
            />
          )}
          {fullData.status !== 'Draft' && fullData.status !== 'Rejected' && (
            <Button
              title="Đóng chi tiết"
              variant="secondary"
              onPress={onClose}
              style={styles.footerBtn}
            />
          )}
        </View>
      </SafeAreaView>

      <AdvisorBookingModal
        isVisible={showBookingModal}
        advisor={assignedAdvisor}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => {
          Alert.alert('Thành công', 'Yêu cầu tư vấn của bạn đã được gửi đi.');
          setShowBookingModal(false);
        }}
      />

      <QuotaGuardModal
        visible={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        onConfirm={handleConfirmAIAnalysis}
        type="ai"
        projectName={fullData.projectName || fullData.name}
        isProcessing={isEvaluatingAI}
        remaining={quota.remainingAiRequests}
        packageName={quota.packageName}
      />

      <AIEvaluationModal
        visible={showAIResultModal}
        onClose={() => setShowAIResultModal(false)}
        data={aiAnalysis}
        projectName={fullData.projectName || fullData.name}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerInfo: { flex: 1 },
  projectTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, maxWidth: '65%' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  closeBtn: { padding: 8, borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  rejectionCard: { margin: 20, padding: 16, marginBottom: 8, borderWidth: 1, backgroundColor: '#fef2f220', borderRadius: 16 },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  rejectionTitle: { fontSize: 15, fontWeight: '800' },
  rejectionText: { fontSize: 14, lineHeight: 22 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  sectionCard: { padding: 0, overflow: 'hidden', borderRadius: 24, borderWidth: 1, backgroundColor: 'transparent' },
  field: { padding: 18, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#71767b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldValueRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  fieldValue: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  teamGrid: { marginTop: 8, gap: 8 },
  teamMemberCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  teamMemberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  teamMemberInfo: { flex: 1 },
  teamMemberName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  teamMemberRole: { fontSize: 12, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  footerBtn: { flex: 1, height: 50, borderRadius: 14 },
  heroContainer: { height: 240, width: '100%', position: 'relative', marginBottom: 24 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 40 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  heroStatus: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  smallActionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  smallActionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  scoreValue: { fontSize: 22, fontWeight: '900' },
  scoreMax: { fontSize: 10, fontWeight: '700', marginTop: -2 },
  aiSummaryTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  aiSummaryText: { fontSize: 13, lineHeight: 18 },
  miniAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  advisorName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  advisorExpertise: { fontSize: 13, fontWeight: '600' },
});
