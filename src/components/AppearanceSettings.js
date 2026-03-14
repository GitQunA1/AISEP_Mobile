import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react-native';

const AppearanceSettings = () => {
  const { themeMode, updateThemeMode, activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  }, []);

  const themes = [
    { id: 'light', label: 'Sáng', icon: Sun, desc: 'Tươi sáng & rõ nét' },
    { id: 'dark', label: 'Tối', icon: Moon, desc: 'Dịu mắt & tiết kiệm pin' },
    { id: 'system', label: 'Hệ thống', icon: Monitor, desc: 'Tự động theo thiết bị' },
  ];

  const renderThemePreview = (id) => {
    const isActive = themeMode === id;
    
    // Mockup styles
    const mockupBg = id === 'light' ? '#F8FAFC' : id === 'dark' ? '#0F172A' : '#F1F5F9';
    const headerBg = id === 'light' ? '#FFFFFF' : id === 'dark' ? '#1E293B' : '#E2E8F0';
    const contentColor = id === 'light' ? '#E2E8F0' : '#334155';
    const primaryColor = '#3B82F6';

    return (
      <View style={[
        styles.previewContainer, 
        { 
          backgroundColor: mockupBg,
          borderColor: isActive ? primaryColor : colors.border,
          borderWidth: isActive ? 2 : 1,
        }
      ]}>
        {/* Mockup UI Elements */}
        <View style={[styles.mockHeader, { backgroundColor: headerBg }]}>
          <View style={[styles.mockDot, { backgroundColor: primaryColor }]} />
          <View style={[styles.mockLine, { backgroundColor: contentColor, width: '40%' }]} />
        </View>
        
        <View style={styles.mockBody}>
          <View style={[styles.mockLine, { backgroundColor: contentColor, width: '80%', marginBottom: 6 }]} />
          <View style={[styles.mockLine, { backgroundColor: contentColor, width: '60%', marginBottom: 6 }]} />
          <View style={styles.mockGrid}>
            <View style={[styles.mockBox, { backgroundColor: headerBg }]} />
            <View style={[styles.mockBox, { backgroundColor: headerBg }]} />
          </View>
        </View>

        <View style={[styles.mockBottom, { backgroundColor: headerBg }]}>
          <View style={[styles.mockTab, { backgroundColor: isActive ? primaryColor : contentColor }]} />
          <View style={[styles.mockTab, { backgroundColor: contentColor }]} />
          <View style={[styles.mockTab, { backgroundColor: contentColor }]} />
        </View>

        {isActive && (
          <View style={[styles.checkBadge, { backgroundColor: primaryColor }]}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        )}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>CHỌN CHẾ ĐỘ HIỂN THỊ</Text>
      
      <View style={styles.grid}>
        {themes.map((t) => (
          <TouchableOpacity 
            key={t.id} 
            style={styles.themeOption}
            onPress={() => updateThemeMode(t.id)}
            activeOpacity={0.8}
          >
            {renderThemePreview(t.id)}
            <Text style={[styles.label, { color: themeMode === t.id ? colors.primary : colors.text }]}>
              {t.label}
            </Text>
            <Text style={[styles.desc, { color: colors.secondaryText }]} numberOfLines={1}>
              {t.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 16, letterSpacing: 1 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  themeOption: { width: '31%', alignItems: 'center' },
  
  previewContainer: { 
    width: '100%', 
    aspectRatio: 0.7, 
    borderRadius: 16, 
    padding: 6, 
    marginBottom: 10, 
    position: 'relative',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Mockup Elements
  mockHeader: { height: 16, borderRadius: 4, marginBottom: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  mockDot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  mockLine: { height: 3, borderRadius: 1.5 },
  mockBody: { flex: 1, paddingHorizontal: 2 },
  mockGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  mockBox: { width: '45%', height: 20, borderRadius: 4 },
  mockBottom: { height: 14, borderRadius: 4, marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  mockTab: { width: 12, height: 3, borderRadius: 1.5 },

  checkBadge: { 
    position: 'absolute', 
    top: 6, 
    right: 6, 
    borderRadius: 10, 
    width: 20, 
    height: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  
  label: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  desc: { fontSize: 10, textAlign: 'center' }
});

export default AppearanceSettings;
