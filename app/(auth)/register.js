import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Rocket, CheckCircle, ArrowLeft, CheckSquare, Square } from 'lucide-react-native';
import authService from '../../src/services/authService';
import { useTheme } from '../../src/context/ThemeContext';
import THEME from '../../src/constants/Theme';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import TermsModal from '../../src/components/common/TermsModal';
import termsService from '../../src/services/termsService';

export default function RegisterScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsData, setTermsData] = useState({ version: '', content: '', error: null, isLoading: false });

  const fetchTerms = async () => {
    if (termsData.content) return; // Already fetched
    
    setTermsData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await termsService.getActiveTerms();
      const data = response?.data || response;
      if (data) {
        setTermsData({
          version: data.version || 'v1.0',
          content: data.contentHtml || '',
          error: null,
          isLoading: false
        });
      }
    } catch (err) {
      console.error('Failed to fetch terms:', err);
      setTermsData({
        version: '',
        content: '',
        error: err,
        isLoading: false
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên.';
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập.';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập chỉ được chứa chữ cái và số.';
    }
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email.';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Mật khẩu tối thiểu 8 ký tự.';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp.';
    if (!isTermsAccepted) newErrors.terms = 'Bạn phải đồng ý với điều khoản.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        isTermsAccepted,
        termsVersion: termsData.version || 'v1.0'
      };
      const response = await authService.register(payload);
      if (response.success) setStep(2);
      else Alert.alert('Lỗi đăng ký', response.message || 'Thất bại.');
    } catch (err) {
      Alert.alert('Lỗi kết nối', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.logoText, { color: colors.text }]}>Đăng ký Startup</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{alignItems: 'center', marginBottom: 24}}>
              <Rocket size={48} color={colors.primary} />
              <Text style={[styles.rolesTitle, { color: colors.text }]}>Gia nhập AISEP</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Kiến tạo tương lai cho startup của bạn</Text>
            </View>
            <Input label="Họ và tên" value={formData.fullName} onChangeText={v => setFormData({...formData, fullName: v})} error={errors.fullName} />
            <Input label="Tên đăng nhập" value={formData.username} onChangeText={v => setFormData({...formData, username: v.replace(/[^a-zA-Z0-9]/g, '')})} error={errors.username} autoCapitalize="none" />
            <Input label="Email" value={formData.email} onChangeText={v => setFormData({...formData, email: v})} error={errors.email} />
            <Input label="Mật khẩu" value={formData.password} onChangeText={v => setFormData({...formData, password: v})} error={errors.password} secureTextEntry />
            <Input label="Xác nhận" value={formData.confirmPassword} onChangeText={v => setFormData({...formData, confirmPassword: v})} error={errors.confirmPassword} secureTextEntry />

            {/* Terms and Conditions Checkbox */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkboxTouch} 
                onPress={() => setIsTermsAccepted(!isTermsAccepted)}
              >
                {isTermsAccepted ? (
                  <CheckSquare size={24} color={colors.primary} />
                ) : (
                  <Square size={24} color={colors.secondaryText} />
                )}
              </TouchableOpacity>
              <View style={styles.termsTextContainer}>
                <Text style={[styles.termsText, { color: colors.text }]}>
                  Tôi đồng ý với{' '}
                </Text>
                <TouchableOpacity onPress={() => {
                  fetchTerms();
                  setShowTermsModal(true);
                }}>
                  <Text style={[styles.termsLink, { color: colors.primary }]}>Điều khoản sử dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.terms && <Text style={{ color: colors.error, fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 36 }}>{errors.terms}</Text>}

            <Button title="Tạo tài khoản Startup" onPress={handleRegister} loading={isLoading} style={{marginTop: 10}} />
            
            <View style={styles.loginPrompt}>
              <Text style={[styles.loginText, { color: colors.secondaryText }]}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
        <TermsModal 
          visible={showTermsModal} 
          onClose={() => setShowTermsModal(false)}
          termsContent={termsData.content}
          termsVersion={termsData.version}
          error={termsData.error}
          isLoading={termsData.isLoading}
        />
      </KeyboardAvoidingView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background}}>
        <CheckCircle size={80} color={colors.success || THEME.colors.success} />
        <Text style={{fontSize: 24, fontWeight: '800', marginTop: 20, color: colors.text}}>Thành công!</Text>
        <Text style={{textAlign: 'center', marginTop: 10, color: colors.secondaryText}}>Vui lòng kiểm tra email của bạn.</Text>
        <Button title="Đăng nhập" onPress={() => router.replace('/(auth)/login')} style={{width: '100%', marginTop: 30}} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
  },
  backButton: { padding: 4 },
  logoText: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  rolesTitle: { fontSize: 24, fontWeight: '800', marginTop: 12, marginBottom: 4, textAlign: 'center' },
  formContent: { padding: THEME.spacing.lg },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  loginText: {
    fontSize: 15,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  checkboxTouch: {
    padding: 4,
    marginRight: 4,
  },
  termsTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: 14,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});