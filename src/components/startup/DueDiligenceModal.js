import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Dimensions, TextInput, KeyboardAvoidingView
} from 'react-native';
import { X, FileText, Check, ChevronRight, Info, Download, Sparkles, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../context/ThemeContext';
import projectSubmissionService from '../../services/projectSubmissionService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DueDiligenceModal({ visible, onClose, project, onSuccess }) {
  const { activeTheme, isDark } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState('select'); // 'select' or 'fill'
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setStep('select');
      setAnswers({});
      fetchTemplates();
    }
  }, [visible]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await projectSubmissionService.getDueDiligenceTemplates();
      // res is response.data from apiClient
      const data = res?.data || (res?.success === undefined ? res : null);
      
      if (data) {
        const rawItems = Array.isArray(data) ? data : [data];
        
        // Process items to handle contentJson
        const processedItems = rawItems.map(item => {
          if (item?.contentJson) {
            try {
              const parsed = JSON.parse(item.contentJson);
              return { ...item, ...parsed };
            } catch (e) {
              console.error('Error parsing contentJson:', e);
              return item;
            }
          }
          return item;
        });

        setTemplates(processedItems);
        if (processedItems.length > 0) {
          setSelectedTemplate(processedItems[0]);
        }
      } else {
        setError('Không thể tải mẫu báo cáo.');
      }
    } catch (err) {
      console.error('Fetch templates error:', err);
      setError('Đã xảy ra lỗi khi tải mẫu báo cáo.');
    } finally {
      setIsLoading(false);
    }
  };

  const sections = useMemo(() => {
    // Look for sections in all possible locations
    let s = selectedTemplate?.sections || 
            selectedTemplate?.Sections || 
            selectedTemplate?.data?.sections || 
            selectedTemplate?.data?.Sections;
    
    // If we still don't have it, and the template itself is an array, maybe that's it
    if (!s && Array.isArray(selectedTemplate)) {
      s = selectedTemplate;
    }
    
    // If still nothing, maybe it's nested in a 'template' property
    if (!s && selectedTemplate?.template) {
      s = selectedTemplate.template.sections || selectedTemplate.template.Sections;
    }

    if (!Array.isArray(s)) return [];
    
    // Normalize sections to ensure they have items/questions
    return s.map((section, idx) => ({
      ...section,
      key: section.key || section.Key || `section-${idx}`,
      title: section.title || section.Title || `Phần ${idx + 1}`,
      items: section.items || section.Items || section.questions || section.Questions || []
    }));
  }, [selectedTemplate]);

  const handleNext = () => {
    if (!selectedTemplate) return;
    setStep('fill');
  };

  const handleBack = () => {
    setStep('select');
  };

  const handleAnswerChange = (key, text) => {
    setAnswers(prev => ({ ...prev, [key]: text }));
  };

  const generateHtml = () => {
    const dateStr = new Date().toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

    let contentHtml = '';
    sections.forEach((section) => {
      contentHtml += `<h2 style="color: #1d4ed8; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px;">${section.title}</h2>`;
      (Array.isArray(section.items) ? section.items : []).forEach((item, idx) => {
        const key = item.key || `${section.key}-${idx}`;
        const ans = String(answers[key] || '').trim();
        contentHtml += `
          <div style="margin-bottom: 16px;">
            <h3 style="margin-bottom: 4px; font-size: 16px;">${item.title}</h3>
            ${Array.isArray(item.bullets) ? `<ul style="color: #4b5563; font-size: 13px; margin-top: 0;">${item.bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
            <div style="background-color: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #f3f4f6; margin-top: 8px;">
              <p style="font-weight: bold; font-size: 12px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Nội dung startup cung cấp:</p>
              <p style="white-space: pre-wrap; font-size: 14px;">${ans || '—'}</p>
            </div>
          </div>
        `;
      });
    });

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #111827; line-height: 1.5; }
            h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .meta { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
          </style>
        </head>
        <body>
          <h1>${selectedTemplate?.documentTitle || 'BÁO CÁO THẨM ĐỊNH CHI TIẾT'}</h1>
          <div class="meta">
            <p>Dự án: <strong>${project?.name || 'N/A'}</strong></p>
            <p>Thời gian tạo: ${dateStr}</p>
          </div>
          ${selectedTemplate?.note ? `<div style="background-color: #eff6ff; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #1e40af;">${selectedTemplate.note}</div>` : ''}
          ${contentHtml}
        </body>
      </html>
    `;
  };

  const handleGenerate = async () => {
    const hasAnyAnswer = Object.values(answers).some((value) => String(value || '').trim().length > 0);
    if (!hasAnyAnswer) {
      Alert.alert('Thông báo', 'Vui lòng nhập ít nhất 1 nội dung trước khi xuất PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      const html = generateHtml();
      const { uri } = await Print.printToFileAsync({ html });
      
      // Auto-upload to project documents (Match Web behavior)
      const filename = `DueDiligence_${project?.name || 'Project'}_${Date.now()}.pdf`;
      const file = {
        uri: uri,
        name: filename,
        type: 'application/pdf',
      };

      const targetProjectId = project.projectId || project.id || project.ProjectId;

      try {
        await projectSubmissionService.uploadDocument(targetProjectId, file, 'BusinessPlan');
        
        Alert.alert(
          'Thành công', 
          'Báo cáo đã được tạo và tự động tải lên danh sách tài liệu của dự án.',
          [{ 
            text: 'OK', 
            onPress: () => {
              onSuccess?.();
              onClose();
            } 
          }]
        );
      } catch (uploadErr) {
        // Still allow sharing even if upload fails
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(uri);
        } else {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Tải báo cáo Due Diligence' });
        }
        onClose();
      }
    } catch (err) {
      console.error('PDF Generation error:', err);
      Alert.alert('Lỗi', 'Không thể tạo báo cáo PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSelectStep = () => (
    <>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Info size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Hệ thống sẽ trích xuất dữ liệu từ dự án <Text style={{ fontWeight: '700' }}>{project?.name}</Text> để hỗ trợ tạo báo cáo thẩm định.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Chọn mẫu báo cáo</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : error ? (
          <Text style={{ color: colors.error, textAlign: 'center', marginTop: 20 }}>{error}</Text>
        ) : (
          templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateItem,
                { 
                  backgroundColor: colors.card,
                  borderColor: (selectedTemplate?.id || selectedTemplate?.Id) === (template.id || template.Id) ? colors.primary : colors.border,
                  borderWidth: (selectedTemplate?.id || selectedTemplate?.Id) === (template.id || template.Id) ? 2 : 1
                }
              ]}
              onPress={() => setSelectedTemplate(template)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.templateName, { color: colors.text }]}>{template.name || 'Mẫu báo cáo tiêu chuẩn'}</Text>
                <Text style={[styles.templateDesc, { color: colors.secondaryText }]} numberOfLines={2}>
                  {template.description || 'Báo cáo đầy đủ các khía cạnh tài chính, kỹ thuật và thị trường.'}
                </Text>
              </View>
              {(selectedTemplate?.id || selectedTemplate?.Id) === (template.id || template.Id) ? (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Check size={14} color="#fff" />
                </View>
              ) : (
                <ChevronRight size={20} color={colors.secondaryText} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[
            styles.generateBtn,
            { backgroundColor: selectedTemplate ? colors.primary : colors.border }
          ]}
          disabled={!selectedTemplate}
          onPress={handleNext}
        >
          <Text style={styles.generateBtnText}>Tiếp tục</Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFillStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
    >
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {selectedTemplate?.note ? (
          <View style={[styles.noteBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.text }]}>{selectedTemplate.note}</Text>
          </View>
        ) : null}

        {sections.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.secondaryText, textAlign: 'center' }}>
              Đang chuẩn bị dữ liệu biểu mẫu...
            </Text>
          </View>
        ) : (
          sections.map((section, secIdx) => (
            <View key={section.key || section.Key || secIdx} style={styles.sectionGroup}>
              <View style={[styles.sectionHeader, { borderLeftColor: colors.primary }]}>
                <Text style={[styles.sectionHeaderText, { color: colors.text }]}>{section.title}</Text>
              </View>
              
              {(Array.isArray(section.items) ? section.items : []).map((item, idx) => {
                const key = item.key || item.Key || `${section.key || section.Key || secIdx}-${idx}`;
                return (
                  <View key={key} style={styles.questionWrap}>
                    <Text style={[styles.questionTitle, { color: colors.text }]}>{item.title || item.Title}</Text>
                    {Array.isArray(item.bullets || item.Bullets) && (item.bullets || item.Bullets).length > 0 ? (
                      <View style={styles.hintContainer}>
                        {(item.bullets || item.Bullets).map((b, i) => (
                          <Text key={i} style={[styles.hintText, { color: colors.secondaryText }]}>• {b}</Text>
                        ))}
                      </View>
                    ) : null}
                    <Text style={[styles.answerLabel, { color: colors.secondaryText }]}>Nội dung trả lời</Text>
                    <TextInput
                      style={[styles.answerInput, { backgroundColor: colors.mutedBackground, color: colors.text, borderColor: colors.border }]}
                      multiline
                      placeholder="Nhập nội dung trả lời..."
                      placeholderTextColor={colors.secondaryText}
                      value={answers[key] || ''}
                      onChangeText={(text) => handleAnswerChange(key, text)}
                      textAlignVertical="top"
                    />
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border, borderWidth: 1 }]}
            onPress={handleBack}
          >
            <ChevronLeft size={20} color={colors.text} />
            <Text style={[styles.backBtnText, { color: colors.text }]}>Quay lại</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: colors.primary, flex: 1 }]}
            disabled={isGenerating}
            onPress={handleGenerate}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Download size={20} color="#fff" />
                <Text style={styles.generateBtnText}>Xuất PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <FileText size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {step === 'select' ? 'Chọn Mẫu Báo Cáo' : 'Hồ sơ Thẩm định'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
                  {step === 'select' ? 'Chọn loại báo cáo phù hợp' : 'Hoàn tất biểu mẫu để xuất PDF'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.mutedBackground }]}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {step === 'select' ? renderSelectStep() : renderFillStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  container: {
    height: '94%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    borderBottomWidth: 1
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1,
    padding: 20
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderStyle: 'dashed'
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b'
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1.5,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4
  },
  templateDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500'
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    backgroundColor: 'transparent'
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800'
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 20,
    gap: 8
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '800'
  },
  noteBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 28,
    gap: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(45, 126, 255, 0.05)',
    borderColor: 'rgba(45, 126, 255, 0.2)'
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: '#1e40af'
  },
  sectionGroup: {
    marginBottom: 32
  },
  sectionHeader: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 20,
    justifyContent: 'center',
    minHeight: 24
  },
  sectionHeaderText: {
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexWrap: 'wrap',
    flex: 1
  },
  questionWrap: {
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 20
  },
  hintContainer: {
    marginBottom: 14,
    paddingLeft: 4
  },
  hintText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
    fontWeight: '500'
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 4
  },
  answerInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 120,
    lineHeight: 20,
    fontWeight: '500'
  }
});
