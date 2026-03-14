import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Rocket, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react-native';
import authService from '../../src/services/authService';
import THEME from '../../src/constants/Theme';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import Card from '../../src/components/Card';

const ROLES = [
  { id: 0, key: 'startup', title: 'Startup / Nhà sáng lập', desc: 'Dành cho các dự án khởi nghiệp đang tìm kiếm sự hỗ trợ và đầu tư.' },
  { id: 1, key: 'investor', title: 'Nhà đầu tư', desc: 'Dành cho các cá nhân hoặc tổ chức muốn tìm kiếm cơ hội đầu tư.' },
  { id: 2, key: 'advisor', title: 'Cố vấn / Chuyên gia', desc: 'Dành cho các chuyên gia muốn hỗ trợ và định hướng cho startup.' },
  { id: 3, key: 'operation_staff', title: 'Nhân viên vận hành', desc: 'Dành cho đội ngũ quản trị và vận hành hệ thống.' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Form, 3: Success
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(2);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên.';
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập địa chỉ email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ.';
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu.';
    else if (formData.password.length < 8) newErrors.password = 'Mật khẩu phải từ 8 ký tự.';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const response = await authService.register({
        ...formData,
        role: selectedRole.id,
      });
      if (response.success) {
        setStep(3);
      } else {
        Alert.alert('Lỗi', response.message || 'Đăng ký thất bại.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={THEME.colors.text} />
          </TouchableOpacity>
          <Text style={styles.logoText}>Chọn vai trò</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <Text style={styles.subtitle}>Chào mừng bạn đến với AISEP</Text>
          <Text style={styles.rolesTitle}>Bạn đăng ký với tư cách là?</Text>
          {ROLES.map((role) => (
            <TouchableOpacity key={role.key} onPress={() => handleRoleSelect(role)}>
              <Card style={styles.roleCard}>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleDesc}>{role.desc}</Text>
                </View>
                <ChevronRight size={20} color={THEME.colors.secondaryText} />
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
            <ArrowLeft size={24} color={THEME.colors.text} />
          </TouchableOpacity>
          <Text style={styles.logoText}>{selectedRole.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.formContent}>
          <Input 
            label="Họ và tên" 
            value={formData.fullName} 
            onChangeText={(v) => setFormData({...formData, fullName: v})} 
            error={errors.fullName}
            placeholder="Nhập họ và tên"
          />
          <Input 
            label="Địa chỉ email" 
            value={formData.email} 
            onChangeText={(v) => setFormData({...formData, email: v})} 
            error={errors.email}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <Input 
            label="Mật khẩu" 
            value={formData.password} 
            onChangeText={(v) => setFormData({...formData, password: v})} 
            error={errors.password}
            placeholder="Tối thiểu 8 ký tự"
            secureTextEntry
          />
          <Input 
            label="Xác nhận mật khẩu" 
            value={formData.confirmPassword} 
            onChangeText={(v) => setFormData({...formData, confirmPassword: v})} 
            error={errors.confirmPassword}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
          />
          <Button 
            title="Tạo tài khoản" 
            onPress={handleRegister} 
            loading={isLoading}
            style={styles.submitButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 3) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <CheckCircle size={80} color={THEME.colors.success} />
          <Text style={styles.successTitle}>Đăng ký thành công!</Text>
          <Text style={styles.successSubtitle}>
            Vui lòng kiểm tra email <Text style={{fontWeight:'700'}}>{formData.email}</Text> để xác nhận tài khoản trước khi đăng nhập.
          </Text>
          <Button 
            title="Về trang đăng nhập" 
            onPress={() => router.replace('/(auth)/login')} 
            style={styles.homeButton}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
  },
  backButton: { padding: 4 },
  logoText: { fontSize: 18, fontWeight: '700', color: THEME.colors.text },
  centerContent: {
    padding: THEME.spacing.lg,
  },
  subtitle: { fontSize: 16, color: THEME.colors.secondaryText, marginBottom: 8 },
  rolesTitle: { fontSize: 24, fontWeight: '800', marginBottom: 24, color: THEME.colors.text },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    padding: THEME.spacing.lg,
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, color: THEME.colors.text },
  roleDesc: { fontSize: 14, color: THEME.colors.secondaryText },
  formContent: { padding: THEME.spacing.lg },
  submitButton: { marginTop: THEME.spacing.lg },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
  },
  successTitle: { fontSize: 28, fontWeight: '800', marginTop: 24, marginBottom: 16, color: THEME.colors.text },
  successSubtitle: { fontSize: 16, textAlign: 'center', color: THEME.colors.secondaryText, marginBottom: THEME.spacing.xxl, lineHeight: 24 },
  homeButton: { width: '100%' },
});
