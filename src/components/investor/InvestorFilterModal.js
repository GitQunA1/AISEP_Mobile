import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, PanResponder, Pressable, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FILTER_OPTIONS = {
  stage: ['Giai đoạn sớm', 'MVP', 'Growth'],
  fundingStatus: ['Đang hoạt động', 'Đã đóng quỹ'],
  industry: ['Fintech', 'Edtech', 'E-commerce', 'Agritech', 'SaaS']
};

export default function InvestorFilterModal({ isVisible, filters, onApply, onClose }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  const [localFilters, setLocalFilters] = useState(filters);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Bottom Sheet PanResponder for dragging down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeModal();
        } else {
          // Snap back to top
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isVisible) {
      setLocalFilters(filters);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 14,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, filters]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    closeModal();
  };

  const clearFilters = () => {
    const cleared = {
      industry: 'Tất cả ngành nghề',
      stage: 'Tất cả giai đoạn',
      fundingStatus: 'Tất cả trạng thái',
      minAiScore: 0
    };
    setLocalFilters(cleared);
    onApply(cleared);
    closeModal();
  };

  const hasActiveFilters = 
    localFilters.industry !== 'Tất cả ngành nghề' || 
    localFilters.stage !== 'Tất cả giai đoạn' || 
    localFilters.fundingStatus !== 'Tất cả trạng thái';

  return (
    <Modal 
      visible={isVisible} 
      transparent={true} 
      animationType="none"
      onRequestClose={closeModal}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
        </Animated.View>

        <Animated.View 
          style={[
            styles.sheet, 
            { 
              backgroundColor: colors.card, 
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.dragHandle, { backgroundColor: activeTheme.dark ? '#555' : '#ccc' }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Lọc nhà đầu tư</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Nganh nghe */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ngành nghề</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: localFilters.industry === 'Tất cả ngành nghề' ? colors.primary : 'transparent',
                      borderColor: localFilters.industry === 'Tất cả ngành nghề' ? colors.primary : colors.secondaryText,
                      borderWidth: localFilters.industry === 'Tất cả ngành nghề' ? 0 : 1.5
                    }
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, industry: 'Tất cả ngành nghề' }))}
                >
                  <Text style={[styles.chipText, { color: localFilters.industry === 'Tất cả ngành nghề' ? '#fff' : colors.text }]}>
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {FILTER_OPTIONS.industry.map(opt => {
                  const isSelected = localFilters.industry === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.chip,
                        { 
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderColor: isSelected ? colors.primary : colors.secondaryText,
                          borderWidth: isSelected ? 0 : 1.5
                        }
                      ]}
                      onPress={() => setLocalFilters(prev => ({ ...prev, industry: opt }))}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.text }]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Giai doan */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Giai đoạn</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: localFilters.stage === 'Tất cả giai đoạn' ? colors.primary : 'transparent',
                      borderColor: localFilters.stage === 'Tất cả giai đoạn' ? colors.primary : colors.secondaryText,
                      borderWidth: localFilters.stage === 'Tất cả giai đoạn' ? 0 : 1.5
                    }
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, stage: 'Tất cả giai đoạn' }))}
                >
                  <Text style={[styles.chipText, { color: localFilters.stage === 'Tất cả giai đoạn' ? '#fff' : colors.text }]}>
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {FILTER_OPTIONS.stage.map(opt => {
                  const isSelected = localFilters.stage === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.chip,
                        { 
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderColor: isSelected ? colors.primary : colors.secondaryText,
                          borderWidth: isSelected ? 0 : 1.5
                        }
                      ]}
                      onPress={() => setLocalFilters(prev => ({ ...prev, stage: opt }))}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.text }]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Trang thai */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trạng thái</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: localFilters.fundingStatus === 'Tất cả trạng thái' ? colors.primary : 'transparent',
                      borderColor: localFilters.fundingStatus === 'Tất cả trạng thái' ? colors.primary : colors.secondaryText,
                      borderWidth: localFilters.fundingStatus === 'Tất cả trạng thái' ? 0 : 1.5
                    }
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, fundingStatus: 'Tất cả trạng thái' }))}
                >
                  <Text style={[styles.chipText, { color: localFilters.fundingStatus === 'Tất cả trạng thái' ? '#fff' : colors.text }]}>
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {FILTER_OPTIONS.fundingStatus.map(opt => {
                  const isSelected = localFilters.fundingStatus === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.chip,
                        { 
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderColor: isSelected ? colors.primary : colors.secondaryText,
                          borderWidth: isSelected ? 0 : 1.5
                        }
                      ]}
                      onPress={() => setLocalFilters(prev => ({ ...prev, fundingStatus: opt }))}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.text }]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={[styles.clearBtnText, { color: colors.text }]}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.8,
    zIndex: 101,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  filterSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    marginRight: 12,
  },
  clearBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
