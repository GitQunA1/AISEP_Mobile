import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import projectSubmissionService from '../services/projectSubmissionService';
import THEME from '../constants/Theme';

export default function ProjectSubmissionWizard({ user, onSuccess, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    projectName: '',
    industry: '',
    location: '',
    stage: 'idea',
    
    // Step 2: Problem
    problemDescription: '',
    problemAffects: '',
    currentSolution: '',
    
    // Step 3: Solution
    proposedSolution: '',
    differentiator: '',
    minimumViable: '',
    
    // Step 4: Market
    idealCustomerBuyer: '',
    customerCount: '',
    currentRevenue: '',
    
    // Step 5: Revenue
    revenueMethod: '',
    revenueType: '',
    pricingStrategy: '',
    
    // Step 6: Team
    teamSize: '',
    teamRoles: '',
  });

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.projectName.trim()) newErrors.projectName = 'Bắt buộc';
      if (!formData.industry) newErrors.industry = 'Bắt buộc';
    }
    if (currentStep === 2) {
      if (!formData.problemDescription.trim()) newErrors.problemDescription = 'Bắt buộc';
    }
    // Add more validations as needed...
    
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
      const res = await projectSubmissionService.submitStartupInfo(formData);
      if (res && (res.isSuccess || res.success)) {
        Alert.alert('Thành công', 'Thông tin dự án đã được gửi!');
        if (onSuccess) onSuccess(res.data || formData);
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể gửi thông tin');
      }
    } catch (err) {
      console.error('Wizard error:', err);
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (label, name, placeholder, multiline = false) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea, errors[name] && styles.inputError]}
        placeholder={placeholder}
        value={formData[name]}
        onChangeText={(text) => {
          setFormData(prev => ({ ...prev, [name]: text }));
          if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        }}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        placeholderTextColor="#94A3B8"
      />
      {errors[name] && <Text style={styles.errorText}>{errors[name]}</Text>}
    </View>
  );

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Bước 1: Thông tin cơ bản</Text>
            {renderInput('Tên dự án', 'projectName', 'Tên dự án của bạn')}
            {renderInput('Lĩnh vực', 'industry', 'Ví dụ: Fintech, AI...')}
            {renderInput('Địa điểm', 'location', 'Nơi triển khai')}
            <Text style={styles.label}>Giai đoạn</Text>
            <View style={styles.selectRow}>
              {['idea', 'mvp', 'growth'].map(s => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.selectBtn, formData.stage === s && styles.selectBtnActive]}
                  onPress={() => setFormData(prev => ({ ...prev, stage: s }))}
                >
                  <Text style={[styles.selectText, formData.stage === s && styles.selectTextActive]}>{s.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Bước 2: Vấn đề</Text>
            {renderInput('Mô tả vấn đề', 'problemDescription', 'Vấn đề bạn đang giải quyết là gì?', true)}
            {renderInput('Ai gặp vấn đề này?', 'problemAffects', 'Đối tượng cụ thể', true)}
            {renderInput('Giải pháp hiện tại', 'currentSolution', 'Họ đang làm gì để giải quyết?', true)}
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Bước 3: Giải pháp</Text>
            {renderInput('Giải pháp của bạn', 'proposedSolution', 'Sản phẩm/Dịch vụ của bạn làm gì?', true)}
            {renderInput('Điểm khác biệt', 'differentiator', 'Tại sao bạn tốt hơn đối thủ?', true)}
            {renderInput('MVP là gì?', 'minimumViable', 'Phiên bản nhỏ nhất để bắt đầu', true)}
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>Bước 4: Thị trường</Text>
            {renderInput('Khách hàng lý tưởng', 'idealCustomerBuyer', 'Mô tả chân dung khách hàng')}
            {renderInput('Số lượng khách hàng tiềm năng', 'customerCount', 'Ví dụ: 1 triệu người...')}
            {renderInput('Doanh thu dự kiến', 'currentRevenue', 'Ví dụ: 100tr/tháng...')}
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={styles.stepTitle}>Bước 5: Mô hình kinh doanh</Text>
            {renderInput('Cách kiếm tiền', 'revenueMethod', 'Bạn bán cái gì?')}
            {renderInput('Loại doanh thu', 'revenueType', 'Phí thuê bao, bán lẻ, hoa hồng...')}
            {renderInput('Chiến lược giá', 'pricingStrategy', 'Tại sao mức giá này hợp lý?', true)}
          </View>
        );
      case 6:
        return (
          <View>
            <Text style={styles.stepTitle}>Bước 6: Đội ngũ</Text>
            {renderInput('Số lượng thành viên', 'teamSize', 'Bao nhiêu người co-founder/fulltime')}
            {renderInput('Vai trò các thành viên', 'teamRoles', 'Kinh nghiệm và trách nhiệm', true)}
            <View style={styles.finishCard}>
              <Check size={40} color={THEME.colors.primary} />
              <Text style={styles.finishText}>Bạn đã hoàn thành các bước!</Text>
              <Text style={styles.finishSub}>Vui lòng kiểm tra lại thông tin trước khi gửi.</Text>
            </View>
          </View>
        );
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.stepCounter}>Bước {currentStep} / {totalSteps}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStep()}
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.navBtn, currentStep === 1 && styles.disabledBtn]} 
          onPress={handleBack}
          disabled={currentStep === 1 || isLoading}
        >
          <ArrowLeft size={20} color={currentStep === 1 ? '#94A3B8' : '#1E293B'} />
          <Text style={[styles.navText, currentStep === 1 && { color: '#94A3B8' }]}>Quay lại</Text>
        </TouchableOpacity>

        {currentStep < totalSteps ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>Tiếp theo</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.submitText}>Gửi dự án</Text>
                <Check size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  progressHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  progressLine: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: THEME.colors.primary, borderRadius: 2 },
  stepCounter: { fontSize: 12, fontWeight: '700', color: '#64748B', textAlign: 'right' },
  scrollContent: { padding: 20 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1E293B' },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  selectRow: { flexDirection: 'row', gap: 10 },
  selectBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, alignItems: 'center' },
  selectBtnActive: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  selectText: { fontWeight: '600', color: '#64748B' },
  selectTextActive: { color: '#fff' },
  footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  navBtn: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  navText: { marginLeft: 8, fontWeight: '600', color: '#1E293B' },
  nextBtn: { marginLeft: 'auto', backgroundColor: THEME.colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  nextText: { color: '#fff', fontWeight: '700', marginRight: 8 },
  submitBtn: { marginLeft: 'auto', backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  submitText: { color: '#fff', fontWeight: '700', marginRight: 8 },
  disabledBtn: { opacity: 0.5 },
  finishCard: { alignItems: 'center', padding: 30, backgroundColor: '#F0FDF4', borderRadius: 16, marginTop: 10 },
  finishText: { fontSize: 18, fontWeight: '800', color: '#166534', marginTop: 16 },
  finishSub: { fontSize: 14, color: '#166534', textAlign: 'center', marginTop: 8 }
});
