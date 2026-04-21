import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import authService from '../../src/services/authService';
import { useTheme } from '../../src/context/ThemeContext';
import THEME from '../../src/constants/Theme';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      setStatus('error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Định dạng email không hợp lệ.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setStatus('success');
      } else {
        setErrorMessage(response.message || 'Không tìm thấy tài khoản với email này.');
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <View style={[styles.iconCircle, { backgroundColor: colors.success + '15' }]}>
            <CheckCircle size={60} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>Kiểm tra hộp thư</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText, textAlign: 'center' }]}>
            Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>.
          </Text>
          <Button 
            title="Quay lại Đăng nhập" 
            onPress={() => router.replace('/(auth)/login')} 
            style={styles.actionBtn}
          />
          <TouchableOpacity onPress={() => setStatus('idle')} style={styles.resendBtn}>
            <Text style={[styles.resendText, { color: colors.primary }]}>Dùng email khác</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Quên mật khẩu</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '10', marginBottom: 24 }]}>
            <Mail size={40} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Khôi phục mật khẩu</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Nhập địa chỉ email liên kết với tài khoản của bạn. AISEP sẽ gửi cho bạn một liên kết để tạo mật khẩu mới.
          </Text>

          <Input
            label="Địa chỉ email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (status === 'error') setStatus('idle');
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={status === 'error' ? errorMessage : ''}
          />

          <Button 
            title="Gửi yêu cầu" 
            onPress={handleRequestReset} 
            loading={status === 'loading'}
            style={styles.actionBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
  },
  backButton: {
    padding: THEME.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: THEME.spacing.md,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: THEME.spacing.xl,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  actionBtn: {
    width: '100%',
    marginTop: THEME.spacing.lg,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
  },
  resendBtn: {
    marginTop: 20,
    padding: 10,
  },
  resendText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
