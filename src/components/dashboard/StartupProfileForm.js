import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, Image 
} from 'react-native';
import { 
  Check, AlertCircle, Camera, FileText, Globe, 
  Building2, User, Phone, MapPin, Tag, Upload, X 
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import startupProfileService from '../../services/startupProfileService';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import Button from '../Button';

const INDUSTRIES = [
  'Fintech', 'Edtech', 'Healthtech', 'Agritech', 'E-Commerce', 
  'Logistics', 'Proptech', 'Cleantech', 'SaaS', 'AI & Big Data', 
  'Web3 & Crypto', 'Food & Beverage', 'Manufacturing', 'Media & Entertainment', 'Khác'
];

export default function StartupProfileForm({ initialData, user, onSuccess }) {
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

  const [logoFile, setLogoFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      let industryVal = initialData.industry || 0;
      if (typeof industryVal === 'string') {
        const industryMap = {
          'Fintech': 0, 'Edtech': 1, 'Healthtech': 2, 'Agritech': 3,
          'E_Commerce': 4, 'Logistics': 5, 'Proptech': 6, 'Cleantech': 7,
          'SaaS': 8, 'AI_BigData': 9, 'Web3_Crypto': 10, 'Food_Beverage': 11,
          'Manufacturing': 12, 'Media_Entertainment': 13, 'Other': 14
        };
        industryVal = industryMap[industryVal] ?? 0;
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

  const pickDocument = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type === 'logo' ? 'image/*' : ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (type === 'logo') {
          setLogoFile(file);
        } else {
          setLicenseFile(file);
        }
      }
    } catch (err) {
      console.error('Document picker error:', err);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Tên công ty là bắt buộc';
    if (!formData.founder.trim()) newErrors.founder = 'Người sáng lập là bắt buộc';
    if (!formData.contactInfo.trim()) newErrors.contactInfo = 'Liên hệ là bắt buộc';
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
      
      // Prepare payload - note: mobile FormData uses different structure than web
      const payload = new FormData();
      payload.append('companyName', formData.companyName);
      payload.append('founder', formData.founder);
      payload.append('contactInfo', formData.contactInfo);
      payload.append('countryCity', formData.countryCity);
      payload.append('website', formData.website);
      payload.append('industry', formData.industry.toString());

      if (logoFile) {
        payload.append('LogoFile', {
          uri: logoFile.uri,
          name: logoFile.name || 'logo.jpg',
          type: logoFile.mimeType || 'image/jpeg'
        });
      }
      
      if (licenseFile) {
        payload.append('BusinessLicenseFile', {
          uri: licenseFile.uri,
          name: licenseFile.name || 'license.pdf',
          type: licenseFile.mimeType || 'application/pdf'
        });
      }

      let response;
      if (isUpdate) {
        response = await startupProfileService.updateStartupProfile(payload);
      } else {
        response = await startupProfileService.createStartupProfile(payload);
      }

      if (response && (response.isSuccess || response.success)) {
        Alert.alert('Thành công', isUpdate ? 'Cập nhật hồ sơ thành công!' : 'Tạo hồ sơ thành công!');
        if (onSuccess) onSuccess(response.data || formData);
      } else {
        Alert.alert('Lỗi', response?.message || 'Không thể lưu hồ sơ');
      }
    } catch (error) {
      console.error('Profile form error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi kết nối máy chủ');
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
          borderColor: errors[name] ? colors.error : colors.inputBorder 
        }
      ]}>
        <View style={styles.iconWrapper}>
          {React.cloneElement(icon, { size: 18, color: colors.secondaryText })}
        </View>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          value={formData[name]}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, [name]: text }));
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
          }}
          keyboardType={keyboardType}
        />
      </View>
      {errors[name] && <Text style={[styles.errorText, { color: colors.error }]}>{errors[name]}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <Building2 size={24} color={colors.primary} />
          <View style={styles.sectionText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin doanh nghiệp</Text>
            <Text style={[styles.sectionSub, { color: colors.secondaryText }]}>Các thông tin định danh chính</Text>
          </View>
        </View>

        {renderInput('Tên công ty', 'companyName', <Building2 />, 'TechStartup Vietnam')}
        {renderInput('Người sáng lập', 'founder', <User />, 'Họ và tên')}
        {renderInput('Thông tin liên hệ', 'contactInfo', <Phone />, 'Email hoặc SĐT')}
        {renderInput('Địa phương', 'countryCity', <MapPin />, 'Tỉnh / Thành phố')}
        {renderInput('Website', 'website', <Globe />, 'https://example.com')}

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
                  onPress={() => setFormData(p => ({ ...p, industry: idx }))}
                >
                  <Text style={[
                     styles.industryText,
                     { color: isSelected ? '#fff' : colors.secondaryText }
                  ]}>{ind}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.sectionHeader}>
          <Camera size={24} color={colors.primary} />
          <View style={styles.sectionText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hình ảnh & Pháp lý</Text>
            <Text style={[styles.sectionSub, { color: colors.secondaryText }]}>Logo và giấy phép kinh doanh</Text>
          </View>
        </View>

        {/* Logo Picker */}
        <View style={styles.uploadSection}>
          <Text style={[styles.label, { color: colors.text }]}>Logo công ty</Text>
          <TouchableOpacity 
            style={[styles.uploadBox, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}
            onPress={() => pickDocument('logo')}
          >
            {logoFile || formData.logoUrl ? (
              <View style={styles.previewContainer}>
                <Image 
                  source={{ uri: logoFile ? logoFile.uri : formData.logoUrl }} 
                  style={styles.logoPreview} 
                />
                <TouchableOpacity 
                   style={[styles.removeFile, { backgroundColor: colors.error }]} 
                   onPress={() => { setLogoFile(null); setFormData(p => ({...p, logoUrl: ''})); }}
                >
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Upload size={24} color={colors.secondaryText} />
                <Text style={[styles.uploadText, { color: colors.secondaryText }]}>Tải ảnh Logo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* License Picker */}
        <View style={styles.uploadSection}>
          <Text style={[styles.label, { color: colors.text }]}>Giấy phép kinh doanh</Text>
          <TouchableOpacity 
            style={[styles.uploadBox, { backgroundColor: colors.mutedBackground, borderColor: colors.border }]}
            onPress={() => pickDocument('license')}
          >
            {licenseFile || formData.businessLicenseUrl ? (
              <View style={styles.filePreview}>
                <FileText size={24} color={colors.primary} />
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                  {licenseFile ? licenseFile.name : 'Đã tải lên giấy phép'}
                </Text>
                <TouchableOpacity 
                   onPress={() => { setLicenseFile(null); setFormData(p => ({...p, businessLicenseUrl: ''})); }}
                >
                  <X size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <FileText size={24} color={colors.secondaryText} />
                <Text style={[styles.uploadText, { color: colors.secondaryText }]}>Tải Giấy phép (PDF/Image)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <Button 
            title={initialData ? 'Lưu thay đổi' : 'Tạo hồ sơ ngay'}
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitBtn}
          />
        </View>
      </Card>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formCard: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  sectionText: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSub: { fontSize: 12 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderRadius: 12, 
    overflow: 'hidden',
    height: 52,
  },
  iconWrapper: { paddingLeft: 12, paddingRight: 4 },
  input: { flex: 1, paddingRight: 12, fontSize: 15, height: '100%' },
  errorText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  industryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  industryItem: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1,
  },
  industryText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 24 },
  uploadSection: { marginBottom: 20 },
  uploadBox: { 
    height: 100, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  uploadPlaceholder: { alignItems: 'center', gap: 8 },
  uploadText: { fontSize: 13, fontWeight: '600' },
  previewContainer: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  logoPreview: { width: 80, height: 80, borderRadius: 8 },
  removeFile: { 
    position: 'absolute', 
    top: 5, 
    right: 5, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  filePreview: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    gap: 12, 
    width: '100%' 
  },
  fileName: { flex: 1, fontSize: 14, fontWeight: '600' },
  actions: { marginTop: 10 },
  submitBtn: { height: 50, borderRadius: 12 },
});
