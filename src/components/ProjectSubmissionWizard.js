import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, Animated, SafeAreaView, Image, Dimensions
} from 'react-native';
import { 
  ArrowRight, ArrowLeft, Check, AlertCircle, X, 
  Upload, Image as ImageIcon, Link as LinkIcon, 
  Target, Rocket, Shield, Globe, Users, FileText,
  MapPin, Briefcase, DollarSign, TrendingUp, Info
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import projectSubmissionService from '../services/projectSubmissionService';
import { useTheme } from '../context/ThemeContext';
import Card from './Card';
import Button from './Button';
import FadeInView from './FadeInView';

const { width } = Dimensions.get('window');

const STAGES = [
  { id: 0, label: 'Ý tưởng' },
  { id: 1, label: 'MVP' },
  { id: 2, label: 'Tăng trưởng' }
];

const INDUSTRIES = [
  { label: 'Fintech', value: 0 },
  { label: 'Edtech', value: 1 },
  { label: 'Healthtech', value: 2 },
  { label: 'Agritech', value: 3 },
  { label: 'E_Commerce', value: 4 },
  { label: 'Logistics', value: 5 },
  { label: 'Proptech', value: 6 },
  { label: 'Cleantech', value: 7 },
  { label: 'SaaS', value: 8 },
  { label: 'AI_BigData', value: 9 },
  { label: 'Web3_Crypto', value: 10 },
  { label: 'Food_Beverage', value: 11 },
  { label: 'Manufacturing', value: 12 },
  { label: 'Media_Entertainment', value: 13 },
  { label: 'Other', value: 14 },
];

export default function ProjectSubmissionWizard({ user, onSuccess, onCancel, initialData }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Step 1: Basic
    projectName: '',
    shortDescription: '',
    industry: '',
    location: '',
    teamSize: '',
    logoFile: null,
    backgroundFile: null,
    
    // Step 2: Vision
    vision: '',
    mission: '',
    coreValues: '',
    
    // Step 3: Product
    problemStatement: '',
    solutionDescription: '',
    targetCustomers: '',
    uniqueValueProposition: '',
    
    // Step 4: Business
    businessModel: '',
    revenue: '',
    marketSize: '',
    competitors: '',
    
    // Step 5: Roadmap & Funding
    developmentStage: 0,
    roadmapText: '',
    fundingStatus: '',
    pitchDeckFile: null,
    
    // Step 6: Team & Social
    teamMembers: [{ name: '', role: '' }],
    keySkills: '',
    teamExperience: '',
    website: '',
    facebook: '',
    linkedin: '',
    videoUrl: '',
  });

  useEffect(() => {
    if (initialData) {
      const getStageNumericValue = (stage) => {
        if (stage === undefined || stage === null) return 0;
        const s = String(stage).toLowerCase();
        if (s === 'idea' || s === '0') return 0;
        if (s === 'mvp' || s === '1') return 1;
        if (s === 'growth' || s === '2') return 2;
        return 0;
      };

      let teamArray = [{ name: '', role: '' }];
      if (initialData.teamMembers && typeof initialData.teamMembers === 'string') {
        teamArray = initialData.teamMembers.split(',').map(m => {
          const parts = m.trim().split('(');
          const name = parts[0].trim();
          const role = parts[1] ? parts[1].replace(')', '').trim() : '';
          return { name, role };
        });
      }

      setFormData(prev => ({
        ...prev,
        projectName: initialData.projectName || initialData.name || '',
        shortDescription: initialData.shortDescription || '',
        industry: initialData.industry?.toString() || '',
        location: initialData.location || '',
        teamSize: initialData.teamSize?.toString() || '',
        vision: initialData.vision || '',
        mission: initialData.mission || '',
        coreValues: initialData.coreValues || '',
        problemStatement: initialData.problemStatement || '',
        solutionDescription: initialData.solutionDescription || '',
        targetCustomers: initialData.targetCustomers || '',
        uniqueValueProposition: initialData.uniqueValueProposition || '',
        businessModel: initialData.businessModel || '',
        revenue: initialData.revenue?.toString() || '',
        marketSize: initialData.marketSize?.toString() || '',
        competitors: initialData.competitors || '',
        developmentStage: getStageNumericValue(initialData.developmentStage),
        roadmapText: initialData.roadmapText || '',
        fundingStatus: initialData.fundingStatus || '',
        teamMembers: teamArray.length > 0 ? teamArray : [{ name: '', role: '' }],
        keySkills: initialData.keySkills || '',
        teamExperience: initialData.teamExperience || '',
        website: initialData.website || '',
        facebook: initialData.facebook || '',
        linkedin: initialData.linkedin || '',
        videoUrl: initialData.videoUrl || '',
        // Store remote URLs for preview
        existingLogo: initialData.logoUrl || initialData.projectImage || null,
        existingBackground: initialData.backgroundUrl || initialData.coverImage || null,
        existingPitchDeck: initialData.pitchDeckUrl || initialData.fileUrl || null
      }));
    }
  }, [initialData]);

  const pickFile = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type === 'pitchDeck' ? 'application/pdf' : 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFormData(prev => ({ ...prev, [`${type}File`]: file }));
      }
    } catch (err) {
      console.error('File picker error:', err);
    }
  };

  const validateStep = () => {
    const newErrors = {};
    const isIdea = parseInt(formData.developmentStage) === 0;
    const isMVP = parseInt(formData.developmentStage) === 1;
    const isGrowth = parseInt(formData.developmentStage) === 2;

    if (currentStep === 1) {
      if (!formData.projectName.trim()) newErrors.projectName = 'Bắt buộc';
      if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Bắt buộc';
      if (formData.industry === '') newErrors.industry = 'Vui lòng chọn lĩnh vực';
    } else if (currentStep === 3) {
      if (!formData.problemStatement.trim()) newErrors.problemStatement = 'Bắt buộc';
      if (!formData.solutionDescription.trim()) newErrors.solutionDescription = 'Bắt buộc';
      if (!formData.targetCustomers.trim()) newErrors.targetCustomers = 'Bắt buộc';
      
      if (!isIdea) { // MVP or Growth
         if (!formData.uniqueValueProposition.trim()) newErrors.uniqueValueProposition = 'Bắt buộc';
      }
    } else if (currentStep === 4) {
       if (!isIdea) {
          if (!formData.businessModel.trim()) newErrors.businessModel = 'Bắt buộc';
       }
       if (isGrowth) {
          if (!formData.revenue || parseInt(formData.revenue) <= 0) newErrors.revenue = 'Yêu cầu doanh thu (Growth)';
          if (!formData.marketSize || parseInt(formData.marketSize) <= 0) newErrors.marketSize = 'Yêu cầu quy mô TT';
       }
    } else if (currentStep === 6) {
      const hasEmptyMembers = formData.teamMembers.some(m => !m.name.trim());
      if (hasEmptyMembers) newErrors.teamMembers = 'Nhập tên thành viên';
      
      if (isGrowth && !formData.teamExperience.trim()) {
         newErrors.teamExperience = 'Yêu cầu kinh nghiệm đội ngũ (Growth)';
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
      
      const preparePayload = () => {
        const data = { ...formData };
        // Format team members back to string if needed by API
        const teamString = data.teamMembers
          .filter(m => m.name.trim())
          .map(m => m.role.trim() ? `${m.name.trim()} (${m.role.trim()})` : m.name.trim())
          .join(', ');
        
        const payload = {
          ...data,
          developmentStage: parseInt(data.developmentStage),
          marketSize: parseInt(data.marketSize) || 0,
          revenue: parseInt(data.revenue) || 0,
          teamSize: parseInt(data.teamSize) || 0,
          teamMembers: teamString,
          userId: user?.userId
        };

        // Remove file objects from JSON payload if they are sending separately or handled by FormData
        delete payload.logoFile;
        delete payload.backgroundFile;
        delete payload.pitchDeckFile;
        
        return payload;
      };

      const payload = preparePayload();
      
      // If the service handles FormData with files:
      const finalFormData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          finalFormData.append(key, payload[key]);
        }
      });

      if (formData.logoFile) {
        finalFormData.append('LogoFile', {
          uri: formData.logoFile.uri,
          name: formData.logoFile.name,
          type: formData.logoFile.mimeType || 'image/jpeg'
        });
      }
      if (formData.backgroundFile) {
        finalFormData.append('BackgroundFile', {
          uri: formData.backgroundFile.uri,
          name: formData.backgroundFile.name,
          type: formData.backgroundFile.mimeType || 'image/jpeg'
        });
      }
      if (formData.pitchDeckFile) {
        finalFormData.append('PitchDeckFile', {
          uri: formData.pitchDeckFile.uri,
          name: formData.pitchDeckFile.name,
          type: formData.pitchDeckFile.mimeType || 'application/pdf'
        });
      }

      let res;
      if (isUpdate) {
        res = await projectSubmissionService.updateProject(initialData.id || initialData.projectId, finalFormData);
      } else {
        res = await projectSubmissionService.submitStartupInfo(finalFormData);
      }

      if (res && (res.isSuccess || res.success)) {
        Alert.alert('Thành công', isUpdate ? 'Cập nhật dự án thành công!' : 'Thông tin dự án đã được gửi!');
        if (onSuccess) onSuccess(res.data || formData);
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể lưu thông tin dự án');
      }
    } catch (err) {
      console.error('Wizard error:', err);
      Alert.alert('Lỗi', 'Lỗi hệ thống. Vui lòng thử lại sau.');
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

  const renderImagePicker = (label, type) => {
    const file = formData[`${type}File`];
    const existingUrl = formData[`existing${type.charAt(0).toUpperCase() + type.slice(1)}`];
    
    return (
      <View style={[styles.formGroup, { flex: 1 }]}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>{label}</Text>
        <TouchableOpacity 
          style={[styles.imageBtn, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]} 
          onPress={() => pickFile(type)}
        >
          {file ? (
            <Image source={{ uri: file.uri }} style={styles.imagePreview} />
          ) : existingUrl ? (
            <Image source={{ uri: existingUrl }} style={styles.imagePreview} />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <ImageIcon size={24} color={colors.secondaryText} />
              <Text style={{ color: colors.secondaryText, fontSize: 12, marginTop: 4 }}>Chọn ảnh</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <FadeInView key="step1">
            <Text style={[styles.stepTitle, { color: colors.text }]}>1. Thông tin cơ bản</Text>
            {renderInput('Tên dự án *', 'projectName', 'Nhập tên dự án...')}
            {renderInput('Mô tả ngắn *', 'shortDescription', 'Tóm tắt dự án trong 1-2 câu...', true)}
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Lĩnh vực *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.industryScroll}>
                {INDUSTRIES.map(ind => (
                  <TouchableOpacity 
                    key={ind.value}
                    style={[
                      styles.industryChip,
                      { borderColor: colors.border },
                      formData.industry === ind.value.toString() && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                    ]}
                    onPress={() => setFormData(p => ({ ...p, industry: ind.value.toString() }))}
                  >
                    <Text style={[
                      styles.industryText, 
                      { color: colors.secondaryText },
                      formData.industry === ind.value.toString() && { color: colors.primary }
                    ]}>{ind.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.industry && <Text style={[styles.errorText, { color: colors.error }]}>{errors.industry}</Text>}
            </View>

            <View style={styles.row}>
              {renderInput('Địa điểm', 'location', 'Thành phố...', false)}
              <View style={{ width: 12 }} />
              {renderInput('Số lượng TV', 'teamSize', '0', false, 'numeric')}
            </View>
            
            <View style={styles.row}>
              {renderImagePicker('Logo dự án', 'logo')}
              <View style={{ width: 12 }} />
              {renderImagePicker('Ảnh bìa', 'background')}
            </View>
          </FadeInView>
        );
      case 2:
        return (
          <FadeInView key="step2">
            <Text style={[styles.stepTitle, { color: colors.text }]}>2. Tầm nhìn & Sứ mệnh</Text>
            {renderInput('Tầm nhìn', 'vision', 'Dự án sẽ ở đâu trong 5 năm tới?', true)}
            {renderInput('Sứ mệnh', 'mission', 'Giá trị dự án mang lại cho cộng đồng', true)}
            {renderInput('Giá trị cốt lõi', 'coreValues', 'Những nguyên tắc dự án theo đuổi', true)}
          </FadeInView>
        );
      case 3:
        return (
          <FadeInView key="step3">
            <Text style={[styles.stepTitle, { color: colors.text }]}>3. Giải pháp & Khách hàng</Text>
            {renderInput('Vấn đề giải quyết *', 'problemStatement', 'Nêu rõ nỗi đau của khách hàng...', true)}
            {renderInput('Giải pháp đề xuất *', 'solutionDescription', 'Sản phẩm của bạn giải quyết thế nào?', true)}
            {renderInput('Khách hàng mục tiêu', 'targetCustomers', 'Ai là người dùng lý tưởng?', true)}
            {renderInput('Điểm khác biệt (UVP)', 'uniqueValueProposition', 'Tại sao bạn khác biệt?', true)}
          </FadeInView>
        );
      case 4:
        return (
          <FadeInView key="step4">
            <Text style={[styles.stepTitle, { color: colors.text }]}>4. Mô hình & Tài chính</Text>
            {renderInput('Mô hình kinh doanh', 'businessModel', 'Cách bạn kiếm tiền...', true)}
            {renderInput('Quy mô thị trường', 'marketSize', 'Tổng quy mô (VND)', false, 'numeric')}
            {renderInput('Doanh thu dự kiến/hiện tại', 'revenue', 'Doanh thu (VND)', false, 'numeric')}
            {renderInput('Đối thủ cạnh tranh', 'competitors', 'Danh sách đối thủ...', true)}
          </FadeInView>
        );
      case 5:
        return (
          <FadeInView key="step5">
            <Text style={[styles.stepTitle, { color: colors.text }]}>5. Lộ trình & Tài liệu</Text>
            <Text style={[styles.label, { color: colors.secondaryText, marginTop: 8 }]}>Giai đoạn phát triển *</Text>
            <View style={styles.selectRow}>
              {STAGES.map(s => (
                <TouchableOpacity 
                  key={s.id} 
                  style={[
                    styles.selectBtn, 
                    { borderColor: colors.border },
                    formData.developmentStage === s.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, developmentStage: s.id }))}
                >
                  <Text style={[
                    styles.selectText, 
                    { color: colors.secondaryText },
                    formData.developmentStage === s.id && { color: '#fff' }
                  ]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {renderInput('Lộ trình phát triển', 'roadmapText', 'Các mốc quan trọng (Milestones)...', true)}
            {renderInput('Tình trạng gọi vốn', 'fundingStatus', 'Đã gọi được bao nhiêu? Cần bao nhiêu?')}
            
            <Text style={[styles.label, { color: colors.secondaryText, marginTop: 12 }]}>Pitch Deck (PDF)</Text>
            <TouchableOpacity 
              style={[styles.filePicker, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}
              onPress={() => pickFile('pitchDeck')}
            >
              {formData.pitchDeckFile ? (
                <View style={styles.fileInfo}>
                  <FileText size={20} color={colors.primary} />
                  <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{formData.pitchDeckFile.name}</Text>
                  <X size={18} color={colors.error} onPress={() => setFormData(p => ({...p, pitchDeckFile: null}))} />
                </View>
              ) : (
                <>
                  <Upload size={20} color={colors.secondaryText} />
                  <Text style={{ color: colors.secondaryText, marginLeft: 8 }}>Tải lên file Pitch Deck</Text>
                </>
              )}
            </TouchableOpacity>
          </FadeInView>
        );
      case 6:
        return (
          <FadeInView key="step6">
             <Text style={[styles.stepTitle, { color: colors.text }]}>6. Đội ngũ & Liên hệ</Text>
             
             {/* Team Members List */}
             <View style={styles.teamContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>Thành viên</Text>
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
                    />
                    {formData.teamMembers.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => {
                          const newMembers = formData.teamMembers.filter((_, i) => i !== idx);
                          setFormData(prev => ({ ...prev, teamMembers: newMembers }));
                        }}
                      >
                        <X size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
            </View>

            {renderInput('Kỹ năng cốt lõi', 'keySkills', 'VD: React Native, AI, Marketing...')}
            {renderInput('Website', 'website', 'https://...')}
            {renderInput('Video Demo (URL)', 'videoUrl', 'Link YouTube/Vimeo...')}
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>{renderInput('Facebook', 'facebook', 'Link Facebook')}</View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>{renderInput('LinkedIn', 'linkedin', 'Link LinkedIn')}</View>
            </View>

            <Card style={[styles.finishCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <Check size={32} color={colors.primary} />
              <Text style={[styles.finishText, { color: colors.primary }]}>Mọi thứ đã sẵn sàng!</Text>
              <Text style={[styles.finishSub, { color: colors.secondaryText }]}>Hệ thống AI sẽ phân tích hồ sơ của bạn sau khi gửi.</Text>
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
            {initialData ? 'Cập nhật dự án' : 'Đăng ký dự án mới'}
          </Text>
          <TouchableOpacity onPress={onCancel} style={[styles.closeBtn, { backgroundColor: colors.mutedBackground }]}>
            <X size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
        <View style={[styles.progressLine, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
        <View style={styles.stepInfoBox}>
           <Text style={[styles.stepLabel, { color: colors.secondaryText }]}>BƯỚC {currentStep} / {totalSteps}</Text>
           <Text style={[styles.stepPercent, { color: colors.primary }]}>{Math.round((currentStep / totalSteps) * 100)}%</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
        <View style={{ height: 140 }} />
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
                <Text style={styles.submitText}>{initialData ? 'Lưu thay đổi' : 'Gửi hồ sơ'}</Text>
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
  progressLine: { height: 6, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  stepInfoBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  stepPercent: { fontSize: 10, fontWeight: '900' },
  scrollContent: { padding: 24 },
  stepTitle: { fontSize: 24, fontWeight: '900', marginBottom: 24, letterSpacing: -0.8 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '500' },
  textArea: { height: 120, textAlignVertical: 'top' },
  errorText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  imageBtn: { flex: 1, height: 100, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.02)' },
  imagePreview: { width: '100%', height: '100%', borderRadius: 14 },
  industryScroll: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  industryChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  industryText: { fontSize: 13, fontWeight: '700' },
  selectRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  selectBtn: { flex: 1, paddingVertical: 14, borderWidth: 1, borderRadius: 14, alignItems: 'center' },
  selectText: { fontWeight: '700', fontSize: 14 },
  teamContainer: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  memberRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  memberInput: { flex: 2, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: '500' },
  filePicker: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  fileInfo: { flexDirection: 'row', flex: 1, alignItems: 'center', gap: 8 },
  fileName: { flex: 1, fontSize: 14, fontWeight: '600' },
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
