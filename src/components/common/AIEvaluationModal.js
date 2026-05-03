import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, ScrollView, 
  TouchableOpacity, Dimensions, ActivityIndicator 
} from 'react-native';
import { 
  TrendingUp, Sparkles, X, Brain, CheckCircle, 
  AlertCircle, AlertTriangle, BarChart3, ChevronDown, 
  ChevronRight, Lightbulb, Info
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AIEvaluationModal({ 
  visible, 
  onClose, 
  data, 
  projectName, 
  isLoading = false,
  error = null
}) {
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  const [expandedSections, setExpandedSections] = useState({});

  if (!visible) return null;

  // Extract analysis data
  const analysis = data?.analysis || {};
  const scoreBreakdown = data?.scoreBreakdown || [];
  const potentialScore = data?.potentialScore || data?.startupPotentialScore || 0;
  const chaosScore = data?.chaosScore || 0;
  const strengths = data?.strengths || [];
  const weaknesses = data?.weaknesses || [];
  const summary = data?.summary || '';
  const recommendations = data?.recommendations || [];

  const toggleSection = (key) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const translateKey = (k) => {
    const map = {
      'team': 'Đội ngũ',
      'opportunity': 'Thị trường',
      'product': 'Sản phẩm',
      'market': 'Thị trường',
      'competition': 'Cạnh tranh',
      'financials': 'Tài chính',
      'strategy': 'Chiến lược',
      'execution': 'Thực thi',
      'growth': 'Tăng trưởng',
      'risk': 'Rủi ro',
      'investment': 'Huy động vốn'
    };
    return map[k.toLowerCase()] || k.charAt(0).toUpperCase() + k.slice(1);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>AI Analyst đang làm việc...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Overall Score */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
            <Text style={[styles.scoreValue, { color: colors.text }]}>{potentialScore}</Text>
            <Text style={[styles.scoreMax, { color: colors.secondaryText }]}>/100</Text>
          </View>
          <View style={styles.scoreMeta}>
            <Text style={[styles.projectName, { color: colors.text }]}>{projectName}</Text>
            <Text style={{ fontSize: 13, color: colors.secondaryText, fontWeight: '600' }}>Phân tích bởi AISEP AI</Text>
          </View>
        </View>

        {/* Score Breakdown Bars */}
        {scoreBreakdown.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Cấu trúc điểm số</Text>
            </View>
            <Card style={styles.breakdownCard}>
              {scoreBreakdown.map((item, idx) => (
                <View key={idx} style={styles.breakdownItem}>
                  <View style={styles.breakdownInfo}>
                    <Text style={[styles.componentName, { color: colors.secondaryText }]}>{item.component}</Text>
                    <Text style={[styles.componentScore, { color: colors.primary }]}>{item.score?.toFixed(1)}</Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.mutedBackground }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          backgroundColor: colors.primary, 
                          width: `${((item.score || 0) / 1.5) * 100}%` 
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Summary Box */}
        {summary ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Brain size={18} color="#8b5cf6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Phân tích tổng quan</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderLeftColor: '#8b5cf6' }]}>
              <Text style={[styles.summaryText, { color: colors.text }]}>{summary}</Text>
            </View>
          </View>
        ) : null}

        {/* Expandable Details */}
        {Object.keys(analysis).length > 0 && (
          <View style={styles.section}>
             <View style={styles.sectionHeader}>
              <Info size={18} color={colors.accentCyan} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi tiết các hạng mục</Text>
            </View>
            {Object.entries(analysis).map(([key, section]) => {
              if (!section || typeof section !== 'object' || section.score === undefined) return null;
              const isExpanded = expandedSections[key];
              return (
                <TouchableOpacity 
                  key={key} 
                  activeOpacity={0.7}
                  onPress={() => toggleSection(key)}
                  style={[styles.analysisItem, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <View style={styles.analysisHeader}>
                    <View style={styles.analysisTitleRow}>
                      {isExpanded ? <ChevronDown size={18} color={colors.primary} /> : <ChevronRight size={18} color={colors.secondaryText} />}
                      <Text style={[styles.analysisTitle, { color: colors.text }]}>{translateKey(key)}</Text>
                    </View>
                    <Text style={[styles.analysisScore, { color: colors.primary }]}>{section.score?.toFixed(1)}</Text>
                  </View>
                  
                  {isExpanded && (
                    <View style={styles.analysisDetails}>
                      {section.reason && (
                        <View style={styles.detailBlock}>
                          <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Lý do:</Text>
                          <Text style={[styles.detailValue, { color: colors.text }]}>{section.reason}</Text>
                        </View>
                      )}
                      {section.evidence?.length > 0 && (
                        <View style={styles.detailBlock}>
                          <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Bằng chứng:</Text>
                          {section.evidence.map((e, i) => (
                            <Text key={i} style={[styles.detailValue, { color: colors.text }]}>• {e}</Text>
                          ))}
                        </View>
                      )}
                      {section.missingData?.length > 0 && (
                        <View style={styles.detailBlock}>
                          <Text style={[styles.detailLabel, { color: '#ef4444' }]}>Dữ liệu thiếu:</Text>
                          {section.missingData.map((m, i) => (
                            <Text key={i} style={[styles.detailValue, { color: colors.secondaryText }]}>⚠ {m}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Highlights (Strengths/Weaknesses) */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={18} color="#eab308" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ưu điểm & Thách thức</Text>
            </View>
            <View style={styles.highlightsContainer}>
              {strengths.length > 0 && (
                <View style={[styles.highlightCard, { backgroundColor: '#10b98110', borderColor: '#10b98120' }]}>
                  <View style={styles.highlightTitleRow}>
                    <CheckCircle size={16} color="#10b981" />
                    <Text style={[styles.highlightTitle, { color: '#10b981' }]}>Điểm mạnh</Text>
                  </View>
                  {strengths.map((s, i) => (
                    <Text key={i} style={[styles.highlightText, { color: colors.text }]}>✓ {s}</Text>
                  ))}
                </View>
              )}
              {weaknesses.length > 0 && (
                <View style={[styles.highlightCard, { backgroundColor: '#ef444410', borderColor: '#ef444420', marginTop: 12 }]}>
                  <View style={styles.highlightTitleRow}>
                    <AlertCircle size={16} color="#ef4444" />
                    <Text style={[styles.highlightTitle, { color: '#ef4444' }]}>Thách thức</Text>
                  </View>
                  {weaknesses.map((w, i) => (
                    <Text key={i} style={[styles.highlightText, { color: colors.text }]}>⚠ {w}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Khuyến nghị hành động</Text>
            </View>
            <Card style={styles.recommendationCard}>
              {recommendations.map((rec, i) => (
                <View key={i} style={styles.recommendationItem}>
                  <TrendingUp size={14} color={colors.primary} style={{ marginTop: 3 }} />
                  <Text style={[styles.recommendationText, { color: colors.text }]}>{rec}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={24} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Kết Quả Đánh Giá AI</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {renderContent()}

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.footerButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.footerButtonText}>Đã hiểu</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 12, 
    borderBottomWidth: 1 
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 15, fontSize: 16, fontWeight: '600' },
  errorText: { marginTop: 15, fontSize: 16, textAlign: 'center', marginBottom: 20 },
  closeButton: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  closeButtonText: { color: '#fff', fontWeight: '800' },
  
  scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 25 },
  scoreCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    borderWidth: 6, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scoreValue: { fontSize: 32, fontWeight: '900' },
  scoreMax: { fontSize: 12, fontWeight: '700', marginTop: -2 },
  scoreMeta: { flex: 1 },
  projectName: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  riskBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#f59e0b15', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  riskText: { fontSize: 12, color: '#f59e0b', fontWeight: '700' },

  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  breakdownCard: { padding: 16, gap: 12 },
  breakdownItem: { gap: 6 },
  breakdownInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  componentName: { fontSize: 13, fontWeight: '600' },
  componentScore: { fontSize: 14, fontWeight: '800' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  summaryBox: { padding: 16, borderRadius: 16, borderLeftWidth: 4 },
  summaryText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  analysisItem: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 10 },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  analysisTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  analysisTitle: { fontSize: 14, fontWeight: '700' },
  analysisScore: { fontSize: 14, fontWeight: '800' },
  analysisDetails: { marginTop: 12, paddingLeft: 26, gap: 12 },
  detailBlock: { gap: 4 },
  detailLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { fontSize: 13, lineHeight: 18 },

  highlightsContainer: { gap: 12 },
  highlightCard: { padding: 15, borderRadius: 16, borderWidth: 1 },
  highlightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  highlightTitle: { fontSize: 14, fontWeight: '800' },
  highlightText: { fontSize: 13, lineHeight: 20, marginBottom: 4 },

  recommendationCard: { padding: 16, gap: 12 },
  recommendationItem: { flexDirection: 'row', gap: 10 },
  recommendationText: { flex: 1, fontSize: 13, lineHeight: 20 },

  footer: { padding: 20, paddingBottom: 20, borderTopWidth: 1 },
  footerButton: { height: 55, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  footerButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
