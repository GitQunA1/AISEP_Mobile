import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Rocket, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import authService from '../../src/services/authService';
import { useTheme } from '../../src/context/ThemeContext';
import THEME from '../../src/constants/Theme';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';

// Simple base64 decoder for JWT
const decodeBase64 = (base64) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = '';
  base64 = base64.replace(/=+$/, '');
  for (let bc = 0, bs = 0, buffer, i = 0; buffer = base64.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? str += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return str;
};
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      const accessToken = response?.accessToken || response?.token || response?.data?.accessToken;
      const refreshToken = response?.refreshToken || response?.data?.refreshToken;

      if (accessToken) {
        let decodedToken = {};
        try {
          const payloadBase64 = accessToken.split('.')[1];
          const jsonPayload = decodeBase64(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
          decodedToken = JSON.parse(jsonPayload);
        } catch (e) {
          console.error("Failed to decode token", e);
        }

        const fallbackData = response?.data || response;
        const rawUser = fallbackData?.user || fallbackData;
        
        const claimId = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        const claimEmail = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        const claimName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        const claimRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

        const user = {
          userId: claimId || rawUser?.id || rawUser?.userId || rawUser?.Id,
          name: claimName || rawUser?.name || rawUser?.fullName || email.split('@')[0],
          email: claimEmail || rawUser?.email || email,
          role: claimRole || rawUser?.role || 'startup',
        };

        // NEW: Strictly enforce Startup only role for Mobile App
        let roleStr = '';
        if (typeof user.role === 'string') {
          roleStr = user.role.toLowerCase();
        } else if (Array.isArray(user.role)) {
          roleStr = user.role.map(r => String(r).toLowerCase()).includes('startup') ? 'startup' : '';
        } else if (user.role === 0) {
          roleStr = 'startup';
        }

        if (roleStr !== 'startup') {
          setIsLoading(false);
          Alert.alert(
            'Truy cập bị từ chối',
            `Vai trò hệ thống của bạn: (${user.role}) không được quyền truy cập ứng dụng AISEP Mobile, hãy sử dụng trình duyệt để truy cập AISEP tại www.aisep.tech để sử dụng toàn bộ tính năng`,
            [{ text: 'Đã hiểu' }]
          );
          return;
        }
        
        await login(user, accessToken, refreshToken);
        router.replace('/(tabs)');
      } else {
        setError(response?.message || 'Email hoặc mật khẩu không đúng.');
      }
    } catch (err) {
      setError(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Rocket size={24} color={colors.primary} />
            <Text style={[styles.logoText, { color: colors.text }]}>AISEP</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Đăng nhập vào AISEP</Text>
          
          <Input
            label="Địa chỉ email"
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
          />

          <View style={styles.passwordContainer}>
            <Input
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              style={{ marginBottom: 0 }}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} color={colors.secondaryText} /> : <Eye size={20} color={colors.secondaryText} />}
            </TouchableOpacity>
          </View>

          {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.forgotContainer}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <Button 
            title="Đăng nhập" 
            onPress={handleLogin} 
            loading={isLoading}
            style={styles.loginButton}
          />

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.secondaryText }]}>hoặc</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.signupPrompt}>
            <Text style={[styles.signupText, { color: colors.secondaryText }]}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: THEME.spacing.xs,
  },
  content: {
    padding: THEME.spacing.lg,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: THEME.spacing.xl,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: THEME.spacing.md,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    bottom: 15,
  },
  errorText: {
    marginBottom: THEME.spacing.md,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: THEME.spacing.lg,
  },
  forgotText: {
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: THEME.spacing.xl,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: THEME.spacing.md,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
  },
  signupLink: {
    fontWeight: '700',
  },
});
