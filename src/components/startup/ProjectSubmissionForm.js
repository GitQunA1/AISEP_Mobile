import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, TextInput, Modal, ScrollView, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Animated, Easing, Image, StatusBar, Switch, Keyboard
} from 'react-native';
import { X, AlertCircle, Plus, Trash2, Upload, FileText, ChevronDown, Check, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import projectSubmissionService from '../../services/projectSubmissionService';
import validationService from '../../services/validationService';
import optionService from '../../services/optionService';
import * as ImagePicker from 'expo-image-picker';
import { SCORECARD_SECTIONS, SCORECARD_BOOLEAN_FIELD, scorecardFromApiToFormState } from '../../constants/projectScorecard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getStageNumericValue = (val) => {
    if (val === 'Idea' || val === '0' || val === 0) return 0;
    if (val === 'MVP' || val === '1' || val === 1) return 1;
    if (val === 'Growth' || val === '2' || val === 2) return 2;
    return '';
};

const ScaleButton = ({ children, onPress, style, activeOpacity = 0.8, disabled = false }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
                activeOpacity={activeOpacity} disabled={disabled}
                style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

const FormInput = ({ label, name, value, onChangeText, validationRule, currentStage, placeholder, multiline = false, isNumber = false, error, colors, inputRef, onLayout }) => {
    const { isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const currentLength = value ? String(value).length : 0;
    const maxLength = validationRule?.maxLength;
    const minLength = validationRule?.minLength;
    const isOverLimit = maxLength && currentLength > maxLength;
    const isUnderLimit = minLength && currentLength > 0 && currentLength < minLength;

    // Determine if the field is required based on stage (matching DynamicInputField logic)
    let isRequired = validationRule?.required;
    if (currentStage !== null && currentStage !== undefined && validationRule?.stageOptionIds && validationRule.stageOptionIds.length > 0) {
        const stageId = Number(currentStage);
        const isStageInList = validationRule.stageOptionIds.some(id => Number(id) === stageId);
        isRequired = isStageInList ? validationRule.required : !validationRule.required;
    }

    const displayLabel = validationRule?.displayName || label || validationRule?.fieldKey || name;

    return (
        <View style={styles.formGroup} onLayout={onLayout}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginLeft: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                    {displayLabel} {!isRequired ? <Text style={styles.optional}>(Tùy chọn)</Text> : <Text style={{ color: colors.error }}>*</Text>}
                </Text>
                
                {maxLength ? (
                    <Text style={{ fontSize: 12, color: isOverLimit ? colors.error : colors.secondaryText, backgroundColor: isOverLimit ? colors.error + '15' : colors.mutedBackground, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>
                        {currentLength}/{maxLength}
                    </Text>
                ) : (
                    currentLength > 0 && (
                        <Text style={{ fontSize: 12, color: colors.secondaryText, backgroundColor: colors.mutedBackground, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>
                            {currentLength} ký tự
                        </Text>
                    )
                )}
            </View>
            <TextInput
                ref={inputRef}
                style={[
                    styles.input, 
                    multiline && styles.textArea, 
                    {
                        backgroundColor: isFocused ? colors.card : (colors.inputBackground || colors.mutedBackground), 
                        color: colors.text,
                        borderColor: error ? colors.error : (isFocused ? colors.primary : (colors.inputBorder || colors.border)),
                        shadowColor: isDark ? "#fff" : (isFocused ? colors.primary : "#000"),
                        shadowOffset: { width: 0, height: isFocused ? 2 : 1 },
                        shadowOpacity: isDark ? (isFocused ? 0.15 : 0.08) : (isFocused ? 0.15 : 0.05),
                        shadowRadius: isFocused ? 4 : 2,
                        elevation: isFocused ? 4 : 2,
                    }
                ]}
                placeholder={placeholder}
                placeholderTextColor={colors.secondaryText}
                value={String(value)}
                onChangeText={(val) => onChangeText(name, val)}
                multiline={multiline}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                textAlignVertical={multiline ? 'top' : 'center'}
                keyboardType={isNumber ? "numeric" : "default"}
            />
            {isUnderLimit && !error && (
                <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>Cần ít nhất {minLength} ký tự</Text>
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
};

// Simple custom select using a Modal to mimic a native picker
const CustomSelect = ({ label, value, options, onValueChange, colors, error, optional }) => {
    const { isDark } = useTheme();
    const [open, setOpen] = useState(false);
    const insets = useSafeAreaInsets();
    const selected = options.find(o => String(o.value) === String(value));

    const handleOpen = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setOpen(true);
    };

    const handleSelect = (val) => {
        Haptics.selectionAsync();
        onValueChange(val);
        setOpen(false);
    };

    return (
        <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
                {label} {!optional && <Text style={{ color: colors.error }}>*</Text>}
            </Text>
            <TouchableOpacity 
                style={[
                    styles.input, 
                    { 
                        backgroundColor: colors.inputBackground, 
                        borderColor: error ? colors.error : colors.inputBorder,
                        justifyContent: 'center',
                        // Subtle 3D effect
                        shadowColor: isDark ? "#fff" : "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDark ? 0.08 : 0.05,
                        shadowRadius: 2,
                        elevation: 2,
                    }
                ]}
                onPress={handleOpen}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: selected ? colors.text : colors.secondaryText, fontSize: 15 }}>{selected ? selected.label : "Chọn..."}</Text>
                    <ChevronDown size={18} color={colors.secondaryText} />
                </View>
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setOpen(false)}
                >
                    <View style={[styles.pickerSheet, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <View style={styles.pickerHandleContainer}>
                            <View style={[styles.pickerHandle, { backgroundColor: colors.border }]} />
                        </View>

                        <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.pickerHeaderText, { color: colors.text }]}>{label}</Text>
                            <TouchableOpacity onPress={() => setOpen(false)} style={styles.pickerCloseBtn}>
                                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>Xong</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }} bounces={false}>
                            {options.map((opt) => {
                                const isActive = String(opt.value) === String(value);
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        activeOpacity={0.7}
                                        style={[
                                            styles.pickerItem, 
                                            isActive && { backgroundColor: colors.primaryLight },
                                            { borderBottomColor: colors.border }
                                        ]}
                                        onPress={() => handleSelect(opt.value)}
                                    >
                                        <Text style={{ 
                                            color: isActive ? colors.primary : colors.text, 
                                            fontWeight: isActive ? '700' : '400',
                                            fontSize: 17
                                        }}>
                                            {opt.label}
                                        </Text>
                                        {isActive && <Check size={20} color={colors.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const ScorecardRadioGroup = ({ field, value, onChange, colors }) => {
    return (
        <View style={styles.scorecardGroup}>
            <Text style={[styles.scorecardLabel, { color: colors.text }]}>{field.label}</Text>
            {field.options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={[
                            styles.scorecardOption,
                            { 
                                backgroundColor: isSelected ? colors.primaryLight : colors.inputBackground,
                                borderColor: isSelected ? colors.primary : colors.inputBorder
                            }
                        ]}
                        onPress={() => onChange(field.key, opt.value)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[
                                styles.radioCircle,
                                { borderColor: isSelected ? colors.primary : colors.secondaryText }
                            ]}>
                                {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[
                                    styles.optionLabel,
                                    { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '600' }
                                ]}>
                                    {opt.label}
                                </Text>
                                <Text style={[styles.optionHelper, { color: colors.secondaryText }]}>
                                    {opt.helper}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default function ProjectSubmissionForm({ visible, onClose, onSuccess, user, initialData = null, isPage = false }) {
    const { activeTheme, isDark } = useTheme();
    const colors = activeTheme.colors;
    const isEdit = !!initialData;
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3; // Step 1: Basic, Step 2: Detailed & Business Model, Step 3: Scorecard
    const isExpoGo = Constants.appOwnership === 'expo';
    const shouldEnableKeyboardAvoiding =
        Platform.OS === 'ios' || (Platform.OS === 'android' && isExpoGo && isKeyboardVisible);

    const scrollViewRef = useRef(null);
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(1 / 3)).current;

    const [formData, setFormData] = useState({
        projectName: initialData?.projectName || initialData?.name || '',
        shortDescription: initialData?.shortDescription || initialData?.description || '',
        developmentStage: initialData ? String(getStageNumericValue(initialData.developmentStage || initialData.stage)) : '',
        industry: initialData?.industry ? String(initialData.industry) : '',
        problemStatement: initialData?.problemStatement || initialData?.problemDescription || '',
        solutionDescription: initialData?.solutionDescription || initialData?.proposedSolution || initialData?.solution || '',
        targetCustomers: initialData?.targetCustomers || initialData?.idealCustomerBuyer || '',
        uniqueValueProposition: initialData?.uniqueValueProposition || initialData?.differentiator || '',
        marketSize: initialData?.marketSize ? String(initialData.marketSize) : '',
        businessModel: initialData?.businessModel || initialData?.revenueMethod || '',
        revenue: initialData?.revenue ? String(initialData.revenue) : '',
        competitors: initialData?.competitors || '',
        vision: initialData?.vision || '',
        mission: initialData?.mission || '',
        coreValues: initialData?.coreValues || '',
        roadmapText: initialData?.roadmapText || '',
        fundingStatus: initialData?.fundingStatus || '',
        website: initialData?.website || '',
        facebook: initialData?.facebook || '',
        linkedin: initialData?.linkedin || '',
        videoUrl: initialData?.videoUrl || '',
        projectImageFile: null,
        // Scorecard
        projectScorecard: scorecardFromApiToFormState(initialData?.projectScorecard || initialData?.ProjectScorecard)
    });

    const [imagePreview, setImagePreview] = useState(initialData?.projectImageUrl || initialData?.projectImage || null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    
    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const [configError, setConfigError] = useState('');
    const [validationRules, setValidationRules] = useState(null);
    const [industries, setIndustries] = useState([]);
    const [stages, setStages] = useState([]);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const fetchConfig = async () => {
        try {
            setIsConfigLoading(true);
            setConfigError('');
            const formKey = isEdit ? 'project.update' : 'project.create';
            let [rules, fetchedIndustries, fetchedStages] = await Promise.all([
                validationService.getFormRules(formKey),
                optionService.getIndustries(),
                optionService.getStages()
            ]);
            
            if (isEdit && (!rules || Object.keys(rules).length === 0)) {
                rules = await validationService.getFormRules('project.create');
            }

            if (!rules || Object.keys(rules).length === 0) {
                throw new Error('Không thể tải dữ liệu cấu hình biểu mẫu.');
            }
            
            setValidationRules(rules);
            setIndustries(fetchedIndustries || []);
            setStages(fetchedStages || []);
        } catch (error) {
            console.error('Config fetch error:', error);
            setConfigError('Không thể tải cấu hình biểu mẫu. Vui lòng thử lại.');
        } finally {
            setIsConfigLoading(false);
        }
    };

    useEffect(() => {
        if (visible && initialData) {
            console.log('[ProjectSubmissionForm] Filling form with initialData:', initialData.projectId || initialData.id);
            setFormData({
                projectName: initialData?.projectName || initialData?.name || '',
                shortDescription: initialData?.shortDescription || initialData?.description || '',
                developmentStage: initialData ? String(getStageNumericValue(initialData.developmentStage || initialData.stage)) : '',
                industry: initialData?.industry || initialData?.industryOptionId ? String(initialData.industry || initialData.industryOptionId) : '',
                problemStatement: initialData?.problemStatement || initialData?.problemDescription || '',
                solutionDescription: initialData?.solutionDescription || initialData?.proposedSolution || initialData?.solution || '',
                targetCustomers: initialData?.targetCustomers || initialData?.idealCustomerBuyer || '',
                uniqueValueProposition: initialData?.uniqueValueProposition || initialData?.differentiator || '',
                marketSize: initialData?.marketSize ? String(initialData.marketSize) : '',
                businessModel: initialData?.businessModel || initialData?.revenueMethod || '',
                revenue: initialData?.revenue ? String(initialData.revenue) : '',
                competitors: initialData?.competitors || '',
                vision: initialData?.vision || '',
                mission: initialData?.mission || '',
                coreValues: initialData?.coreValues || '',
                roadmapText: initialData?.roadmapText || '',
                fundingStatus: initialData?.fundingStatus || '',
                website: initialData?.website || '',
                facebook: initialData?.facebook || '',
                linkedin: initialData?.linkedin || '',
                videoUrl: initialData?.videoUrl || '',
                projectImageFile: null,
                projectScorecard: scorecardFromApiToFormState(initialData?.projectScorecard || initialData?.ProjectScorecard)
            });
            setImagePreview(initialData?.projectImageUrl || initialData?.projectImage || null);
        } else if (visible && !isEdit) {
            // New project - reset form
            setFormData({
                projectName: '',
                shortDescription: '',
                developmentStage: '',
                industry: '',
                problemStatement: '',
                solutionDescription: '',
                targetCustomers: '',
                uniqueValueProposition: '',
                marketSize: '',
                businessModel: '',
                revenue: '',
                competitors: '',
                vision: '',
                mission: '',
                coreValues: '',
                roadmapText: '',
                fundingStatus: '',
                website: '',
                facebook: '',
                linkedin: '',
                videoUrl: '',
                projectImageFile: null,
                projectScorecard: scorecardFromApiToFormState(null)
            });
            setImagePreview(null);
            setCurrentStep(1);
        }
    }, [visible, initialData]);

    useEffect(() => {
        if (visible || isPage) fetchConfig();
    }, [visible, isPage]);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleInputChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleScorecardChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            projectScorecard: {
                ...prev.projectScorecard,
                [key]: value
            }
        }));
    };

    const handleImagePick = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const filename = asset.uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;
            setImagePreview(asset.uri);
            setFormData(prev => ({
                ...prev,
                projectImageFile: { uri: asset.uri, name: filename, type }
            }));
            if (errors.projectImageFile) setErrors(prev => ({ ...prev, projectImageFile: '' }));
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, projectImageFile: null }));
    };


    // Helper to check if a field is required based on current stage
    const isFieldRequired = (ruleKey) => {
        if (!validationRules) return false;
        const rule = validationRules[ruleKey.toLowerCase()];
        if (!rule) return false;
        
        let required = rule.required;
        if (formData.developmentStage !== '' && rule.stageOptionIds && rule.stageOptionIds.length > 0) {
            const stageId = Number(formData.developmentStage);
            const isStageInList = rule.stageOptionIds.some(id => Number(id) === stageId);
            required = isStageInList ? rule.required : !rule.required;
        }
        return required;
    };

    const validateStep = () => {
        if (!validationRules) return true;

        const stepFields = {
            1: ['projectName', 'shortDescription', 'developmentStage', 'industry', 'problemStatement'],
            2: ['solutionDescription', 'targetCustomers', 'uniqueValueProposition', 'businessModel', 'competitors'],
            3: [] // Scorecard validated separately below
        };

        const currentFields = stepFields[currentStep] || [];
        const newErrors = {};

        currentFields.forEach(name => {
            const val = formData[name];
            const ruleKey = (name === 'industry' ? 'industryoptionid' : (name === 'developmentStage' ? 'stageoptionid' : name)).toLowerCase();
            const rule = validationRules[ruleKey];
            
            if (rule) {
                const error = validationService.validateField(val, rule, formData.developmentStage);
                if (error) newErrors[name] = error;
            }
        });

        if (currentStep === 1 && !imagePreview && isFieldRequired('projectimagefile')) {
            newErrors.projectImageFile = 'Vui lòng chọn hình ảnh dự án';
        }

        if (currentStep === 3) {
            // Validate scorecard fields dynamically from rules
            Object.keys(validationRules).forEach(ruleKey => {
                const rule = validationRules[ruleKey];
                // Scorecard fields are typically individual keys in the root project object or mapped here
                // Check if this rule applies to a scorecard field in formData.projectScorecard
                const scorecardFields = ['teamSize', 'teamExperience', 'targetMarketSize', 'marketGrowth', 'productReadiness', 'ipProtection', 'barrierToEntry', 'currentTraction', 'runwayMonths', 'hasTechnicalCofounder'];
                
                const fieldName = scorecardFields.find(f => f.toLowerCase() === ruleKey);
                if (fieldName) {
                    const val = formData.projectScorecard[fieldName];
                    const error = validationService.validateField(val, rule, formData.developmentStage);
                    if (error) {
                        newErrors.scorecard = 'Vui lòng hoàn thành tất cả các mục đánh giá bắt buộc';
                        newErrors[fieldName] = error;
                    }
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const animateToStep = (nextStep, direction) => {
        slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(progressAnim, { toValue: nextStep / totalSteps, duration: 300, useNativeDriver: true })
        ]).start();
        setCurrentStep(nextStep);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    };

    const handleNext = () => { if (currentStep < totalSteps && validateStep()) animateToStep(currentStep + 1, 'next'); };
    const handlePrevious = () => { if (currentStep > 1) animateToStep(currentStep - 1, 'prev'); };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsSubmitting(true);
        setSubmitError('');
        try {
            // Sync scorecard values into root for validation/mapping if needed
            const submitData = {
                ...formData,
                projectName: formData.projectName.trim(),
                shortDescription: formData.shortDescription.trim(),
                developmentStage: parseInt(formData.developmentStage),
                industry: parseInt(formData.industry) || 0,
            };

            const response = isEdit
                ? await projectSubmissionService.updateProject(initialData.projectId || initialData.id, submitData)
                : await projectSubmissionService.submitStartupInfo(submitData);

            if (response && response.success) {
                onSuccess?.(formData);
            } else {
                setSubmitError(response?.message || 'Đã xảy ra lỗi khi lưu dự án.');
            }
        } catch (error) {
            setSubmitError(error?.message || 'Lỗi kết nối máy chủ.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const content = (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: colors.card }} 
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            enabled={Platform.OS === 'ios' ? true : isKeyboardVisible}
        >
            {/* Header */}
            <View style={[
                styles.header, 
                { 
                    borderBottomColor: colors.border, 
                    paddingTop: Math.max(insets.top, 10)
                }
            ]}>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={24} color={colors.text} /></TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? 'Cập Nhật Dự Án' : 'Đăng Dự Án'}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>Bước {currentStep} / {totalSteps}</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressTrack, { backgroundColor: colors.mutedBackground }]}>
                    <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary, transform: [{ scaleX: progressAnim }], width: '100%', transformOrigin: 'left' }]} />
                </View>
            </View>

            <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
                <ScrollView 
                    ref={scrollViewRef} 
                    contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]} 
                    keyboardShouldPersistTaps="handled"
                >
                    {submitError ? (
                        <View style={[styles.errorBanner, { borderColor: colors.error }]}>
                            <AlertCircle size={20} color={colors.error} />
                            <Text style={[styles.errorBannerText, { color: colors.error }]}>{submitError}</Text>
                        </View>
                    ) : null}

                    {isConfigLoading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={{ marginTop: 12, color: colors.secondaryText }}>Đang tải cấu hình...</Text>
                        </View>
                    ) : (
                        <>
                            {currentStep === 1 && (
                                <View>
                                    <FormInput name="projectName" validationRule={validationRules?.['projectname']} currentStage={formData.developmentStage} label="Tên Dự Án" value={formData.projectName} onChangeText={handleInputChange} placeholder="Ví dụ: AI SEP" error={errors.projectName} colors={colors} />
                                    
                                    <View style={styles.formGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>
                                            Hình Ảnh Dự Án {isFieldRequired('projectimagefile') && <Text style={{ color: colors.error }}>*</Text>}
                                        </Text>
                                        <TouchableOpacity style={[styles.imageUploadBtn, { borderColor: errors.projectImageFile ? colors.error : colors.border, backgroundColor: imagePreview ? 'transparent' : colors.mutedBackground }]} onPress={handleImagePick}>
                                            {imagePreview ? (
                                                <View style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden' }}>
                                                    <Image source={{ uri: imagePreview }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                    <TouchableOpacity style={styles.removeImageBtn} onPress={handleRemoveImage}><Trash2 size={16} color="white" /></TouchableOpacity>
                                                </View>
                                            ) : (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Upload size={28} color={colors.primary} style={{ marginBottom: 4 }} />
                                                    <Text style={{ color: colors.text, fontWeight: '600' }}>Chọn hình ảnh</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    <FormInput name="shortDescription" validationRule={validationRules?.['shortdescription']} currentStage={formData.developmentStage} label="Mô Tả Ngắn" value={formData.shortDescription} onChangeText={handleInputChange} placeholder="Tóm tắt về dự án..." multiline error={errors.shortDescription} colors={colors} />
                                    <CustomSelect label="Giai Đoạn" value={formData.developmentStage} onValueChange={(val) => handleInputChange('developmentStage', val)} options={stages} error={errors.developmentStage} colors={colors} optional={!isFieldRequired('stageoptionid')} />
                                    <CustomSelect label="Lĩnh Vực" value={formData.industry} onValueChange={(val) => handleInputChange('industry', val)} options={industries} error={errors.industry} colors={colors} optional={!isFieldRequired('industryoptionid')} />
                                    <FormInput name="problemStatement" validationRule={validationRules?.['problemstatement']} currentStage={formData.developmentStage} label="Vấn Đề" value={formData.problemStatement} onChangeText={handleInputChange} placeholder="Vấn đề dự án giải quyết là gì?" multiline error={errors.problemStatement} colors={colors} />
                                </View>
                            )}

                            {currentStep === 2 && (
                                <View>
                                    <FormInput name="solutionDescription" validationRule={validationRules?.['solutiondescription']} currentStage={formData.developmentStage} label="Giải Pháp" value={formData.solutionDescription} onChangeText={handleInputChange} placeholder="Giải pháp của bạn là gì?" multiline error={errors.solutionDescription} colors={colors} />
                                    <FormInput name="targetCustomers" validationRule={validationRules?.['targetcustomers']} currentStage={formData.developmentStage} label="Khách Hàng" value={formData.targetCustomers} onChangeText={handleInputChange} placeholder="Đối tượng khách hàng..." multiline error={errors.targetCustomers} colors={colors} />
                                    <FormInput name="uniqueValueProposition" validationRule={validationRules?.['uniquevalueproposition']} currentStage={formData.developmentStage} label="Giá Trị Độc Đáo" value={formData.uniqueValueProposition} onChangeText={handleInputChange} placeholder="Tại sao khách hàng chọn bạn?" multiline error={errors.uniqueValueProposition} colors={colors} />
                                    <FormInput name="businessModel" validationRule={validationRules?.['businessmodel']} currentStage={formData.developmentStage} label="Mô Hình Kinh Doanh" value={formData.businessModel} onChangeText={handleInputChange} placeholder="Cách dự án kiếm tiền..." multiline error={errors.businessModel} colors={colors} />
                                    <FormInput name="competitors" validationRule={validationRules?.['competitors']} currentStage={formData.developmentStage} label="Đối Thủ" value={formData.competitors} onChangeText={handleInputChange} placeholder="Các đối thủ chính..." multiline error={errors.competitors} colors={colors} />
                                </View>
                            )}


                            {currentStep === 3 && (
                                <View>
                                    <View style={[styles.scorecardIntro, { backgroundColor: colors.primaryLight + '40' }]}>
                                        <Info size={20} color={colors.primary} />
                                        <Text style={[styles.scorecardIntroText, { color: colors.text }]}>
                                            Vui lòng hoàn thành bảng đánh giá dưới đây để hệ thống AI có cơ sở chấm điểm dự án của bạn chính xác nhất.
                                        </Text>
                                    </View>

                                    {SCORECARD_SECTIONS.map((section, sIdx) => (
                                        <View key={sIdx} style={styles.sectionContainer}>
                                            <View style={styles.sectionHeader}>
                                                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{section.title}</Text>
                                                <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>{section.subtitle}</Text>
                                            </View>

                                            {sIdx === 0 && (
                                                <View style={[styles.formGroup, styles.switchGroup]}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.label, { color: colors.text, marginBottom: 2 }]}>{SCORECARD_BOOLEAN_FIELD.label}</Text>
                                                        <Text style={{ fontSize: 12, color: colors.secondaryText }}>{SCORECARD_BOOLEAN_FIELD.helper}</Text>
                                                    </View>
                                                    <Switch
                                                        value={formData.projectScorecard.hasTechnicalCofounder}
                                                        onValueChange={(val) => handleScorecardChange('hasTechnicalCofounder', val)}
                                                        trackColor={{ false: colors.border, true: colors.primary }}
                                                        thumbColor={Platform.OS === 'ios' ? undefined : (formData.projectScorecard.hasTechnicalCofounder ? '#fff' : '#f4f3f4')}
                                                    />
                                                </View>
                                            )}

                                            {section.fields.map((field) => (
                                                <ScorecardRadioGroup
                                                    key={field.key}
                                                    field={field}
                                                    value={formData.projectScorecard[field.key]}
                                                    onChange={handleScorecardChange}
                                                    colors={colors}
                                                />
                                            ))}
                                        </View>
                                    ))}
                                    {errors.scorecard && <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 20 }]}>{errors.scorecard}</Text>}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </Animated.View>

            {!isConfigLoading && (
                <View style={[styles.footer, { 
                    borderTopColor: colors.border, 
                    paddingBottom: Platform.OS === 'ios' 
                        ? (isKeyboardVisible ? 10 : Math.max(insets.bottom, 20)) 
                        : (isKeyboardVisible ? 10 : Math.max(insets.bottom, 16))
                }]}>
                    {currentStep > 1 && (
                        <TouchableOpacity style={[styles.footerBtn, { borderColor: colors.border, borderWidth: 1, flex: 1, marginRight: 12 }]} onPress={handlePrevious}>
                            <Text style={{ color: colors.text, fontWeight: '700' }}>Quay lại</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={[styles.footerBtn, { backgroundColor: colors.primary, flex: 2 }]} 
                        onPress={currentStep < totalSteps ? handleNext : handleSubmit} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>{currentStep < totalSteps ? 'Tiếp Theo' : 'Hoàn Thành'}</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );

    return isPage ? content : (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose} statusBarTranslucent={true}>
            {content}
        </Modal>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    closeBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    headerSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '600', opacity: 0.7 },
    progressContainer: { marginBottom: 4 },
    progressTrack: { height: 4, width: '100%' },
    progressFill: { height: '100%' },
    scrollContent: { padding: 16 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    optional: { fontSize: 12, fontWeight: '400', opacity: 0.6 },
    input: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 15 },
    textArea: { height: 100 },
    errorText: { color: '#ef4444', fontSize: 12, marginTop: 6, fontWeight: '600' },
    row: { flexDirection: 'row', marginBottom: 0 },
    teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 },
    memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    removeBtn: { padding: 10 },
    footer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
    footerBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    imageUploadBtn: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center' },
    removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(239, 68, 68, 0.9)', padding: 6, borderRadius: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1 },
    pickerHandleContainer: { paddingVertical: 10, alignItems: 'center' },
    pickerHandle: { width: 36, height: 4, borderRadius: 2 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    pickerHeaderText: { fontSize: 18, fontWeight: '800' },
    pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20, backgroundColor: '#fef2f2' },
    errorBannerText: { marginLeft: 10, fontSize: 13, fontWeight: '600', flex: 1 },
    // Scorecard styles
    scorecardIntro: { flexDirection: 'row', padding: 14, borderRadius: 12, marginBottom: 24, gap: 12, alignItems: 'center' },
    scorecardIntroText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
    switchGroup: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    sectionContainer: { marginBottom: 28 },
    sectionHeader: { marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#3b82f6', paddingLeft: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
    scorecardGroup: { marginBottom: 20 },
    scorecardLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10, marginLeft: 2 },
    scorecardOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
    radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
    optionLabel: { fontSize: 14, marginBottom: 2 },
    optionHelper: { fontSize: 12, lineHeight: 16 },
});

