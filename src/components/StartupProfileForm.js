import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Check, AlertCircle, Building2, User, Phone, Globe } from 'lucide-react-native';
import startupProfileService from '../services/startupProfileService';
import enumService from '../services/enumService';
import validationService from '../services/validationService';
import { useTheme } from '../context/ThemeContext';
import DynamicInputField from './common/DynamicInputField';

export default function StartupProfileForm({ initialData, user, onSuccess, onCancel }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [formData, setFormData] = useState({
    companyName: '',
    logoUrl: '',
    founder: '',
    contactInfo: '',
    countryCity: '',
    website: '',
    industry: '',
    businessLicenseUrl: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');
  const [errors, setErrors] = useState({});
  const [validationRules, setValidationRules] = useState(null);
  const [industries, setIndustries] = useState([]);

  const fetchConfig = async () => {
    try {
      setIsConfigLoading(true);
      setConfigError('');
      const [rules, fetchedIndustries] = await Promise.all([
        validationService.getFormRules('startup.update'),
        enumService.getEnumOptions('Industry')
      ]);
      
      if (!rules || Object.keys(rules).length === 0) {
        throw new Error('Không thể tải dữ liệu cấu hình từ máy chủ.');
      }
      
      setValidationRules(rules);
      setIndustries(fetchedIndustries || []);
    } catch (error) {
      console.error('Error fetching config:', error);
      setConfigError('Không thể tải cấu hình biểu mẫu. Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setIsConfigLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (initialData && !isConfigLoading) {
      // Find industry value
      let industryVal = '';
      if (initialData.industry) {
        const indString = String(initialData.industry).toLowerCase();
        // Try to find matching ID
        const matched = industries.find(i => 
          String(i.value) === indString || 
          i.label.toLowerCase() === indString ||
          i.label.toLowerCase().replace(/ /g, '_') === indString
        );
        industryVal = matched ? String(matched.value) : String(initialData.industry);
      }

      setFormData({
        companyName: initialData.companyName || '',
        logoUrl: initialData.logoUrl || '',
        founder: initialData.founder || '',
        contactInfo: initialData.contactInfo || '',
        countryCity: initialData.countryCity || '',
        website: initialData.website || '',
        industry: industryVal,
        businessLicenseUrl: initialData.businessLicenseUrl || '',
      });
    }
  }, [initialData, isConfigLoading, industries]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear global error
    if (errors.submit) setErrors(prev => ({ ...prev, submit: null }));
  };

  const validate = () => {
    if (!validationRules) {
      // Fallback basic validation
      const newErrors = {};
      if (!formData.companyName.trim()) newErrors.companyName = 'Tên công ty là bắt buộc';
      if (!formData.founder.trim()) newErrors.founder = 'Tên người sáng lập là bắt buộc';
      if (!formData.industry) newErrors.industry = 'Lĩnh vực là bắt buộc';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    const fieldMapping = {
      companyName: 'companyname',
      founder: 'founder',
      contactInfo: 'contactinfo',
      countryCity: 'countrycity',
      website: 'website',
      industry: 'industry'
    };

    const validationResult = validationService.validateForm(formData, validationRules, fieldMapping);
    setErrors(validationResult.errors);
    return validationResult.isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const isUpdate = !!(initialData && (initialData.id || initialData.startupId));
      let response;

      const payload = {
        ...formData,
        industry: formData.industry,
        userId: user?.userId
      };

      if (isUpdate) {
        response = await startupProfileService.updateStartupProfile(payload);
      } else {
        response = await startupProfileService.createStartupProfile(payload);
      }

      if (response && (response.isSuccess || response.success)) {
        Alert.alert('Thành công', isUpdate ? 'Cập nhật thành công!' : 'Tạo hồ sơ thành công!');
        if (onSuccess) onSuccess(response.data || payload);
      } else {
        setErrors({ submit: response?.message || 'Thao tác thất bại' });
      }
    } catch (error) {
      console.error('Profile form error:', error);
      setErrors({ submit: 'Lỗi kết nối máy chủ' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isConfigLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.secondaryText, marginTop: 12 }}>Đang tải cấu hình biểu mẫu...</Text>
      </View>
    );
  }

  if (configError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <AlertCircle size={48} color={colors.error} style={{ marginBottom: 16 }} />
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Lỗi khởi tạo biểu mẫu</Text>
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
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.title, { color: colors.text }]}>{initialData ? 'Cập nhật Profile' : 'Tạo Hồ sơ Startup'}</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Điền thông tin doanh nghiệp của bạn</Text>

        {errors.submit && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}>
            <AlertCircle size={18} color={colors.error} />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>{errors.submit}</Text>
          </View>
        )}

        <DynamicInputField
          name="companyName"
          label="Tên công ty"
          value={formData.companyName}
          onChangeText={handleChange}
          validationRule={validationRules?.['companyname']}
          placeholder="Ví dụ: TechStartup VN"
        />

        <DynamicInputField
          name="founder"
          label="Người sáng lập"
          value={formData.founder}
          onChangeText={handleChange}
          validationRule={validationRules?.['founder']}
          placeholder="Tên của bạn"
        />

        <DynamicInputField
          name="contactInfo"
          label="Thông tin liên hệ"
          value={formData.contactInfo}
          onChangeText={handleChange}
          validationRule={validationRules?.['contactinfo']}
          placeholder="Email hoặc số điện thoại"
          keyboardType="email-address"
        />

        <DynamicInputField
          name="countryCity"
          label="Địa phương"
          value={formData.countryCity}
          onChangeText={handleChange}
          validationRule={validationRules?.['countrycity']}
          placeholder="Tỉnh/Thành phố"
        />

        <DynamicInputField
          name="website"
          label="Website"
          value={formData.website}
          onChangeText={handleChange}
          validationRule={validationRules?.['website']}
          placeholder="https://example.com"
          keyboardType="url"
        />

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Lĩnh vực {validationRules?.['industry']?.required && <Text style={{ color: colors.error }}>*</Text>}</Text>
          <View style={styles.industryGrid}>
            {industries.map((ind) => {
              const isSelected = formData.industry === String(ind.value);
              return (
                <TouchableOpacity
                  key={ind.value}
                  style={[
                    styles.industryItem, 
                    { 
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => handleChange('industry', String(ind.value))}
                >
                  <Text style={[
                    styles.industryText, 
                    { 
                      color: isSelected ? '#fff' : colors.secondaryText,
                      fontWeight: isSelected ? '600' : '400'
                    }
                  ]}>
                    {ind.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.industry && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{errors.industry}</Text>}
        </View>

        <View style={styles.actions}>
          {onCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isLoading}>
              <Text style={[styles.cancelText, { color: colors.secondaryText }]}>Hủy</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[
              styles.submitBtn, 
              { backgroundColor: colors.primary },
              isLoading && styles.disabledBtn
            ]} 
            onPress={handleSubmit} 
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Check size={18} color="#fff" />
                <Text style={styles.submitText}>{initialData ? 'Cập nhật' : 'Lưu hồ sơ'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 16, padding: 20, margin: 16, elevation: 3, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 24 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 20 },
  errorBannerText: { fontSize: 13, marginLeft: 8, flex: 1, fontWeight: '500' },
  industryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  industryItem: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, margin: 4 },
  industryText: { fontSize: 12 },
  actions: { flexDirection: 'row', marginTop: 10, gap: 12 },
  cancelBtn: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700' },
  submitBtn: { flex: 2, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800', marginLeft: 8 },
  disabledBtn: { opacity: 0.7 }
});
