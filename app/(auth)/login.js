import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Rocket, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import authService from '../../src/services/authService';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={THEME.colors.text} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Rocket size={24} color={THEME.colors.primary} />
            <Text style={styles.logoText}>AISEP</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Đăng nhập vào AISEP</Text>
          
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
              {showPassword ? <EyeOff size={20} color={THEME.colors.secondaryText} /> : <Eye size={20} color={THEME.colors.secondaryText} />}
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <Button 
            title="Đăng nhập" 
            onPress={handleLogin} 
            loading={isLoading}
            style={styles.loginButton}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signupPrompt}>
            <Text style={styles.signupText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signupLink}>Đăng ký ngay</Text>
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
    backgroundColor: THEME.colors.background,
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
    color: THEME.colors.text,
    marginLeft: THEME.spacing.xs,
  },
  content: {
    padding: THEME.spacing.lg,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.text,
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
    color: THEME.colors.error,
    marginBottom: THEME.spacing.md,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: THEME.spacing.lg,
  },
  forgotText: {
    color: THEME.colors.primary,
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
    backgroundColor: THEME.colors.border,
  },
  dividerText: {
    marginHorizontal: THEME.spacing.md,
    color: THEME.colors.secondaryText,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: THEME.colors.secondaryText,
  },
  signupLink: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
});
