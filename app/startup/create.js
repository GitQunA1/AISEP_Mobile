import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import ProjectSubmissionForm from '../../src/components/startup/ProjectSubmissionForm';

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const handleSuccess = () => {
    Alert.alert('Thành công', 'Dự án của bạn đã được gửi và đang chờ phê duyệt.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') }
    ]);
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ProjectSubmissionForm
        isPage={true}
        visible={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        user={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
