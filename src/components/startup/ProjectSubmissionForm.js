import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    Modal, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform, 
    Alert, 
    Dimensions, 
    Pressable,
    Animated,
    Easing
} from 'react-native';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import projectSubmissionService from '../../services/projectSubmissionService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fallback for getting numeric value
const getStageNumericValue = (val) => {
    if(val === 'Idea' || val === '0' || val === 0) return 0;
    if(val === 'MVP' || val === '1' || val === 1) return 1;
    if(val === 'Growth' || val === '2' || val === 2) return 2;
    return '';
};

// --- Reusable Animated Components ---

const ScaleButton = ({ children, onPress, style, activeOpacity = 0.8, disabled = false }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4
        }).start();
    };

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity 
                onPress={onPress} 
                onPressIn={onPressIn} 
                onPressOut={onPressOut} 
                activeOpacity={activeOpacity}
                disabled={disabled}
                style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

const FormInput = ({ label, value, onChangeText, placeholder, multiline = false, optional = false, isNumber = false, error, colors, onFocus, inputRef, onLayout }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.formGroup} onLayout={onLayout}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label} {!optional && <Text style={{ color: colors.error }}>*</Text>}
      </Text>
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          multiline && styles.textArea,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: error ? colors.error : (isFocused ? colors.inputBorderFocus : colors.inputBorder),
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        value={String(value)}
        onChangeText={onChangeText}
        multiline={multiline}
        onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
        }}
        onBlur={() => setIsFocused(false)}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={isNumber ? "numeric" : "default"}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// --- Main Component ---

