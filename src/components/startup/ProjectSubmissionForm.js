import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, Modal, ScrollView, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Animated, Easing, Image
} from 'react-native';
import { X, AlertCircle, Plus, Trash2, Upload, FileText, ChevronDown, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import projectSubmissionService from '../../services/projectSubmissionService';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getStageNumericValue = (val) => {
    if (val === 'Idea' || val === '0' || val === 0) return 0;
    if (val === 'MVP' || val === '1' || val === 1) return 1;
    if (val === 'Growth' || val === '2' || val === 2) return 2;
    return '';
};

const INDUSTRIES = [
    { label: 'Fintech', value: 0 },
    { label: 'Edtech', value: 1 },
    { label: 'Healthtech', value: 2 },
    { label: 'Agritech', value: 3 },
    { label: 'E-Commerce', value: 4 },
    { label: 'Logistics', value: 5 },
    { label: 'Proptech', value: 6 },
    { label: 'Cleantech', value: 7 },
    { label: 'SaaS', value: 8 },
    { label: 'AI & Big Data', value: 9 },
    { label: 'Web3 & Crypto', value: 10 },
    { label: 'Food & Beverage', value: 11 },
    { label: 'Manufacturing', value: 12 },
    { label: 'Media & Entertainment', value: 13 },
    { label: 'Other', value: 14 },
];

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

const FormInput = ({ label, value, onChangeText, placeholder, multiline = false, optional = false, isNumber = false, error, colors, inputRef, onLayout }) => {
    const { isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    return (
        <View style={styles.formGroup} onLayout={onLayout}>
            <Text style={[styles.label, { color: colors.text }]}>
                {label} {optional ? <Text style={styles.optional}>(Tùy chọn)</Text> : <Text style={{ color: colors.error }}>*</Text>}
            </Text>
            <TextInput
                ref={inputRef}
                style={[
                    styles.input, 
                    multiline && styles.textArea, 
                    {
                        backgroundColor: isFocused ? colors.card : (colors.inputBackground || colors.mutedBackground), 
                        color: colors.text,
                        borderColor: error ? colors.error : (isFocused ? colors.primary : (colors.inputBorder || colors.border)),
                        // Subtle 3D effect optimized for Dark/Light
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
                onChangeText={onChangeText}
                multiline={multiline}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                textAlignVertical={multiline ? 'top' : 'center'}
                keyboardType={isNumber ? "numeric" : "default"}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
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
                {label} {optional ? <Text style={styles.optional}>(Tùy chọn)</Text> : <Text style={{ color: colors.error }}>*</Text>}
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
                        {/* Handle bar */}
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


export default function ProjectSubmissionForm({ visible, onClose, onSuccess, user, initialData = null, isPage = false }) {
    const { activeTheme, isDark } = useTheme();
    const colors = activeTheme.colors;
    const isEdit = !!initialData;
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const scrollViewRef = useRef(null);
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(1 / 3)).current;

    const getInitialTeam = () => {
        if (initialData && initialData.teamMembers) {
            return initialData.teamMembers.split(',').map(m => {
                const [name, role] = m.trim().split('(');
                return { id: Math.random().toString(), name: name.trim(), role: role ? role.replace(')', '').trim() : '', anim: new Animated.Value(1) };
            });
        }
        return [{ id: Math.random().toString(), name: '', role: '', anim: new Animated.Value(1) }];
    };

    const [formData, setFormData] = useState({
        projectName: initialData?.projectName || initialData?.name || '',
        shortDescription: initialData?.shortDescription || '',
        developmentStage: initialData ? String(getStageNumericValue(initialData.developmentStage)) : '',
        industry: initialData?.industry ? String(initialData.industry) : '',
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
        projectImageFile: null,
    });

    const [imagePreview, setImagePreview] = useState(null);
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

    const addTeamMember = () => {
        const newMember = { id: Math.random().toString(), name: '', role: '', anim: new Animated.Value(0) };
        setFormData(prev => ({ ...prev, teamMembers: [...prev.teamMembers, newMember] }));
        Animated.timing(newMember.anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    };

    const removeTeamMember = (index) => {
        if (formData.teamMembers.length <= 1) return;
        const member = formData.teamMembers[index];
        Animated.timing(member.anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
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
            if (formData.industry === '') newErrors.industry = 'Vui lòng chọn lĩnh vực';
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
        setSubmitError('');
        if (!validateStep()) return;

        setIsSubmitting(true);
        try {
            const data = {
                projectName: formData.projectName.trim(),
                shortDescription: formData.shortDescription.trim(),
                developmentStage: parseInt(formData.developmentStage),
                industry: parseInt(formData.industry) || 0,
                problemStatement: formData.problemStatement.trim(),
                solutionDescription: formData.solutionDescription.trim(),
                targetCustomers: formData.targetCustomers.trim(),
                uniqueValueProposition: formData.uniqueValueProposition.trim(),
                marketSize: parseInt(formData.marketSize) || 0,
                businessModel: formData.businessModel.trim(),
                revenue: parseInt(formData.revenue) || 0,
                competitors: formData.competitors.trim(),
                teamMembers: formData.teamMembers.filter(m => m.name.trim()).map(m => m.role.trim() ? `${m.name.trim()} (${m.role.trim()})` : m.name.trim()).join(', '),
                keySkills: formData.keySkills.trim(),
                teamExperience: formData.teamExperience.trim(),
                projectImageFile: formData.projectImageFile
            };

            const response = isEdit
                ? await projectSubmissionService.updateProject(initialData.projectId || initialData.id, data)
                : await projectSubmissionService.submitStartupInfo(data);

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

    const content = (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: colors.card }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
                <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {submitError ? (
                        <View style={[styles.errorBanner, { borderColor: colors.error }]}>
                            <AlertCircle size={20} color={colors.error} />
                            <Text style={[styles.errorBannerText, { color: colors.error }]}>{submitError}</Text>
                        </View>
                    ) : null}

                    {currentStep === 1 && (
                        <View>
                            <FormInput label="Tên Dự Án" value={formData.projectName} onChangeText={(val) => handleInputChange('projectName', val)} placeholder="Ví dụ: AI Smart" error={errors.projectName} colors={colors} />
                            
                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Hình Ảnh Dự Án <Text style={styles.optional}>(Tùy chọn)</Text></Text>
                                <TouchableOpacity style={[styles.imageUploadBtn, { borderColor: colors.border, backgroundColor: imagePreview ? 'transparent' : colors.mutedBackground }]} onPress={handleImagePick}>
                                    {imagePreview ? (
                                        <View style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' }}>
                                            <Image source={{ uri: imagePreview }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                            <TouchableOpacity style={styles.removeImageBtn} onPress={handleRemoveImage}>
                                                <Trash2 size={16} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ alignItems: 'center' }}>
                                            <Upload size={32} color={colors.primary} style={{ marginBottom: 8 }} />
                                            <Text style={{ color: colors.text, fontWeight: '600' }}>Nhấn để chọn hình ảnh</Text>
                                            <Text style={{ color: colors.secondaryText, fontSize: 12 }}>PNG, JPG (Tối đa 5MB)</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {errors.projectImageFile && <Text style={styles.errorText}>{errors.projectImageFile}</Text>}
                            </View>

                            <FormInput label="Mô Tả Ngắn" value={formData.shortDescription} onChangeText={(val) => handleInputChange('shortDescription', val)} placeholder="Tóm tắt về sản phẩm..." multiline error={errors.shortDescription} colors={colors} />
                            <CustomSelect label="Giai Đoạn Phát Triển" value={formData.developmentStage} onValueChange={(val) => handleInputChange('developmentStage', val)} options={[{label:'Ý tưởng (Idea)', value:'0'},{label:'MVP', value:'1'},{label:'Vận hành (Growth)', value:'2'}]} error={errors.developmentStage} colors={colors} />
                            <CustomSelect label="Lĩnh Vực" value={formData.industry} onValueChange={(val) => handleInputChange('industry', val)} options={INDUSTRIES} error={errors.industry} colors={colors} />
                            <FormInput label="Vấn Đề Giải Quyết" value={formData.problemStatement} onChangeText={(val) => handleInputChange('problemStatement', val)} placeholder="Thị trường đang thiếu gì?" multiline error={errors.problemStatement} colors={colors} />
                        </View>
                    )}

                    {currentStep === 2 && (
                        <View>
                            <FormInput label="Mô Tả Giải Pháp" value={formData.solutionDescription} onChangeText={(val) => handleInputChange('solutionDescription', val)} placeholder="Giải pháp của bạn hoạt động như thế nào?" multiline error={errors.solutionDescription} colors={colors} />
                            <FormInput label="Khách Hàng Mục Tiêu" value={formData.targetCustomers} onChangeText={(val) => handleInputChange('targetCustomers', val)} placeholder="Họ là ai? Ở đâu?" multiline error={errors.targetCustomers} colors={colors} />
                            <FormInput label="Giá Trị Độc Đáo (UVP)" value={formData.uniqueValueProposition} onChangeText={(val) => handleInputChange('uniqueValueProposition', val)} placeholder="Tại sao khách hàng chọn bạn?" multiline optional={isIdea} error={errors.uniqueValueProposition} colors={colors} />

                            {!isIdea && (
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}><FormInput label="Quy mô TT (VND)" value={formData.marketSize} onChangeText={(val) => handleInputChange('marketSize', val)} placeholder="0" optional={!isGrowth} isNumber error={errors.marketSize} colors={colors} /></View>
                                    <View style={{ width: 12 }} />
                                    <View style={{ flex: 1 }}><FormInput label="Doanh thu (VND)" value={formData.revenue} onChangeText={(val) => handleInputChange('revenue', val)} placeholder="0" optional={!isGrowth} isNumber error={errors.revenue} colors={colors} /></View>
                                </View>
                            )}
                            <FormInput label="Mô Hình Kinh Doanh" value={formData.businessModel} onChangeText={(val) => handleInputChange('businessModel', val)} placeholder="Bạn kiếm tiền từ đâu?" multiline optional={isIdea} error={errors.businessModel} colors={colors} />
                        </View>
                    )}

                    {currentStep === 3 && (
                        <View>
                            <FormInput label="Đối thủ cạnh tranh" value={formData.competitors} onChangeText={(val) => handleInputChange('competitors', val)} placeholder="Ai đang làm giống bạn?" multiline optional={isIdea} error={errors.competitors} colors={colors} />

                            <View style={styles.formGroup}>
                                <View style={styles.teamHeader}>
                                    <Text style={[styles.label, { color: colors.text }]}>Thành Viên Đội <Text style={{ color: colors.error }}>*</Text></Text>
                                    <TouchableOpacity onPress={addTeamMember} style={[styles.addBtn, { backgroundColor: colors.primary }]}><Plus size={14} color="#fff" /><Text style={styles.addBtnText}>Thêm</Text></TouchableOpacity>
                                </View>
                                {formData.teamMembers.map((member, idx) => (
                                    <Animated.View key={member.id} style={[styles.memberRow, { opacity: member.anim, transform: [{ translateY: member.anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
                                        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]} placeholder="Họ và tên" value={member.name} onChangeText={(v) => handleMemberChange(idx, 'name', v)} />
                                        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, marginHorizontal: 8 }]} placeholder="Vai trò (CEO)" value={member.role} onChangeText={(v) => handleMemberChange(idx, 'role', v)} />
                                        <TouchableOpacity style={styles.removeBtn} onPress={() => removeTeamMember(idx)} disabled={formData.teamMembers.length <= 1}>
                                            <Trash2 size={20} color={formData.teamMembers.length <= 1 ? colors.border : colors.destructive} />
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                                {errors.teamMembers && <Text style={styles.errorText}>{errors.teamMembers}</Text>}
                            </View>

                            <FormInput label="Kỹ năng cốt lõi" value={formData.keySkills} onChangeText={(val) => handleInputChange('keySkills', val)} placeholder="AI, Sales..." optional={isIdea} error={errors.keySkills} colors={colors} />
                            <FormInput label="Kinh nghiệm đội" value={formData.teamExperience} onChangeText={(val) => handleInputChange('teamExperience', val)} placeholder="Các dự án nổi bật..." multiline optional={!isGrowth} error={errors.teamExperience} colors={colors} />
                        </View>
                    )}
                    <View style={{ height: 10 }} />
                </ScrollView>
            </Animated.View>

            {/* Footer Steps */}
            <View style={[
                styles.footer, 
                { 
                    borderTopColor: colors.border, 
                    backgroundColor: colors.card,
                    paddingBottom: Math.max(insets.bottom, 12) 
                }
            ]}>
                {currentStep > 1 && (
                    <TouchableOpacity style={[styles.footerBtn, { borderColor: colors.inputBorder, borderWidth: 1, flex: 1, marginRight: 12 }]} onPress={handlePrevious}><Text style={{ color: colors.text, fontWeight: '700' }}>Quay lại</Text></TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary, flex: 2 }]} onPress={currentStep < totalSteps ? handleNext : handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>{currentStep < totalSteps ? 'Tiếp Theo' : 'Hoàn Thành'}</Text>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );

    if (isPage) return content;

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            {content}
        </Modal>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, paddingTop: Platform.OS === 'ios' ? 48 : 20 },
    closeBtn: { width: 44, height: 44, justifyContent: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSubtitle: { fontSize: 13, marginTop: 2 },
    progressContainer: { marginBottom: 20 },
    progressTrack: { height: 4, width: '100%' },
    progressFill: { height: '100%', borderRadius: 2 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 10 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    optional: { fontSize: 12, opacity: 0.6, fontWeight: '400' },
    input: { 
        padding: 14, 
        borderRadius: 14, 
        borderWidth: 1, 
        fontSize: 15,
        // Default shadow for 3D effect
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    textArea: { height: 100 },
    errorText: { color: 'red', fontSize: 12, marginTop: 4 },
    row: { flexDirection: 'row' },
    teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 },
    memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    removeBtn: { padding: 8 },
    footer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
    footerBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    imageUploadBtn: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center' },
    removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,0,0,0.8)', padding: 8, borderRadius: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, overflow: 'hidden' },
    pickerHandleContainer: { width: '100%', alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
    pickerHandle: { width: 40, height: 5, borderRadius: 2.5 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    pickerHeaderText: { fontSize: 18, fontWeight: '800' },
    pickerCloseBtn: { padding: 4 },
    pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
});
