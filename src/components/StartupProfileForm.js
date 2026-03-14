import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { Check, AlertCircle, Camera, FileText, Globe, Building2, User, Phone } from 'lucide-react-native';
import startupProfileService from '../services/startupProfileService';
import THEME from '../constants/Theme';

const INDUSTRIES = [
  'Fintech', 'Edtech', 'Healthtech', 'Agritech', 'E-Commerce', 
  'Logistics', 'Proptech', 'Cleantech', 'SaaS', 'AI & Big Data', 
  'Web3 & Crypto', 'Food & Beverage', 'Manufacturing', 'Media & Entertainment', 'Khác'
];

export default function StartupProfileForm({ initialData, user, onSuccess, onCancel }) {
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
      <Text style={styles.label}>{label} <Text style={{color: '#ef4444'}}>*</Text></Text>
      <View style={[styles.inputContainer, errors[name] && styles.inputError]}>
        {icon}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={String(formData[name])}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, [name]: text }));
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
          }}
          keyboardType={keyboardType}
          placeholderTextColor="#94A3B8"
        />
      </View>
      {errors[name] && <Text style={styles.errorText}>{errors[name]}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.title}>{initialData ? 'Cập nhật Profile' : 'Tạo Hồ sơ Startup'}</Text>
        <Text style={styles.subtitle}>Điền thông tin doanh nghiệp của bạn</Text>

        {errors.submit && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#ef4444" />
            <Text style={styles.errorBannerText}>{errors.submit}</Text>
          </View>
        )}

        {renderInput('Tên công ty', 'companyName', <Building2 size={18} color="#64748B" />, 'Ví dụ: TechStartup VN')}
        {renderInput('Người sáng lập', 'founder', <User size={18} color="#64748B" />, 'Tên của bạn')}
        {renderInput('Thông tin liên hệ', 'contactInfo', <Phone size={18} color="#64748B" />, 'Email hoặc số điện thoại', 'email-address')}
        {renderInput('Địa phương', 'countryCity', <MapPin size={18} color="#64748B" />, 'Tỉnh/Thành phố')}
        {renderInput('Website', 'website', <Globe size={18} color="#64748B" />, 'https://example.com', 'url')}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Lĩnh vực</Text>
          <View style={styles.industryGrid}>
            {INDUSTRIES.map((ind, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.industryItem, formData.industry === idx && styles.industryItemSelected]}
                onPress={() => setFormData(prev => ({ ...prev, industry: idx }))}
              >
                <Text style={[styles.industryText, formData.industry === idx && styles.industryTextSelected]}>
                  {ind}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          {onCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isLoading}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.submitBtn, isLoading && styles.disabledBtn]} 
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, margin: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 24 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, height: 48 },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1E293B' },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 20 },
  errorBannerText: { color: '#ef4444', fontSize: 13, marginLeft: 8, flex: 1 },
  industryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  industryItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', margin: 4, backgroundColor: '#fff' },
  industryItemSelected: { backgroundColor: THEME.colors.primary, borderColor: THEME.colors.primary },
  industryText: { fontSize: 12, color: '#64748B' },
  industryTextSelected: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', marginTop: 10 },
  cancelBtn: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cancelText: { fontSize: 15, color: '#64748B', fontWeight: '600' },
  submitBtn: { flex: 2, height: 48, backgroundColor: THEME.colors.primary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  disabledBtn: { opacity: 0.7 },
  MapPin: { width: 18, height: 18 } // Placeholder for missing import if any
});

const MapPin = ({ size, color }) => (
  <Building2 size={size} color={color} /> // Simplified fallback for location icon
);