export default function ProjectSubmissionForm({ visible, onClose, onSuccess, user, initialData = null }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const isEdit = !!initialData;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Refs for Scroll and Inputs
  const scrollViewRef = useRef(null);
  const inputRefs = useRef({});
  const fieldOffsets = useRef({});

  // Animation Values
  const slideAnim = useRef(new Animated.Value(0)).current; // For step transitions
  const progressAnim = useRef(new Animated.Value(1/3)).current; // For progress bar

  const getInitialTeam = () => {
      if(initialData && initialData.teamMembers) {
          return initialData.teamMembers.split(',').map(m => {
              const [name, role] = m.trim().split('(');
              return { 
                  id: Math.random().toString(36).substr(2, 9),
                  name: name.trim(), 
                  role: role ? role.replace(')', '').trim() : '',
                  anim: new Animated.Value(1) // Already existing, start at 1
              };
          });
      }
      return [{ 
          id: Math.random().toString(36).substr(2, 9),
          name: '', 
          role: '', 
          anim: new Animated.Value(1) 
      }];
  };

  const [formData, setFormData] = useState({
    projectName: initialData?.projectName || initialData?.name || '',
    shortDescription: initialData?.shortDescription || '',
    developmentStage: initialData ? getStageNumericValue(initialData.developmentStage) : '',
    problemStatement: initialData?.problemStatement || '',
    solutionDescription: initialData?.solutionDescription || '',
    targetCustomers: initialData?.targetCustomers || '',
    uniqueValueProposition: initialData?.uniqueValueProposition || '',
    marketSize: initialData?.marketSize || '',
    businessModel: initialData?.businessModel || '',
    revenue: initialData?.revenue || '',
    competitors: initialData?.competitors || '',
    teamMembers: getInitialTeam(),
    keySkills: initialData?.keySkills || '',
    teamExperience: initialData?.teamExperience || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isIdea = String(formData.developmentStage) === '0';
  const isMVP = String(formData.developmentStage) === '1';
  const isGrowth = String(formData.developmentStage) === '2';

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Team Management with Animations
  const addTeamMember = () => {
    const newMember = { 
        id: Math.random().toString(36).substr(2, 9),
        name: '', 
        role: '', 
        anim: new Animated.Value(0) 
    };
    setFormData(prev => ({ ...prev, teamMembers: [...prev.teamMembers, newMember] }));
    
    Animated.parallel([
        Animated.timing(newMember.anim, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        })
    ]).start();
  };

  const removeTeamMember = (index) => {
    if (formData.teamMembers.length <= 1) return;
    const member = formData.teamMembers[index];
    
    Animated.timing(member.anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
    }).start(() => {
        setFormData(prev => {
            const newMembers = [...prev.teamMembers];
            newMembers.splice(index, 1);
            return { ...prev, teamMembers: newMembers };
        });
    });
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...formData.teamMembers];
    newMembers[index][field] = value;
    setFormData(prev => ({ ...prev, teamMembers: newMembers }));
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.projectName.trim()) newErrors.projectName = 'Tên dự án là bắt buộc';
      if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Mô tả ngắn là bắt buộc';
      if (formData.developmentStage === '') newErrors.developmentStage = 'Vui lòng chọn giai đoạn phát triển';
      if (!formData.problemStatement.trim()) newErrors.problemStatement = 'Mô tả vấn đề là bắt buộc';
    }

    if (currentStep === 2) {
      if (!formData.solutionDescription.trim()) newErrors.solutionDescription = 'Mô tả giải pháp là bắt buộc';
      if (!formData.targetCustomers.trim()) newErrors.targetCustomers = 'Mục tiêu là bắt buộc';
      
      if (isMVP || isGrowth) {
        if (!formData.uniqueValueProposition?.trim()) newErrors.uniqueValueProposition = 'UVP là bắt buộc';
        if (!formData.businessModel?.trim()) newErrors.businessModel = 'Mô hình kinh doanh là bắt buộc';
      }

      if (isGrowth) {
        if (!formData.revenue || parseInt(formData.revenue) <= 0) newErrors.revenue = 'Doanh thu > 0';
        if (!formData.marketSize || parseInt(formData.marketSize) <= 0) newErrors.marketSize = 'Thị trường > 0';
      }
    }

    if (currentStep === 3) {
      const hasEmptyMembers = formData.teamMembers.some(m => !m.name.trim());
      if (hasEmptyMembers) newErrors.teamMembers = 'Nhập tên thành viên';

      if (isMVP || isGrowth) {
        if (!formData.competitors?.trim()) newErrors.competitors = 'Bắt buộc';
        if (!formData.keySkills?.trim()) newErrors.keySkills = 'Bắt buộc';
      }

      if (isGrowth) {
        if (!formData.teamExperience?.trim()) newErrors.teamExperience = 'Bắt buộc';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step Transitions
  const animateToStep = (nextStep, direction) => {
    const toValue = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    
    // 1. Reset slideAnim to opposite side or 0
    slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);

    // 2. Animate
    Animated.parallel([
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
        }),
        Animated.timing(progressAnim, {
            toValue: nextStep / totalSteps,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        })
    ]).start();

    setCurrentStep(nextStep);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleNext = () => {
    if (currentStep < totalSteps && validateStep()) {
        animateToStep(currentStep + 1, 'next');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
        animateToStep(currentStep - 1, 'prev');
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        developmentStage: parseInt(formData.developmentStage),
        marketSize: parseInt(formData.marketSize) || 0,
        revenue: parseInt(formData.revenue) || 0,
        teamMembers: formData.teamMembers
          .filter(m => m.name.trim())
          .map(m => m.role.trim() ? `${m.name.trim()} (${m.role.trim()})` : m.name.trim())
          .join(', '),
      };
      
      const response = isEdit 
        ? await projectSubmissionService.updateProject(initialData.projectId || initialData.id, payload)
        : await projectSubmissionService.submitStartupInfo(payload);
        
      if (response && response.success) {
        onSuccess?.(formData);
      } else {
        setSubmitError(response?.message || 'Lỗi khi gửi dự án.');
      }
    } catch (error) {
      setSubmitError(error?.message || 'Không thể kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard scrollToField helper
  const scrollToField = (fieldName) => {
    const offset = fieldOffsets.current[fieldName];
    if (offset !== undefined && scrollViewRef.current) {
        // Scroll a bit past the offset to ensure input area is cleared from the top, 
        // but not too much that it goes under the footer.
        // We target the input to be more visible.
        scrollViewRef.current.scrollTo({ y: Math.max(0, offset - 10), animated: true });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: colors.card }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.closeBtnContainer}>
                <ScaleButton onPress={onClose} style={styles.closeBtn}>
                    <X size={20} color={colors.text} />
                </ScaleButton>
            </View>
            <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isEdit ? 'Cập Nhật Dự Án' : 'Đăng Dự Án'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
                    Bước {currentStep} / {totalSteps}
                </Text>
            </View>
            <View style={{ width: 44 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.mutedBackground, opacity: 0.3 }]}>
                <Animated.View 
                    style={[
                        styles.progressFill, 
                        { 
                            backgroundColor: colors.primary, 
                            transform: [{ scaleX: progressAnim }],
                            width: '100%',
                            transformOrigin: 'left' 
                        }
                    ]} 
                />
            </View>
        </View>

        <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {submitError ? (
                    <View style={[styles.errorBanner, { backgroundColor: activeTheme.dark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', borderColor: colors.error }]}>
                        <AlertCircle size={20} color={colors.error} />
                        <Text style={[styles.errorBannerText, { color: colors.error }]}>{submitError}</Text>
                    </View>
                ) : null}

                {currentStep === 1 && (
                    <View>
                        <FormInput 
                            inputRef={ref => inputRefs.current['projectName'] = ref}
                            label="Tên Dự Án" 
                            value={formData.projectName}
                            onChangeText={(val) => handleInputChange('projectName', val)}
                            placeholder="Ví dụ: AI Smart" 
                            onFocus={() => scrollToField('projectName')}
                            onLayout={(e) => fieldOffsets.current['projectName'] = e.nativeEvent.layout.y}
                            error={errors.projectName}
                            colors={colors}
                        />
                        <FormInput 
                            inputRef={ref => inputRefs.current['shortDescription'] = ref}
                            label="Mô Tả Ngắn" 
                            value={formData.shortDescription}
                            onChangeText={(val) => handleInputChange('shortDescription', val)}
                            placeholder="Tóm tắt về sản phẩm của bạn..." 
                            multiline={true}
                            onFocus={() => scrollToField('shortDescription')}
                            onLayout={(e) => fieldOffsets.current['shortDescription'] = e.nativeEvent.layout.y}
                            error={errors.shortDescription}
                            colors={colors}
                        />
                        
                        <View style={styles.formGroup} onLayout={(e) => fieldOffsets.current['developmentStage'] = e.nativeEvent.layout.y}>
                            <Text style={[styles.label, { color: colors.text }]}>Giai Đoạn Phát Triển <Text style={{ color: colors.error }}>*</Text></Text>
                            <View style={styles.stageChips}>
                                {[
                                    { label: 'Ý Tưởng', val: 0 }, 
                                    { label: 'MVP', val: 1 }, 
                                    { label: 'Vận hành', val: 2 }
                                ].map(stg => (
                                    <ScaleButton
                                        key={stg.val}
                                        onPress={() => handleInputChange('developmentStage', stg.val)}
                                        style={[
                                            styles.chip, 
                                            formData.developmentStage === stg.val 
                                                ? { backgroundColor: colors.primary, borderColor: colors.primary } 
                                                : { backgroundColor: 'transparent', borderColor: colors.inputBorder }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.chipText, 
                                            { color: formData.developmentStage === stg.val ? '#fff' : colors.text }
                                        ]}>
                                            {stg.label}
                                        </Text>
                                    </ScaleButton>
                                ))}
                            </View>
                            {errors.developmentStage && <Text style={styles.errorText}>{errors.developmentStage}</Text>}
                        </View>

                        <FormInput 
                            inputRef={ref => inputRefs.current['problemStatement'] = ref}
                            label="Vấn Đề Giải Quyết" 
                            value={formData.problemStatement}
                            onChangeText={(val) => handleInputChange('problemStatement', val)}
                            placeholder="Thị trường đang thiếu gì?" 
                            multiline={true}
                            onFocus={() => scrollToField('problemStatement')}
                            onLayout={(e) => fieldOffsets.current['problemStatement'] = e.nativeEvent.layout.y}
                            error={errors.problemStatement}
                            colors={colors}
                        />
                    </View>
                )}

                {currentStep === 2 && (
                    <View>
                        <FormInput 
                            inputRef={ref => inputRefs.current['solutionDescription'] = ref}
                            label="Mô Tả Giải Pháp" 
                            value={formData.solutionDescription}
                            onChangeText={(val) => handleInputChange('solutionDescription', val)}
                            placeholder="Giải pháp của bạn là gì?" 
                            multiline={true}
                            onFocus={() => scrollToField('solutionDescription')}
                            onLayout={(e) => fieldOffsets.current['solutionDescription'] = e.nativeEvent.layout.y}
                            error={errors.solutionDescription}
                            colors={colors}
                        />
                        <FormInput 
                            inputRef={ref => inputRefs.current['targetCustomers'] = ref}
                            label="Khách Hàng Mục Tiêu" 
                            value={formData.targetCustomers}
                            onChangeText={(val) => handleInputChange('targetCustomers', val)}
                            placeholder="Họ là ai? Ở đâu?" 
                            multiline={true}
                            onFocus={() => scrollToField('targetCustomers')}
                            onLayout={(e) => fieldOffsets.current['targetCustomers'] = e.nativeEvent.layout.y}
                            error={errors.targetCustomers}
                            colors={colors}
                        />
                        <FormInput 
                            inputRef={ref => inputRefs.current['uniqueValueProposition'] = ref}
                            label="Giá Trị Độc Đáo (UVP)" 
                            value={formData.uniqueValueProposition}
                            onChangeText={(val) => handleInputChange('uniqueValueProposition', val)}
                            placeholder="Khác biệt so với đối thủ?" 
                            multiline={true}
                            onFocus={() => scrollToField('uniqueValueProposition')}
                            onLayout={(e) => fieldOffsets.current['uniqueValueProposition'] = e.nativeEvent.layout.y}
                            optional={isIdea}
                            error={errors.uniqueValueProposition}
                            colors={colors}
                        />
                        
                        {!isIdea && (
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <FormInput 
                                        inputRef={ref => inputRefs.current['marketSize'] = ref}
                                        label="Thị trường (VND)" 
                                        value={formData.marketSize}
                                        onChangeText={(val) => handleInputChange('marketSize', val)}
                                        placeholder="0" 
                                        optional={!isGrowth}
                                        isNumber={true}
                                        onFocus={() => scrollToField('marketSize')}
                                        onLayout={(e) => fieldOffsets.current['marketSize'] = e.nativeEvent.layout.y}
                                        error={errors.marketSize}
                                        colors={colors}
                                    />
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={{ flex: 1 }}>
                                    <FormInput 
                                        inputRef={ref => inputRefs.current['revenue'] = ref}
                                        label="Doanh thu (VND)" 
                                        value={formData.revenue}
                                        onChangeText={(val) => handleInputChange('revenue', val)}
                                        placeholder="0" 
                                        optional={!isGrowth}
                                        isNumber={true}
                                        onFocus={() => scrollToField('revenue')}
                                        onLayout={(e) => fieldOffsets.current['revenue'] = e.nativeEvent.layout.y}
                                        error={errors.revenue}
                                        colors={colors}
                                    />
                                </View>
                            </View>
                        )}
                        
                        <FormInput 
                            inputRef={ref => inputRefs.current['businessModel'] = ref}
                            label="Mô Hình Kinh Doanh" 
                            value={formData.businessModel}
                            onChangeText={(val) => handleInputChange('businessModel', val)}
                            placeholder="Bạn kiếm tiền từ đâu?" 
                            multiline={true}
                            onFocus={() => scrollToField('businessModel')}
                            onLayout={(e) => fieldOffsets.current['businessModel'] = e.nativeEvent.layout.y}
                            optional={isIdea}
                            error={errors.businessModel}
                            colors={colors}
                        />
                    </View>
                )}

                {currentStep === 3 && (
                    <View>
                        <FormInput 
                            inputRef={ref => inputRefs.current['competitors'] = ref}
                            label="Đối thủ cạnh tranh" 
                            value={formData.competitors}
                            onChangeText={(val) => handleInputChange('competitors', val)}
                            placeholder="Ai đang làm giống bạn?" 
                            multiline={true}
                            onFocus={() => scrollToField('competitors')}
                            onLayout={(e) => fieldOffsets.current['competitors'] = e.nativeEvent.layout.y}
                            optional={isIdea}
                            error={errors.competitors}
                            colors={colors}
                        />
                        
                        <View style={styles.formGroup} onLayout={(e) => fieldOffsets.current['teamMembers'] = e.nativeEvent.layout.y}>
                            <View style={styles.teamHeader}>
                                <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
                                    Thành Viên <Text style={{ color: colors.error }}>*</Text>
                                </Text>
                                <ScaleButton 
                                    onPress={addTeamMember}
                                    style={[styles.addBtn, { backgroundColor: colors.primary, width: 90, height: 32 }]} 
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Plus size={14} color="#fff" />
                                        <Text style={styles.addBtnText}>Thêm</Text>
                                    </View>
                                </ScaleButton>
                            </View>
                            {formData.teamMembers.map((member, idx) => (
                                <Animated.View 
                                    key={member.id} 
                                    style={[
                                        styles.memberRow,
                                        { 
                                            opacity: member.anim,
                                            transform: [{
                                                translateY: member.anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [12, 0]
                                                })
                                            }]
                                        }
                                    ]}
                                >
                                    <View style={{ flex: 1 }}>
                                        <TextInput 
                                            style={[
                                                styles.input, 
                                                { 
                                                    backgroundColor: colors.inputBackground, 
                                                    color: colors.text, 
                                                    borderColor: colors.inputBorder,
                                                    paddingVertical: 10
                                                }
                                            ]} 
                                            placeholder="Tên" 
                                            placeholderTextColor={colors.secondaryText}
                                            value={member.name} 
                                            onChangeText={(v) => handleMemberChange(idx, 'name', v)} 
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <TextInput 
                                            style={[
                                                styles.input, 
                                                { 
                                                    backgroundColor: colors.inputBackground, 
                                                    color: colors.text, 
                                                    borderColor: colors.inputBorder,
                                                    paddingVertical: 10
                                                }
                                            ]} 
                                            placeholder="Vai trò" 
                                            placeholderTextColor={colors.secondaryText}
                                            value={member.role} 
                                            onChangeText={(v) => handleMemberChange(idx, 'role', v)} 
                                        />
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.removeBtn} 
                                        onPress={() => removeTeamMember(idx)} 
                                        disabled={formData.teamMembers.length <= 1}
                                        hitSlop={10}
                                    >
                                        <Trash2 size={18} color={formData.teamMembers.length <= 1 ? colors.border : colors.destructive} />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                            {errors.teamMembers && <Text style={styles.errorText}>{errors.teamMembers}</Text>}
                        </View>

                        <FormInput 
                            inputRef={ref => inputRefs.current['keySkills'] = ref}
                            label="Kỹ năng cốt lõi" 
                            value={formData.keySkills}
                            onChangeText={(val) => handleInputChange('keySkills', val)}
                            placeholder="Ví dụ: AI, Sales, Blockchain..." 
                            onFocus={() => scrollToField('keySkills')}
                            onLayout={(e) => fieldOffsets.current['keySkills'] = e.nativeEvent.layout.y}
                            optional={isIdea}
                            error={errors.keySkills}
                            colors={colors}
                        />
                        <FormInput 
                            inputRef={ref => inputRefs.current['teamExperience'] = ref}
                            label="Kinh nghiệm đội" 
                            value={formData.teamExperience}
                            onChangeText={(val) => handleInputChange('teamExperience', val)}
                            placeholder="Các dự án nổi bật trước đây..." 
                            multiline={true}
                            onFocus={() => scrollToField('teamExperience')}
                            onLayout={(e) => fieldOffsets.current['teamExperience'] = e.nativeEvent.layout.y}
                            optional={!isGrowth}
                            error={errors.teamExperience}
                            colors={colors}
                        />
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>
        </Animated.View>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            {currentStep > 1 ? (
                <View style={styles.footerRow}>
                    <View style={{ flex: 1 }}>
                        <ScaleButton 
                            style={[styles.footerBtn, styles.outlineBtn, { borderColor: colors.inputBorder, height: 48 }]} 
                            onPress={handlePrevious}
                        >
                            <Text style={[styles.footerBtnText, { color: colors.text, fontWeight: '600' }]}>Quay Lại</Text>
                        </ScaleButton>
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 2 }}>
                        <ScaleButton 
                            style={[styles.footerBtn, { backgroundColor: colors.primary, height: 48 }]} 
                            onPress={currentStep < totalSteps ? handleNext : handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={[styles.footerBtnText, { color: '#fff', fontWeight: '700' }]}>
                                    {currentStep < totalSteps ? 'Tiếp Theo' : 'Hoàn Thành'}
                                </Text>
                            )}
                        </ScaleButton>
                    </View>
                </View>
            ) : (
                <ScaleButton 
                    style={[styles.footerBtn, { backgroundColor: colors.primary, height: 48 }]} 
                    onPress={handleNext}
                >
                    <Text style={[styles.footerBtnText, { color: '#fff', fontWeight: '700' }]}>Tiếp Theo</Text>
                </ScaleButton>
            )}
        </View>

      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      paddingTop: Platform.OS === 'ios' ? 48 : 12,
  },
  closeBtnContainer: {
    width: 44,
    height: 44,
    marginLeft: -10,
  },
  closeBtn: { 
    width: 44, 
    height: 44,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: '700',
    textAlign: 'center'
  },
  headerSubtitle: { 
    fontSize: 13, 
    marginTop: 2,
    textAlign: 'center'
  },
  progressContainer: {
    paddingTop: 0,
    marginBottom: 24,
  },
  progressTrack: { 
    height: 4, 
    width: '100%',
  },
  progressFill: { 
    height: '100%',
    borderRadius: 2,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  errorBanner: {
      flexDirection: 'row',
      borderWidth: 1.5,
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
      alignItems: 'center',
  },
  errorBannerText: { marginLeft: 8, flex: 1, fontSize: 13, fontWeight: '500' },
  formGroup: { marginBottom: 20 },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 6 
  },
  input: {
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
  },
  textArea: { 
    minHeight: 100, 
    textAlignVertical: 'top' 
  },
  errorText: { 
    color: '#ef4444', 
    fontSize: 12, 
    marginTop: 6,
    fontWeight: '500'
  },
  stageChips: { 
    flexDirection: 'row', 
    gap: 8 
  },
  chip: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
  },
  chipText: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  teamHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  addBtn: { 
    borderRadius: 20,
    overflow: 'hidden' 
  },
  addBtnText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '600', 
    marginLeft: 4 
  },
  memberRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    gap: 8 
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  removeBtn: { 
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footer: { 
    padding: 16, 
    borderTopWidth: 1, 
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerBtn: {
      width: '100%',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  footerBtnText: { 
    fontSize: 16, 
  },
});
