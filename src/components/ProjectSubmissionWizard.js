import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, Animated, Image, Dimensions, Platform, StatusBar
} from 'react-native';
import { 
  ArrowRight, ArrowLeft, Check, AlertCircle, X, 
  Upload, Image as ImageIcon, Link as LinkIcon, 
  Target, Rocket, Shield, Globe, Users, FileText,
  MapPin, Briefcase, DollarSign, TrendingUp, Info
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import validationService from '../services/validationService';
import enumService from '../services/enumService';
import { useTheme } from '../context/ThemeContext';
import DynamicInputField from './common/DynamicInputField';
import FadeInView from './FadeInView';
import Card from './Card';
import projectSubmissionService from '../services/projectSubmissionService';

const { width } = Dimensions.get('window');

export default function ProjectSubmissionWizard({ user, onSuccess, onCancel, initialData }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');
  const [errors, setErrors] = useState({});
  const [validationRules, setValidationRules] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [stages, setStages] = useState([]);

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

  const fetchConfig = async () => {
    try {
      setIsConfigLoading(true);
      setConfigError('');
      const formKey = initialData ? 'project.update' : 'project.create';
      const [rules, fetchedIndustries, fetchedStages] = await Promise.all([
        validationService.getFormRules(formKey),
        enumService.getEnumOptions('Industry'),
        enumService.getEnumOptions('DevelopmentStage')
      ]);
      
      if (!rules || Object.keys(rules).length === 0) {
        throw new Error('Không thể tải dữ liệu cấu hình từ máy chủ.');
      }
      
      setValidationRules(rules);
      setIndustries(fetchedIndustries || []);
      setStages(fetchedStages || []);
    } catch (error) {
      console.error('Error fetching config:', error);
      setConfigError('Không thể tải cấu hình biểu mẫu. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setIsConfigLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [initialData]);

  useEffect(() => {
    if (initialData && !isConfigLoading) {
      const getStageNumericValue = (stage) => {
        if (stage === undefined || stage === null) return 0;
        const s = String(stage).toLowerCase();
        const matched = stages.find(st => String(st.value) === s || st.label.toLowerCase() === s);
        if (matched) return Number(matched.value);
        if (s === 'idea' || s === '0') return 0;
        if (s === 'mvp' || s === '1') return 1;
        if (s === 'growth' || s === '2') return 2;
        return 0;
      };

      let industryVal = '';
      if (initialData.industry) {
        const indString = String(initialData.industry).toLowerCase();
        const matched = industries.find(i => 
          String(i.value) === indString || 
          i.label.toLowerCase() === indString ||
          i.label.toLowerCase().replace(/ /g, '_') === indString
        );
        industryVal = matched ? String(matched.value) : String(initialData.industry);
      }

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
        industry: industryVal,
        location: initialData.location || '',
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
  }, [initialData, isConfigLoading, industries, stages]);

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
    if (!validationRules) {
      const newErrors = {};
      if (currentStep === 1) {
        if (!formData.projectName.trim()) newErrors.projectName = 'Bắt buộc';
        if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Bắt buộc';
        if (formData.industry === '') newErrors.industry = 'Vui lòng chọn lĩnh vực';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    const stepFields = {
      1: ['projectName', 'shortDescription', 'industry', 'location', 'teamSize'],
      2: ['vision', 'mission', 'coreValues'],
      3: ['problemStatement', 'solutionDescription', 'targetCustomers', 'uniqueValueProposition'],
      4: ['businessModel', 'revenue', 'marketSize', 'competitors'],
      5: ['developmentStage', 'roadmapText', 'fundingStatus'],
      6: ['keySkills', 'teamExperience', 'website', 'facebook', 'linkedin', 'videoUrl']
    };

    const currentFields = stepFields[currentStep] || [];
    const newErrors = {};

    currentFields.forEach(name => {
      const ruleKey = (name === 'industry' ? 'industryoptionids' : (name === 'developmentStage' ? 'stageoptionid' : name)).toLowerCase();
      const rule = validationRules[ruleKey];
      if (rule) {
        const error = validationService.validateField(formData[name], rule, formData.developmentStage);
        if (error) newErrors[name] = error;
      }
    });

    if (currentStep === 6) {
      const hasEmptyMembers = formData.teamMembers.some(m => !m.name.trim());
      if (hasEmptyMembers) newErrors.teamMembers = 'Nhập tên thành viên';
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

  const renderInput = (label, name, placeholder, multiline = false, keyboardType = 'default') => {
    const ruleKey = (name === 'industry' ? 'industryoptionids' : (name === 'developmentStage' ? 'stageoptionid' : name)).toLowerCase();
    return (
      <DynamicInputField
        name={name}
        label={label}
        value={String(formData[name] || '')}
        onChangeText={(field, text) => {
          setFormData(prev => ({ ...prev, [field]: text }));
          if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
        }}
        validationRule={validationRules?.[ruleKey]}
        currentStage={formData.developmentStage}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    );
  };

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
                {industries.map(ind => (
                  <TouchableOpacity 
                    key={ind.value}
                    style={[
                      styles.industryChip,
                      { borderColor: colors.border },
                      formData.industry === String(ind.value) && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                    ]}
                    onPress={() => setFormData(p => ({ ...p, industry: String(ind.value) }))}
                  >
                    <Text style={[
                      styles.industryText, 
                      { color: colors.secondaryText },
                      formData.industry === String(ind.value) && { color: colors.primary }
                    ]}>{ind.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.industry && <Text style={[styles.errorText, { color: colors.error }]}>{errors.industry}</Text>}
            </View>

            <View style={{ marginBottom: 12 }}>
              {renderInput('Địa điểm', 'location', 'Thành phố, Tỉnh thành...', false)}
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
              {stages.map(s => (
                <TouchableOpacity 
                  key={s.value} 
                  style={[
                    styles.selectBtn, 
                    { borderColor: colors.border },
                    formData.developmentStage === Number(s.value) && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, developmentStage: Number(s.value) }))}
                >
                  <Text style={[
                    styles.selectText, 
                    { color: colors.secondaryText },
                    formData.developmentStage === Number(s.value) && { color: '#fff' }
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
                  <Text style={[styles.label, { color: colors.text }]}>Thành viên đội <Text style={{ color: colors.error }}>*</Text></Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ marginRight: 12, fontSize: 13, color: colors.secondaryText, fontWeight: '600' }}>
                      Tổng số: {formData.teamMembers.length}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.addBtn, { backgroundColor: colors.primary }]} 
                      onPress={() => setFormData(prev => ({ 
                        ...prev, 
                        teamMembers: [...prev.teamMembers, { name: '', role: '' }] 
                      }))}
                    >
                      <Plus size={14} color="#fff" />
                      <Text style={styles.addBtnText}>Thêm</Text>
                    </TouchableOpacity>
                  </View>
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
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background, 
        paddingTop: Platform.OS === 'ios' ? insets.top : (StatusBar.currentHeight || 0) + 10 
      }
    ]}>
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
        {isConfigLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.secondaryText }}>Đang tải cấu hình biểu mẫu...</Text>
          </View>
        ) : configError ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <AlertCircle size={48} color={colors.error} style={{ marginBottom: 16 }} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Lỗi khởi tạo</Text>
            <Text style={{ color: colors.secondaryText, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              {configError}
            </Text>
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary, paddingHorizontal: 32 }]} 
              onPress={fetchConfig}
            >
              <Text style={styles.submitText}>Thử lại ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderStepContent()
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      {!isConfigLoading && !configError && (
        <View style={[
          styles.footer, 
          { 
            borderTopColor: colors.border, 
            backgroundColor: colors.background, 
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 4 : Math.max(insets.bottom, 20)
          }
        ]}>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressHeader: { padding: 16, paddingTop: 4, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progressLine: { height: 6, borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  stepInfoBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  stepPercent: { fontSize: 10, fontWeight: '900' },
  scrollContent: { padding: 20, paddingTop: 24 },
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
    paddingVertical: 8, 
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
