import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { Check, AlertCircle, Camera, FileText, Globe, Building2, User, Phone, MapPin } from 'lucide-react-native';
import startupProfileService from '../services/startupProfileService';
import { useTheme } from '../context/ThemeContext';

const INDUSTRIES = [
  'Fintech', 'Edtech', 'Healthtech', 'Agritech', 'E-Commerce', 
  'Logistics', 'Proptech', 'Cleantech', 'SaaS', 'AI & Big Data', 
  'Web3 & Crypto', 'Food & Beverage', 'Manufacturing', 'Media & Entertainment', 'Khác'
];

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
    industry: 0,
    businessLicenseUrl: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      let industryVal = initialData.industry || 0;
      if (typeof industryVal === 'string') {
        const idx = INDUSTRIES.indexOf(industryVal);
        industryVal = idx !== -1 ? idx : 14;
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
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Tên công ty là bắt buộc';
    if (!formData.founder.trim()) newErrors.founder = 'Tên người sáng lập là bắt buộc';
    if (!formData.contactInfo.trim()) newErrors.contactInfo = 'Thông tin liên hệ là bắt buộc';
    if (!formData.countryCity.trim()) newErrors.countryCity = 'Địa phương là bắt buộc';
    if (!formData.website.trim()) newErrors.website = 'Website là bắt buộc';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const isUpdate = !!(initialData && (initialData.id || initialData.startupId));
      let response;

      const payload = {
        ...formData,
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

  const renderInput = (label, name, icon, placeholder, keyboardType = 'default') => (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label} <Text style={{ color: colors.error }}>*</Text>
      </Text>
      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: colors.inputBackground, 
          borderColor: colors.inputBorder 
        },
        errors[name] && { borderColor: colors.error }
      ]}>
        {React.cloneElement(icon, { color: colors.secondaryText })}
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          value={String(formData[name])}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, [name]: text }));
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
          }}
          keyboardType={keyboardType}
          placeholderTextColor={colors.secondaryText}
        />
      </View>
      {errors[name] && <Text style={[styles.errorText, { color: colors.error }]}>{errors[name]}</Text>}
    </View>
  );

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

        {renderInput('Tên công ty', 'companyName', <Building2 size={18} />, 'Ví dụ: TechStartup VN')}
        {renderInput('Người sáng lập', 'founder', <User size={18} />, 'Tên của bạn')}
        {renderInput('Thông tin liên hệ', 'contactInfo', <Phone size={18} />, 'Email hoặc số điện thoại', 'email-address')}
        {renderInput('Địa phương', 'countryCity', <Building2 size={18} />, 'Tỉnh/Thành phố')}
        {renderInput('Website', 'website', <Globe size={18} />, 'https://example.com', 'url')}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Lĩnh vực</Text>
          <View style={styles.industryGrid}>
            {INDUSTRIES.map((ind, idx) => {
              const isSelected = formData.industry === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.industryItem, 
                    { 
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, industry: idx }))}
                >
                  <Text style={[
                    styles.industryText, 
                    { 
                      color: isSelected ? '#fff' : colors.secondaryText,
                      fontWeight: isSelected ? '600' : '400'
                    }
                  ]}>
                    {ind}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 52 },
  input: { flex: 1, marginLeft: 10, fontSize: 15 },
  errorText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
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
