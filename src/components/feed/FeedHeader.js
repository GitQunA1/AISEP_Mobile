import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable, Dimensions, Animated, PanResponder } from 'react-native';
import { Plus, Filter, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedHeader({ user, onFilterChange, onShowProjectForm, title = "Khám phá dự án", subtitle = "Khám phá các dự án sáng tạo được hỗ trợ bởi AI", showFilter = true }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    industry: '',
    stage: '',
    minScore: 0,
    fundingStage: '',
  });

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // PanResponder for swiping down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
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
    if (showFilterModal) {
      // Opening animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 15,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showFilterModal]);

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
      setShowFilterModal(false);
    });
  };

  const industries = ['AI/ML', 'Fintech', 'Healthtech', 'EdTech', 'Thương mại điện tử', 'SaaS', 'Logistics', 'Bất động sản', 'Climate Tech', 'Khác'];
  const stages = ['Ý tưởng', 'MVP', 'Tăng trưởng sớm', 'Tăng trưởng', 'Series A', 'Series B+', 'Trưởng thành'];
  
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const cleared = { industry: '', stage: '', minScore: 0, fundingStage: '' };
    setFilters(cleared);
    if (onFilterChange) onFilterChange(cleared);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 0);
  const isStartupRole = user?.role === 0 || user?.role?.toString().toLowerCase() === 'startup';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Action Bar: Post Project (Left) + Filter (Right) */}
      {(showFilter || (isStartupRole && onShowProjectForm)) && (
        <View style={styles.filterBar}>
          {isStartupRole && onShowProjectForm && (
            <TouchableOpacity 
              style={[
                styles.primaryBtn, 
                { 
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                }
              ]} 
              onPress={onShowProjectForm}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#fff" />
              <Text style={styles.primaryBtnText}>Đăng Dự Án</Text>
            </TouchableOpacity>
          )}

          {showFilter && (
            <TouchableOpacity 
              style={[
                  styles.filterToggle, 
                  { 
                      backgroundColor: colors.card, 
                      borderColor: colors.border 
                  }
              ]}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
            >
              <Filter size={16} color={colors.text} />
              <Text style={[styles.filterText, { color: colors.text }]}>Bộ lọc</Text>
              {hasActiveFilters && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal 
        visible={showFilterModal} 
        animationType="none" 
        transparent={true} 
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              StyleSheet.absoluteFill, 
              { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }
            ]}
          >
            <Pressable style={styles.dismissArea} onPress={closeModal} />
          </Animated.View>

          <Animated.View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.card,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Drag Handle Area - Large hit area for swiping */}
            <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
                <View style={[styles.dragHandle, { backgroundColor: activeTheme.dark ? '#555' : '#ccc' }]} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Lọc dự án</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={20} style={styles.closeIconBtn}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Industry Filter */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Ngành nghề</Text>
                <View style={styles.chipContainer}>
                    <TouchableOpacity 
                        style={[
                            styles.chip, 
                            { 
                                backgroundColor: filters.industry === '' ? colors.primary : 'transparent',
                                borderColor: filters.industry === '' ? colors.primary : colors.secondaryText,
                                borderWidth: filters.industry === '' ? 0 : 1.5
                            }
                        ]}
                        onPress={() => handleFilterChange('industry', '')}
                    >
                        <Text style={[styles.chipText, { color: filters.industry === '' ? '#fff' : colors.text }]}>Tất cả</Text>
                    </TouchableOpacity>
                    {industries.map(ind => (
                        <TouchableOpacity 
                            key={ind}
                            style={[
                                styles.chip, 
                                { 
                                    backgroundColor: filters.industry === ind ? colors.primary : 'transparent',
                                    borderColor: filters.industry === ind ? colors.primary : colors.secondaryText,
                                    borderWidth: filters.industry === ind ? 0 : 1.5
                                }
                            ]}
                            onPress={() => handleFilterChange('industry', ind)}
                        >
                            <Text style={[styles.chipText, { color: filters.industry === ind ? '#fff' : colors.text }]}>{ind}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
              </View>

              {/* Stage Filter */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>Giai đoạn</Text>
                <View style={styles.chipContainer}>
                    <TouchableOpacity 
                        style={[
                            styles.chip, 
                            { 
                                backgroundColor: filters.stage === '' ? colors.primary : 'transparent',
                                borderColor: filters.stage === '' ? colors.primary : colors.secondaryText,
                                borderWidth: filters.stage === '' ? 0 : 1.5
                            }
                        ]}
                        onPress={() => handleFilterChange('stage', '')}
                    >
                        <Text style={[styles.chipText, { color: filters.stage === '' ? '#fff' : colors.text }]}>Tất cả</Text>
                    </TouchableOpacity>
                    {stages.map(stg => (
                        <TouchableOpacity 
                            key={stg}
                            style={[
                                styles.chip, 
                                { 
                                    backgroundColor: filters.stage === stg ? colors.primary : 'transparent',
                                    borderColor: filters.stage === stg ? colors.primary : colors.secondaryText,
                                    borderWidth: filters.stage === stg ? 0 : 1.5
                                }
                            ]}
                            onPress={() => handleFilterChange('stage', stg)}
                        >
                            <Text style={[styles.chipText, { color: filters.stage === stg ? '#fff' : colors.text }]}>{stg}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
              </View>
              
              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilters}>
                  <Text style={[styles.clearBtnText, { color: colors.text }]}>Xóa bộ lọc</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.applyBtn, { backgroundColor: colors.primary }]} 
                onPress={closeModal}
              >
                <Text style={styles.applyBtnText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 10,
    lineHeight: 18,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 4,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingBottom: 20,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeIconBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  filterGroup: {
    marginTop: 20,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipContainer: {
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
  modalFooter: {
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
