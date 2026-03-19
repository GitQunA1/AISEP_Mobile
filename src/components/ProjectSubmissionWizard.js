import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated, SafeAreaView } from 'react-native';
import { ArrowRight, ArrowLeft, Check, AlertCircle, X } from 'lucide-react-native';
import projectSubmissionService from '../services/projectSubmissionService';
import THEME from '../constants/Theme';
import { useTheme } from '../context/ThemeContext';
import Card from './Card';
import Button from './Button';
import FadeInView from './FadeInView';

export default function ProjectSubmissionWizard({ user, onSuccess, onCancel, initialData }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const getStageNumericValue = (stage) => {
    if (!stage) return 0;
    const s = String(stage).toLowerCase();
    if (s === 'idea' || s === '0') return 0;
    if (s === 'mvp' || s === '1') return 1;
    if (s === 'growth' || s === '2') return 2;
    return 0;
  };

  const [formData, setFormData] = useState(() => {
    const defaultData = {
      projectName: '',
      shortDescription: '',
      developmentStage: 0,
      problemStatement: '',
      solutionDescription: '',
      targetCustomers: '',
      uniqueValueProposition: '',
      marketSize: '',
      businessModel: '',
      revenue: '',
      competitors: '',
      teamMembers: [{ name: '', role: '' }],
      keySkills: '',
      teamExperience: '',
    };

    if (initialData) {
      let teamArray = [{ name: '', role: '' }];
      if (initialData.teamMembers && typeof initialData.teamMembers === 'string') {
        teamArray = initialData.teamMembers.split(',').map(m => {
          const parts = m.trim().split('(');
          const name = parts[0].trim();
          const role = parts[1] ? parts[1].replace(')', '').trim() : '';
          return { name, role };
        });
      }

      return {
        projectName: initialData.projectName || initialData.name || '',
        shortDescription: initialData.shortDescription || '',
        developmentStage: getStageNumericValue(initialData.developmentStage),
        problemStatement: initialData.problemStatement || initialData.problemDescription || '',
        solutionDescription: initialData.solutionDescription || initialData.proposedSolution || '',
        targetCustomers: initialData.targetCustomers || initialData.idealCustomerBuyer || '',
        uniqueValueProposition: initialData.uniqueValueProposition || initialData.differentiator || '',
        marketSize: initialData.marketSize?.toString() || '',
        businessModel: initialData.businessModel || initialData.revenueMethod || '',
        revenue: initialData.revenue?.toString() || initialData.currentRevenue || '',
        competitors: initialData.competitors || '',
        teamMembers: teamArray,
        keySkills: initialData.keySkills || '',
        teamExperience: initialData.teamExperience || '',
      };
    }
    return defaultData;
  });

  const isIdea = String(formData.developmentStage) === '0';
  const isMVP = String(formData.developmentStage) === '1';
  const isGrowth = String(formData.developmentStage) === '2';

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.projectName.trim()) newErrors.projectName = 'Bắt buộc';
      if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Bắt buộc';
      if (!formData.problemStatement.trim()) newErrors.problemStatement = 'Bắt buộc';
    }

    if (currentStep === 2) {
      if (!formData.solutionDescription.trim()) newErrors.solutionDescription = 'Bắt buộc';
      if (!formData.targetCustomers.trim()) newErrors.targetCustomers = 'Bắt buộc';
      
      if (isMVP || isGrowth) {
        if (!formData.uniqueValueProposition.trim()) newErrors.uniqueValueProposition = 'Bắt buộc';
        if (!formData.businessModel.trim()) newErrors.businessModel = 'Bắt buộc';
      }
      
      if (isGrowth) {
        if (!formData.revenue || parseInt(formData.revenue) <= 0) newErrors.revenue = 'Bắt buộc';
        if (!formData.marketSize || parseInt(formData.marketSize) <= 0) newErrors.marketSize = 'Bắt buộc';
      }
    }

    if (currentStep === 3) {
      const hasEmptyMembers = formData.teamMembers.some(m => !m.name.trim());
      if (hasEmptyMembers) newErrors.teamMembers = 'Nhập tên thành viên';

      if (isMVP || isGrowth) {
        if (!formData.competitors.trim()) newErrors.competitors = 'Bắt buộc';
        if (!formData.keySkills.trim()) newErrors.keySkills = 'Bắt buộc';
      }

      if (isGrowth) {
        if (!formData.teamExperience.trim()) newErrors.teamExperience = 'Bắt buộc';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsLoading(true);
    try {
      const isUpdate = !!(initialData && (initialData.id || initialData.projectId));
      
      const payload = { 
        ...formData, 
        developmentStage: parseInt(formData.developmentStage),
        marketSize: parseInt(formData.marketSize) || 0,
        revenue: parseInt(formData.revenue) || 0,
        userId: user?.userId,
        teamMembers: formData.teamMembers
          .filter(m => m.name.trim())
          .map(m => m.role.trim() ? `${m.name.trim()} (${m.role.trim()})` : m.name.trim())
          .join(', ')
      };

      let res;
      if (isUpdate) {
        res = await projectSubmissionService.updateProject(initialData.id || initialData.projectId, payload);
      } else {
        res = await projectSubmissionService.submitStartupInfo(payload);
      }

      if (res && (res.isSuccess || res.success)) {
        Alert.alert('Thành công', isUpdate ? 'Cập nhật dự án thành công!' : 'Thông tin dự án đã được gửi!');
        if (onSuccess) onSuccess(res.data || formData);
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể lưu thông tin dự án');
      }
    } catch (err) {
      console.error('Wizard error:', err);
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (label, name, placeholder, multiline = false, keyboardType = 'default') => (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: colors.secondaryText }]}>{label}</Text>
      <TextInput
        style={[
          styles.input, 
          { 
            backgroundColor: colors.mutedBackground, 
            color: colors.text, 
            borderColor: errors[name] ? colors.error : colors.border 
          },
          multiline && styles.textArea
        ]}
        placeholder={placeholder}
        value={String(formData[name] || '')}
        onChangeText={(text) => {
          setFormData(prev => ({ ...prev, [name]: text }));
          if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        }}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        placeholderTextColor={colors.secondaryText + '80'}
        keyboardType={keyboardType}
      />
      {errors[name] && <Text style={[styles.errorText, { color: colors.error }]}>{errors[name]}</Text>}
    </View>
  );

  const renderTeamMembers = () => (
    <View style={styles.teamContainer}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>Thành viên & Vai trò</Text>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary + '15' }]} 
          onPress={() => setFormData(prev => ({ 
            ...prev, 
            teamMembers: [...prev.teamMembers, { name: '', role: '' }] 
          }))}
        >
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>+ Thêm</Text>
        </TouchableOpacity>
      </View>
      {formData.teamMembers.map((member, idx) => (
        <View key={idx} style={styles.memberRow}>
          <TextInput
            style={[styles.memberInput, { backgroundColor: colors.mutedBackground, color: colors.text, borderColor: colors.border }]}
            placeholder="Họ tên"
            value={member.name}
            onChangeText={(text) => {
              const newMembers = [...formData.teamMembers];
              newMembers[idx].name = text;
              setFormData(prev => ({ ...prev, teamMembers: newMembers }));
            }}
            placeholderTextColor={colors.secondaryText + '80'}
          />
          <TextInput
            style={[styles.memberInput, { backgroundColor: colors.mutedBackground, color: colors.text, borderColor: colors.border, flex: 1.5 }]}
            placeholder="Vai trò"
            value={member.role}
            onChangeText={(text) => {
              const newMembers = [...formData.teamMembers];
              newMembers[idx].role = text;
              setFormData(prev => ({ ...prev, teamMembers: newMembers }));
            }}
            placeholderTextColor={colors.secondaryText + '80'}
          />
          {formData.teamMembers.length > 1 && (
            <TouchableOpacity 
              onPress={() => {
                const newMembers = formData.teamMembers.filter((_, i) => i !== idx);
                setFormData(prev => ({ ...prev, teamMembers: newMembers }));
              }}
              style={styles.removeBtn}
            >
              <Text style={{ color: colors.error, fontWeight: '900' }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <FadeInView>
            <Text style={[styles.stepTitle, { color: colors.text }]}>1. Thông tin cơ bản</Text>
            {renderInput('Tên dự án *', 'projectName', 'Tên dự án của bạn')}
            {renderInput('Mô tả ngắn *', 'shortDescription', 'Mô tả ngắn gọn về dự án')}
            
            <Text style={[styles.label, { color: colors.secondaryText, marginTop: 8 }]}>Giai đoạn phát triển *</Text>
            <View style={styles.selectRow}>
              {[
                { id: 0, label: 'Ý tưởng' },
                { id: 1, label: 'MVP' },
                { id: 2, label: 'Tăng trưởng' }
              ].map(s => (
                <TouchableOpacity 
                  key={s.id} 
                  style={[
                    styles.selectBtn, 
                    { borderColor: colors.border },
                    String(formData.developmentStage) === String(s.id) && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, developmentStage: s.id }))}
                >
                  <Text style={[
                    styles.selectText, 
                    { color: colors.secondaryText },
                    String(formData.developmentStage) === String(s.id) && { color: '#fff' }
                  ]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {renderInput('Mô tả vấn đề *', 'problemStatement', 'Vấn đề lớn nhất bạn đang giải quyết là gì?', true)}
          </FadeInView>
        );
      case 2:
        return (
          <FadeInView>
            <Text style={[styles.stepTitle, { color: colors.text }]}>2. Giải pháp & Thị trường</Text>
            {renderInput('Mô tả giải pháp *', 'solutionDescription', 'Sản phẩm/Dịch vụ của bạn hoạt động thế nào?', true)}
            {renderInput('Khách hàng mục tiêu *', 'targetCustomers', 'Ai là người sẽ trả tiền cho bạn?', true)}
            
            {(isMVP || isGrowth) && (
              <>
                {renderInput('Giá trị độc đáo (UVP) *', 'uniqueValueProposition', 'Tại sao khách hàng chọn bạn?', true)}
                {renderInput('Mô hình kinh doanh *', 'businessModel', 'Bạn dự định thu phí như thế nào?', true)}
              </>
            )}

            {isGrowth && (
              <>
                {renderInput('Quy mô thị trường (VND) *', 'marketSize', '0', false, 'numeric')}
                {renderInput('Doanh thu (VND) *', 'revenue', '0', false, 'numeric')}
              </>
            )}
          </FadeInView>
        );
      case 3:
        return (
          <FadeInView>
            <Text style={[styles.stepTitle, { color: colors.text }]}>3. Đội ngũ & Đối thủ</Text>
            
            {(isMVP || isGrowth) && (
              <>
                {renderInput('Đối thủ cạnh tranh *', 'competitors', 'Ai là đối thủ chính của bạn?', true)}
                {renderInput('Kỹ năng chính *', 'keySkills', 'Các kỹ năng cốt lõi của đội ngũ', true)}
              </>
            )}

            {isGrowth && renderInput('Kinh nghiệm đội ngũ *', 'teamExperience', 'Kinh nghiệm liên quan của các thành viên', true)}

            {renderTeamMembers()}
            
            <Card style={[styles.finishCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <Check size={32} color={colors.primary} />
              <Text style={[styles.finishText, { color: colors.primary }]}>Sẵn sàng nộp hồ sơ!</Text>
              <Text style={[styles.finishSub, { color: colors.secondaryText }]}>Vui lòng kiểm tra kỹ các thông tin đã nhập.</Text>
            </Card>
          </FadeInView>
        );
      default: return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.progressHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {initialData ? 'Cập nhật dự án' : 'Đăng dự án'}
          </Text>
          <TouchableOpacity onPress={onCancel} style={[styles.closeBtn, { backgroundColor: colors.mutedBackground }]}>
            <X size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
        <View style={[styles.progressLine, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.stepCounter, { color: colors.secondaryText }]}>BƯỚC {currentStep} / {totalSteps}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStep()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[styles.navBtn, currentStep === 1 && styles.disabledBtn]} 
          onPress={handleBack}
          disabled={currentStep === 1 || isLoading}
        >
          <ArrowLeft size={20} color={currentStep === 1 ? colors.secondaryText + '40' : colors.text} />
          <Text style={[styles.navText, { color: currentStep === 1 ? colors.secondaryText + '40' : colors.text }]}>Quay lại</Text>
        </TouchableOpacity>

        {currentStep < totalSteps ? (
          <TouchableOpacity 
            style={[styles.nextBtn, { backgroundColor: colors.primary }]} 
            onPress={handleNext}
          >
            <Text style={styles.nextText}>Tiếp theo</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit} 
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.submitText}>{initialData ? 'Cập nhật' : 'Gửi dự án'}</Text>
                <Check size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressHeader: { padding: 20, paddingTop: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progressLine: { height: 6, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  stepCounter: { fontSize: 11, fontWeight: '900', textAlign: 'right', letterSpacing: 1 },
  scrollContent: { padding: 24 },
  stepTitle: { fontSize: 24, fontWeight: '900', marginBottom: 24, letterSpacing: -0.5 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '500' },
  textArea: { height: 120, textAlignVertical: 'top' },
  errorText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  selectRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  selectBtn: { flex: 1, paddingVertical: 14, borderWidth: 1, borderRadius: 14, alignItems: 'center' },
  selectText: { fontWeight: '700', fontSize: 14 },
  teamContainer: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  memberRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  memberInput: { flex: 2, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: '500' },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  footer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 20, 
    paddingBottom: 34, 
    borderTopWidth: 1, 
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  navText: { marginLeft: 8, fontWeight: '700', fontSize: 16 },
  nextBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 18 },
  nextText: { color: '#fff', fontWeight: '800', fontSize: 16, marginRight: 8 },
  submitBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 18 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16, marginRight: 8 },
  disabledBtn: { opacity: 0.3 },
  finishCard: { alignItems: 'center', padding: 24, borderRadius: 24, marginTop: 10, borderWidth: 1, borderStyle: 'dashed' },
  finishText: { fontSize: 20, fontWeight: '900', marginTop: 12 },
  finishSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 6 }
});
