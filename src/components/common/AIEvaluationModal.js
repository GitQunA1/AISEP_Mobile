import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, ScrollView, 
  TouchableOpacity, Dimensions, ActivityIndicator, Platform 
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { 
  TrendingUp, Sparkles, X, Brain, CheckCircle, 
  AlertCircle, AlertTriangle, BarChart3, ChevronDown, 
  ChevronRight, Lightbulb, Info
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import FadeInView from '../FadeInView';
import AIAnalysisRadarChart from './AIAnalysisRadarChart';

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
  const insets = useSafeAreaInsets();
  const [expandedSections, setExpandedSections] = useState({});

  if (!visible) return null;

  // Extract analysis data (Normalized format)
  const analysis = data?.analysis || {};
  const auditedItems = analysis.auditedItems || data?.auditedItems || [];
  
  // Overall scores
  const totalBaseScore = analysis.totalBaseScore || data?.baseScore || 0;
  const adjustmentScore = analysis.totalAIAdjustmentScore || data?.aiAdjustmentScore || 0;
  const finalScore = analysis.totalFinalScore || data?.finalPotentialScore || data?.potentialScore || 0;
  
  // Extract key points from nested analysis
  const strengths = analysis.strengths || data?.strengths || [];
  const weaknesses = analysis.weaknesses || data?.weaknesses || [];
  const summary = analysis.summary || data?.summary || '';
  const recommendations = analysis.advice || analysis.recommendations || data?.recommendations || [];

  const toggleSection = (key) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const translateKey = (k) => {
    const map = {
      team: 'Đội ngũ',
      market: 'Thị trường',
      product: 'Sản phẩm',
      competition: 'Cạnh tranh',
      traction: 'Tình trạng kinh doanh',
      investmentneed: 'Nhu cầu đầu tư & Runway',
      opportunity: 'Cơ hội thị trường',
      financials: 'Tài chính',
      strategy: 'Chiến lược',
      execution: 'Thực thi',
      marketing: 'Tiếp thị',
      growth: 'Tăng trưởng',
      risk: 'Rủi ro',
      investment: 'Huy động vốn',
      marketsize: 'Quy mô thị trường',
      revenue: 'Doanh thu',
      businessmodel: 'Mô hình kinh doanh',
    };
    const lower = String(k || '').toLowerCase().replace(/\s+/g, '');
    return map[lower] || k;
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
        {/* Overall Score Summary (Vertical List for better readability) */}
        <View style={styles.verticalSummaryContainer}>
          <View style={[styles.verticalSummaryItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
            <View style={[styles.verticalSummaryIcon, { backgroundColor: colors.border + '20' }]}>
              <BarChart3 size={18} color={colors.secondaryText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verticalSummaryLabel, { color: colors.secondaryText }]}>ĐIỂM FORM TỰ ĐÁNH GIÁ</Text>
              <Text style={[styles.verticalSummaryValue, { color: colors.text }]}>{totalBaseScore.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={[styles.verticalSummaryItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: '#f59e0b40' }]}>
            <View style={[styles.verticalSummaryIcon, { backgroundColor: '#f59e0b15' }]}>
              <TrendingUp size={18} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verticalSummaryLabel, { color: '#f59e0b' }]}>AI HIỆU CHỈNH</Text>
              <Text style={[styles.verticalSummaryValue, { color: '#f59e0b' }]}>{adjustmentScore > 0 ? `+${adjustmentScore.toFixed(2)}` : adjustmentScore.toFixed(2)}</Text>
            </View>
          </View>

          <View style={[styles.verticalSummaryItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: '#10b98140' }]}>
            <View style={[styles.verticalSummaryIcon, { backgroundColor: '#10b98115' }]}>
              <CheckCircle size={18} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verticalSummaryLabel, { color: '#10b981' }]}>ĐIỂM AI PHÊ DUYỆT</Text>
              <Text style={[styles.verticalSummaryValue, { color: '#10b981' }]}>{finalScore.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Radar Chart (Matrix Graph) */}
        {auditedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ma trận đánh giá (Khai báo vs AI)</Text>
            </View>
            <AIAnalysisRadarChart auditedItems={auditedItems} labelMapper={translateKey} />
          </View>
        )}

        {/* Expandable Details */}
        {(auditedItems.length > 0 || Object.keys(analysis).length > 0) && (
          <View style={styles.section}>
             <View style={styles.sectionHeader}>
              <Info size={18} color={colors.accentCyan} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi tiết các hạng mục</Text>
            </View>
            {/* New Array Structure */}
            {auditedItems.length > 0 ? (
              auditedItems.map((item, idx) => {
                const isExpanded = expandedSections[`item-${idx}`];
                return (
                  <TouchableOpacity 
                    key={idx} 
                    activeOpacity={0.7}
                    onPress={() => toggleSection(`item-${idx}`)}
                    style={[styles.analysisItem, { borderColor: colors.border, backgroundColor: colors.card }]}
                  >
                    <View style={styles.analysisHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.analysisTitleRow}>
                          {isExpanded ? <ChevronDown size={18} color={colors.primary} /> : <ChevronRight size={18} color={colors.secondaryText} />}
                          <Text style={[styles.analysisTitle, { color: colors.text }]}>{translateKey(item.criteria || item.title || 'Hạng mục')}</Text>
                        </View>
                        <View style={[styles.categoryScoreBadge, { backgroundColor: colors.primary + '10', marginTop: 8 }]}>
                           <Text style={[styles.categoryScoreText, { color: colors.primary }]}>
                             Cuối: {(() => {
                               const val = item.finalScore ?? item.FinalScore ?? item.score;
                               return (val !== undefined && val !== null) ? Number(val).toFixed(2) : '—';
                             })()} / Max {item.maxScore || item.MaxScore || '?'}
                           </Text>
                        </View>
                      </View>
                    </View>
                    
                    {isExpanded && (
                      <View style={styles.analysisDetails}>
                        <View style={styles.scoreDetailRow}>
                          <Text style={[styles.scoreDetailText, { color: colors.text }]}>
                            <Text style={{ color: colors.secondaryText, fontWeight: '600' }}>Gốc: </Text>
                            <Text style={{ fontWeight: '800' }}>{item.baseScore?.toFixed(2) || item.BaseScore?.toFixed(2) || '0'}</Text>
                            <Text style={{ color: colors.border }}>  •  </Text>
                            <Text style={{ color: '#f59e0b', fontWeight: '600' }}>Điều chỉnh: </Text>
                            <Text style={{ color: '#f59e0b', fontWeight: '800' }}>{item.adjustment > 0 ? `+${item.adjustment.toFixed(2)}` : (item.adjustment?.toFixed(2) || item.Adjustment?.toFixed(2) || '0')}</Text>
                          </Text>
                        </View>

                        {item.finding && (
                          <View style={[styles.findingBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fcfcfc', borderColor: colors.border + '50' }]}>
                             <Text style={[styles.detailValue, { color: colors.text, fontSize: 13, lineHeight: 22 }]}>{item.finding}</Text>
                          </View>
                        )}
                        
                        {(item.reason || item.reasoning) && (
                          <View style={styles.detailBlock}>
                            <Text style={[styles.detailLabel, { color: colors.secondaryText }]}>Giải thích AI:</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{item.reason || item.reasoning}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              /* Fallback for Legacy Object Structure */
              Object.entries(analysis).map(([key, section]) => {
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
              })
            )}
          </View>
        )}

        {/* Summary Box (Moved below details like Web) */}
        {summary ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Brain size={18} color="#8b5cf6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Kết luận & Tóm tắt</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderLeftColor: '#8b5cf6' }]}>
              <Text style={[styles.summaryText, { color: colors.text }]}>{summary}</Text>
            </View>
          </View>
        ) : null}

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
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent={true}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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

        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.footerButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.footerButtonText}>Đã hiểu</Text>
          </TouchableOpacity>
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
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 6, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 10
  },
  scoreValue: { fontSize: 24, fontWeight: '900' },
  scoreMax: { fontSize: 12, fontWeight: '700', marginTop: -2 },
  scoreMeta: { flex: 1 },
  projectName: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  
  summaryContainer: { 
    gap: 12, 
    marginBottom: 25 
  },
  verticalSummaryContainer: { gap: 10, marginBottom: 25 },
  verticalSummaryItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    gap: 12 
  },
  verticalSummaryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  verticalSummaryLabel: { fontSize: 10, fontWeight: '800', marginBottom: 2 },
  verticalSummaryValue: { fontSize: 18, fontWeight: '900' },

  summaryBox: { 
    flex: 1, 
    padding: 8, 
    borderRadius: 16, 
    borderWidth: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70
  },
  summaryLabel: { 
    fontSize: 8, 
    fontWeight: '800', 
    textAlign: 'center', 
    marginBottom: 4,
    lineHeight: 11
  },
  summaryValue: { 
    fontSize: 16, 
    fontWeight: '900' 
  },

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
  analysisHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  analysisTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  analysisTitle: { fontSize: 15, fontWeight: '700' },
  categoryScoreBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    alignSelf: 'flex-start'
  },
  categoryScoreText: { fontSize: 11, fontWeight: '800' },
  analysisDetails: { marginTop: 12, paddingLeft: 0, gap: 12 },
  scoreDetailRow: { marginBottom: 4, paddingHorizontal: 12 },
  scoreDetailText: { fontSize: 13 },
  findingBox: { 
    padding: 16, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderStyle: 'dashed',
    marginHorizontal: 4
  },
  detailBlock: { gap: 4, paddingHorizontal: 12 },
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
