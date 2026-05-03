import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
  ScrollView, KeyboardAvoidingView, Pressable, Dimensions, Image, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X, ChevronLeft, ChevronRight, Check, AlertCircle,
  Calendar as CalendarIcon, Clock, User, Briefcase,
  CreditCard, Sparkles, Loader2
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import bookingService from '../services/bookingService';
import advisorAvailabilityService from '../services/advisorAvailabilityService';
import advisorService from '../services/advisorService';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import Card from './Card';
import FadeInView from './FadeInView';
import Button from './Button';
import PaymentModal from './PaymentModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STEPS = ['Dự Án', 'Cố Vấn', 'Lịch Trình', 'Xác Nhận'];

export default function AdvisorBookingModal({
  isVisible,
  onClose,
  advisor = null,
  initialAdvisorId = null,
  initialProjectId = null,
  sourceBookingId = null,
  onSuccess
}) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const insets = useSafeAreaInsets();
  const { quota } = useSubscription();

  // Use either the advisor object or the explicit ID
  const targetAdvisorId = initialAdvisorId || advisor?.advisorId || advisor?.id;

  // -- STATE --
  const [step, setStep] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // Step 0 - Project
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Step 1 - Advisor
  const [advisorOptions, setAdvisorOptions] = useState([]);
  const [advisorDetails, setAdvisorDetails] = useState({});
  const [advisorsLoading, setAdvisorsLoading] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);

  // Step 2 - Slots
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [slotValidationError, setSlotValidationError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [note, setNote] = useState('');
  const [isComplaintRebook, setIsComplaintRebook] = useState(false);

  // Step 3 - Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [useFreeBooking, setUseFreeBooking] = useState(false);

  // -- INITIALIZATION --
  useEffect(() => {
    if (isVisible) {
      // RESET everything when opening
      setStep(0);
      setSelectedProject(null);
      setSelectedAdvisor(null);
      setSelectedSlotIds([]);
      setUseFreeBooking(false);
      setNote('');
      setIsSuccess(false);
      setCreatedBooking(null);

      const init = async () => {
        setIsInitializing(true);
        try {
          let preSelectedProject = null;
          let preSelectedAdvisor = null;

          // Handle Source Booking (Re-booking flow)
          if (sourceBookingId) {
            try {
              const booking = await bookingService.getBookingById(sourceBookingId);
              if (booking) {
                const pId = booking.projectId || booking.ProjectId;
                const pName = booking.projectName || booking.ProjectName;
                
                if (pId) {
                  preSelectedProject = { projectId: pId, projectName: pName || 'Dự án' };
                  setSelectedProject(preSelectedProject);
                }

                // If complaint was accepted, this is a free re-booking
                if (booking.status === 4 || booking.status === "ComplaintAccepted") {
                  setIsComplaintRebook(true);
                  setUseFreeBooking(true);
                }
              }
            } catch (err) {
              console.error("Failed to load source booking:", err);
            }
          }

          // 1. Handle Pre-selected Project if initialProjectId is provided (and not already set by sourceBooking)
          if (initialProjectId && !preSelectedProject) {
            const allProjects = await bookingService.getProjectOptions();
            const found = allProjects.find(p => p.projectId === initialProjectId);
            if (found) {
              preSelectedProject = found;
              setSelectedProject(found);
            }
          }

          // 2. Handle Pre-selected Advisor if targetAdvisorId (from Connect button) is provided
          if (targetAdvisorId) {
            const data = advisor || await advisorService.getAdvisorById(targetAdvisorId);
            const opt = {
              advisorId: targetAdvisorId,
              advisorName: data?.userName || data?.name || ''
            };
            setAdvisorDetails(prev => ({ ...prev, [targetAdvisorId]: data }));
            preSelectedAdvisor = opt;
            setSelectedAdvisor(opt);
          }

          // 3. Logic to auto-skip steps
          if (preSelectedProject && preSelectedAdvisor) {
            setStep(2);
          } else if (preSelectedProject) {
            setStep(1);
          } else {
            setStep(0);
          }

        } catch (e) {
          console.error("Initialization error:", e);
        } finally {
          setIsInitializing(false);
        }
      };
      init();
    }
  }, [isVisible, targetAdvisorId, initialProjectId, sourceBookingId]);

  // -- DATA FETCHING --

  // Load Projects (Step 0)
  const loadProjects = async () => {
    if (step !== 0) return;
    setProjectsLoading(true);
    try {
      const rawData = await bookingService.getProjectOptions();
      const projectList = Array.isArray(rawData) ? rawData : [];

      if (projectList.length === 0) {
        setProjects([]);
        return;
      }

      // -- MATCH WEB LOGIC: Filter projects that have advisors --
      const assignedProjectIds = [];
      await Promise.allSettled(
        projectList.map(async (p) => {
          try {
            const options = await bookingService.getAdvisorOptions(p.projectId);
            const list = Array.isArray(options) ? options : [];

            if (list.length > 0) {
              // If an initialAdvisorId was passed, ONLY show projects for THAT advisor
              if (targetAdvisorId) {
                if (list.some(o => o.advisorId === targetAdvisorId)) {
                  assignedProjectIds.push(p.projectId);
                }
              } else {
                assignedProjectIds.push(p.projectId);
              }
            }
          } catch { /* ignore */ }
        })
      );

      const filtered = projectList.filter(p => assignedProjectIds.includes(p.projectId));
      setProjects(filtered);
    } catch (e) {
      console.error("Load projects error:", e);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 0 && isVisible && !isInitializing) loadProjects();
  }, [step, isVisible, isInitializing, targetAdvisorId]);

  // Load Advisors (Step 1)
  const loadAdvisors = async () => {
    if (step !== 1 || !selectedProject) return;
    setAdvisorsLoading(true);
    try {
      let options;
      if (sourceBookingId) {
        options = await bookingService.getReplacementAdvisorOptions(sourceBookingId);
      } else {
        options = await bookingService.getAdvisorOptions(selectedProject.projectId);
      }
      const list = Array.isArray(options) ? options : [];
      setAdvisorOptions(list);

      // Fetch details for each
      const details = { ...advisorDetails };
      await Promise.all(list.map(async opt => {
        if (details[opt.advisorId]) return;
        try {
          const full = await advisorService.getAdvisorById(opt.advisorId);
          details[opt.advisorId] = full;
        } catch { /* ignore */ }
      }));
      setAdvisorDetails(details);
    } catch (e) {
      console.error("Load advisors error:", e);
    } finally {
      setAdvisorsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 1 && selectedProject) loadAdvisors();
  }, [step, selectedProject]);

  // Load Slots (Step 2)
  const loadSlots = async () => {
    if (step !== 2 || !selectedAdvisor) return;
    setSlotsLoading(true);
    try {
      const data = await advisorAvailabilityService.getByAdvisorId(selectedAdvisor.advisorId);
      // Filter for Available slots
      const available = data.filter(s => s.status === 0 || s.status === 'Available');
      setSlots(available);
    } catch (e) {
      console.error("Load slots error:", e);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Group slots by date
  const groupedSlots = useMemo(() => {
    const map = {};
    slots.forEach(slot => {
      const dateKey = slot.slotDate?.split('T')[0] || '';
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(slot);
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, daySlots]) => ({
        date,
        daySlots: daySlots.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
      }));
  }, [slots]);

  // Set default date when slots load
  useEffect(() => {
    if (groupedSlots.length > 0 && !selectedDate) {
      setSelectedDate(groupedSlots[0].date);
    } else if (groupedSlots.length > 0 && !groupedSlots.some(g => g.date === selectedDate)) {
      setSelectedDate(groupedSlots[0].date);
    }
  }, [groupedSlots, selectedDate]);

  useEffect(() => {
    if (step === 2 && selectedAdvisor) loadSlots();
  }, [step, selectedAdvisor]);

  // -- VALIDATION --
  const validateSlots = useCallback((selectedIds) => {
    if (selectedIds.length === 0) {
      setSlotValidationError(null);
      return false;
    }

    const selectedSlots = slots.filter(s => selectedIds.includes(s.advisorAvailabilityId)).sort((a, b) => {
      const da = new Date(`${a.slotDate?.split('T')[0]}T${a.startTime}`);
      const db = new Date(`${b.slotDate?.split('T')[0]}T${b.startTime}`);
      return da - db;
    });

    // Min 12 hours ahead
    const now = new Date();
    const first = selectedSlots[0];
    const firstStart = new Date(`${first.slotDate?.split('T')[0]}T${first.startTime}`);
    const hoursAhead = (firstStart - now) / (1000 * 60 * 60);
    if (hoursAhead < 12) {
      setSlotValidationError('Vui lòng đặt lịch trước ít nhất 12 giờ.');
      return false;
    }

    // Consecutive check
    for (let i = 1; i < selectedSlots.length; i++) {
      const prevEnd = new Date(`${selectedSlots[i - 1].slotDate?.split('T')[0]}T${selectedSlots[i - 1].endTime}`);
      const currStart = new Date(`${selectedSlots[i].slotDate?.split('T')[0]}T${selectedSlots[i].startTime}`);
      if (currStart.getTime() !== prevEnd.getTime()) {
        setSlotValidationError('Các khung giờ phải liên tiếp nhau.');
        return false;
      }
    }

    setSlotValidationError(null);
    return true;
  }, [slots]);

  const handleSlotToggle = (slotId) => {
    Haptics.selectionAsync();
    setSelectedSlotIds(prev => {
      const next = prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId];
      validateSlots(next);
      return next;
    });
  };

  // -- ACTIONS --
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If we have a target advisor (Connect flow), and we pick a project, 
    // we already have the advisor selected, so we jump straight to SLOTS (Step 2)
    if (step === 0 && targetAdvisorId && selectedAdvisor) {
      setStep(2);
      return;
    }

    if (step < 3) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateSlots(selectedSlotIds)) return;
    setIsSubmitting(true);
    try {
      const payload = {
        AdvisorId: selectedAdvisor.advisorId,
        ProjectId: selectedProject?.projectId,
        AdvisorAvailabilitySlotIds: selectedSlotIds,
        Note: note.trim() || null,
        IsFreeBooking: useFreeBooking || isComplaintRebook,
        ...(sourceBookingId ? { SourceBookingId: sourceBookingId } : {}),
      };
      const result = await bookingService.createBooking(payload);
      setCreatedBooking(result);
      setIsSuccess(true);
      if (onSuccess) onSuccess(selectedAdvisor.advisorId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu đặt lịch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -- RENDER HELPERS --
  const canGoNext = () => {
    if (step === 0) return !!selectedProject;
    if (step === 1) return !!selectedAdvisor;
    if (step === 2) return selectedSlotIds.length > 0 && !slotValidationError;
    return false;
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const currentAdvisorDetail = selectedAdvisor ? (advisorDetails[selectedAdvisor.advisorId] || {}) : {};
  const hourlyRate = currentAdvisorDetail.hourlyRate || 0;
  const totalPrice = hourlyRate * selectedSlotIds.length;

  // -- VIEWS --

  const renderProjectStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepHint, { color: colors.secondaryText }]}>Chọn dự án bạn muốn nhận tư vấn</Text>
      {projectsLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {projects.length === 0 ? (
            <View style={styles.emptyState}>
              <Briefcase size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Bạn chưa có dự án nào đủ điều kiện đặt lịch.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {projects.map(p => (
                <TouchableOpacity
                  key={p.projectId}
                  style={[
                    styles.optionCard,
                    { borderColor: colors.border },
                    selectedProject?.projectId === p.projectId && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedProject(p);
                  }}
                >
                  <Briefcase size={20} color={selectedProject?.projectId === p.projectId ? colors.primary : colors.secondaryText} />
                  <Text allowFontScaling={false} style={[styles.optionName, { color: colors.text }]} numberOfLines={2}>{p.projectName}</Text>
                  {selectedProject?.projectId === p.projectId && <View style={styles.checkBadge}><Check size={12} color="#fff" /></View>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderAdvisorStep = () => (
    <View style={styles.stepContainer}>
      <Text allowFontScaling={false} style={[styles.stepHint, { color: colors.secondaryText }]}>Cố vấn được phân công cho dự án {selectedProject?.projectName}</Text>
      {advisorsLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {advisorOptions.length === 0 ? (
            <View style={styles.emptyState}>
              <User size={48} color={colors.border} />
              <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.secondaryText }]}>Không tìm thấy cố vấn phù hợp cho dự án này.</Text>
            </View>
          ) : (
            <View style={styles.advisorGrid}>
              {advisorOptions.map(opt => {
                const detail = advisorDetails[opt.advisorId] || {};
                const isSelected = selectedAdvisor?.advisorId === opt.advisorId;
                return (
                  <TouchableOpacity
                    key={opt.advisorId}
                    style={[
                      styles.advisorCard,
                      { borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedAdvisor(opt);
                    }}
                  >
                    <View style={styles.advisorHeader}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text allowFontScaling={false} style={styles.avatarText}>{(opt.advisorName || 'A').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text allowFontScaling={false} style={[styles.advisorName, { color: colors.text }]}>{opt.advisorName}</Text>
                        {detail.expertise && (
                          <Text allowFontScaling={false} style={[styles.advisorExp, { color: colors.secondaryText }]} numberOfLines={1}>
                            {detail.expertise.split(',')[0]}
                          </Text>
                        )}
                      </View>
                    </View>
                    {detail.hourlyRate && (
                      <Text allowFontScaling={false} style={[styles.rateTag, { color: colors.primary }]}>
                        {formatPrice(detail.hourlyRate)}/giờ
                      </Text>
                    )}
                    {isSelected && <View style={styles.checkBadge}><Check size={12} color="#fff" /></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderSlotStep = () => {
    const activeDay = groupedSlots.find(g => g.date === selectedDate);
    const daySlots = activeDay ? activeDay.daySlots : [];

    return (
      <View style={styles.stepContainer}>
        <Text allowFontScaling={false} style={[styles.stepHint, { color: colors.secondaryText }]}>Chọn ngày và khung giờ tư vấn (tối thiểu 1h)</Text>

        {/* Date Selector */}
        {!slotsLoading && groupedSlots.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {groupedSlots.map(g => {
                const isActive = selectedDate === g.date;
                const d = new Date(g.date);
                return (
                  <TouchableOpacity
                    key={g.date}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedDate(g.date);
                    }}
                    style={[
                      styles.dateTab,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      isActive && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                    ]}
                  >
                    <Text allowFontScaling={false} style={[styles.dateTabWeekday, { color: isActive ? colors.primary : colors.secondaryText }]}>
                      {d.toLocaleDateString('vi-VN', { weekday: 'short' })}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.dateTabDay, { color: isActive ? colors.primary : colors.text }]}>
                      {d.getDate()}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.dateTabMonth, { color: isActive ? colors.primary : colors.secondaryText }]}>
                      Tháng {d.getMonth() + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {slotValidationError && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '15', marginBottom: 15 }]}>
            <AlertCircle size={16} color={colors.error} />
            <Text allowFontScaling={false} style={[styles.errorText, { color: colors.error }]}>{slotValidationError}</Text>
          </View>
        )}

        {slotsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {slots.length === 0 ? (
                <View style={styles.emptyState}>
                  <CalendarIcon size={48} color={colors.border} />
                  <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.secondaryText }]}>Cố vấn chưa thiết lập lịch rảnh.</Text>
                </View>
              ) : daySlots.length === 0 ? (
                <View style={styles.emptyState}>
                  <Clock size={48} color={colors.border} />
                  <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.secondaryText }]}>Không có khung giờ rảnh trong ngày này.</Text>
                </View>
              ) : (
                <View style={styles.slotGrid}>
                  {daySlots.map(s => {
                    const isSelected = selectedSlotIds.includes(s.advisorAvailabilityId);
                    // Check if 12h ahead
                    const now = new Date();
                    const slotStart = new Date(`${s.slotDate?.split('T')[0]}T${s.startTime}`);
                    const tooSoon = (slotStart - now) < 12 * 60 * 60 * 1000;

                    return (
                      <TouchableOpacity
                        key={s.advisorAvailabilityId}
                        style={[
                          styles.slotChip,
                          { borderColor: colors.border, backgroundColor: colors.card },
                          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                          tooSoon && { opacity: 0.5, backgroundColor: colors.mutedBackground }
                        ]}
                        onPress={() => {
                          if (tooSoon) {
                            Alert.alert('Thông báo', 'Bạn cần đặt lịch trước ít nhất 12 giờ.');
                            return;
                          }
                          handleSlotToggle(s.advisorAvailabilityId);
                        }}
                      >
                        <Text style={[styles.slotTime, { color: isSelected ? '#fff' : colors.text, fontWeight: '700' }]}>
                          {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                        </Text>
                        {tooSoon && <Text style={{ fontSize: 9, color: colors.secondaryText, marginTop: 2 }}>Quá hạn đặt</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <KeyboardAvoidingView behavior="padding">
              <View style={[styles.noteSection, { borderTopColor: colors.border }]}>
                <Text allowFontScaling={false} style={[styles.noteLabel, { color: colors.text }]}>Ghi chú (tùy chọn)</Text>
                <TextInput
                  style={[styles.noteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="Mô tả nhu cầu tư vấn của bạn..."
                  placeholderTextColor={colors.secondaryText + '80'}
                  multiline
                  numberOfLines={3}
                  value={note}
                  onChangeText={setNote}
                />
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    );
  };

  const renderConfirmStep = () => {
    const selectedSlots = slots
      .filter(s => selectedSlotIds.includes(s.advisorAvailabilityId))
      .sort((a, b) => {
        const da = new Date(`${a.slotDate?.split('T')[0]}T${a.startTime}`);
        const db = new Date(`${b.slotDate?.split('T')[0]}T${b.startTime}`);
        return da - db;
      });

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepHint, { color: colors.secondaryText }]}>Kiểm tra lại thông tin trước khi gửi yêu cầu</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={styles.confirmCard}>
            <View style={styles.summaryItem}>
              <Briefcase size={16} color={colors.primary} />
              <View>
                <Text allowFontScaling={false} style={[styles.summaryLabel, { color: colors.secondaryText }]}>Dự án</Text>
                <Text allowFontScaling={false} style={[styles.summaryVal, { color: colors.text }]}>{selectedProject?.projectName}</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <User size={16} color={colors.primary} />
              <View>
                <Text allowFontScaling={false} style={[styles.summaryLabel, { color: colors.secondaryText }]}>Cố vấn</Text>
                <Text allowFontScaling={false} style={[styles.summaryVal, { color: colors.text }]}>{selectedAdvisor?.advisorName}</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Clock size={16} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={[styles.summaryLabel, { color: colors.secondaryText }]}>Thời gian ({selectedSlotIds.length} giờ)</Text>
                {selectedSlots.map(s => (
                  <Text allowFontScaling={false} key={s.advisorAvailabilityId} style={[styles.summaryVal, { color: colors.text, fontSize: 13, marginTop: 2 }]}>
                    • {new Date(s.slotDate).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })} | {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.summaryDivider} />
 
            {(quota.totalFreeBookings > 0 || isComplaintRebook) && (
              <TouchableOpacity 
                style={[
                  styles.freeBookingToggle, 
                  { 
                    borderColor: (useFreeBooking || isComplaintRebook) ? colors.primary : colors.border, 
                    backgroundColor: (useFreeBooking || isComplaintRebook) ? colors.primary + '10' : 'transparent' 
                  }
                ]}
                onPress={() => {
                  if (isComplaintRebook) return; 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUseFreeBooking(!useFreeBooking);
                }}
                disabled={isComplaintRebook}
              >
                <View style={styles.freeBookingInfo}>
                  <Sparkles size={16} color={(useFreeBooking || isComplaintRebook) ? colors.primary : colors.secondaryText} />
                  <View>
                    <Text allowFontScaling={false} style={[styles.freeBookingLabel, { color: colors.text }]}>
                      {isComplaintRebook ? 'Đặt lại miễn phí (Khiếu nại)' : 'Sử dụng lượt miễn phí'}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.freeBookingQuota, { color: colors.secondaryText }]}>
                      {isComplaintRebook ? 'Được Staff phê duyệt' : `Bạn đang có ${quota.totalFreeBookings} lượt`}
                    </Text>
                  </View>
                </View>
                <View style={[styles.customCheck, { borderColor: (useFreeBooking || isComplaintRebook) ? colors.primary : colors.border, backgroundColor: (useFreeBooking || isComplaintRebook) ? colors.primary : 'transparent' }]}>
                  {(useFreeBooking || isComplaintRebook) && <Check size={12} color="#fff" />}
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.summaryItem}>
              <CreditCard size={16} color={colors.accentGreen} />
              <View style={styles.priceRow}>
                <View>
                  <Text allowFontScaling={false} style={[styles.summaryLabel, { color: colors.secondaryText }]}>Chi phí ước tính</Text>
                  <Text allowFontScaling={false} style={[styles.summaryMeta, { color: colors.secondaryText }]}>
                    {(useFreeBooking || isComplaintRebook) ? 'Gói ưu đãi đặc biệt' : `${formatPrice(hourlyRate)}/giờ × ${selectedSlotIds.length}h`}
                  </Text>
                </View>
                <Text allowFontScaling={false} style={[styles.totalPrice, { color: (useFreeBooking || isComplaintRebook) ? colors.accentGreen : colors.primary }]}>
                  {(useFreeBooking || isComplaintRebook) ? 'Miễn phí' : formatPrice(totalPrice)}
                </Text>
              </View>
            </View>
          </Card>

          {note ? (
            <View style={styles.summaryNoteArea}>
              <Text allowFontScaling={false} style={[styles.summaryLabel, { color: colors.secondaryText, marginBottom: 8 }]}>Ghi chú:</Text>
              <Text allowFontScaling={false} style={[styles.summaryNote, { color: colors.text }]}>"{note}"</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  };

  const renderSuccessScreen = () => {
    const b = createdBooking || {};
    const bId = b.id || b.Id || '---';
    return (
      <FadeInView style={styles.successContainer}>
        <View style={[styles.successIconOuter, { backgroundColor: colors.accentGreen + '20' }]}>
          <View style={[styles.successIconInner, { backgroundColor: colors.accentGreen }]}>
            <Check size={40} color="#fff" />
          </View>
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Đặt Lịch Thành Công!</Text>
        <Text style={[styles.successDesc, { color: colors.secondaryText }]}>
          Yêu cầu của bạn đã được gửi. Bạn có thể theo dõi trạng thái tại mục Lịch trình.
        </Text>

        <Card style={styles.successDetailCard}>
          <View style={styles.detailRow}>
            <Text style={{ color: colors.secondaryText }}>Mã Booking:</Text>
            <Text style={{ color: colors.text, fontWeight: '800' }}>#{bId}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={{ color: colors.secondaryText }}>Đối tác:</Text>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{selectedAdvisor?.advisorName}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text allowFontScaling={false} style={{ color: colors.secondaryText }}>Tổng tiền:</Text>
            <Text allowFontScaling={false} style={{ color: useFreeBooking ? colors.accentGreen : colors.primary, fontWeight: '900', fontSize: 16 }}>
              {useFreeBooking ? 'Miễn phí' : formatPrice(totalPrice)}
            </Text>
          </View>
        </Card>

        <View style={styles.successActions}>
          {needsPayment ? (
            <>
              <Button
                title="Thanh Toán Ngay"
                onPress={() => setShowPaymentModal(true)}
                style={{ flex: 1.5 }}
              />
              <Button
                title="Để sau"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
            </>
          ) : (
            <Button
              title="Xong"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </FadeInView>
    );
  };

  // -- LOGIC HELPER --
  const needsPayment =
    createdBooking?.status === 'ApprovedAwaitingPayment' ||
    createdBooking?.status === 1;

  // -- MAIN RENDER --
  if (!isVisible) return null;

  return (
    <Modal 
      visible={isVisible} 
      animationType="slide" 
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <View style={[styles.fullOverlay, { backgroundColor: colors.background }]}>
        {isSuccess ? renderSuccessScreen() : (
          <>
            {/* HEADER */}
            <View style={[styles.wizardHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 4, paddingBottom: 6 }]}>
              <TouchableOpacity onPress={onClose} hitSlop={15}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>Đặt Lịch Tư Vấn</Text>
                <Text allowFontScaling={false} style={[styles.headerStep, { color: colors.primary }]}>{STEPS[step]}</Text>
              </View>
              <View style={{ width: 24 }} />
            </View>

            {/* PROGRESS BAR */}
            <View style={styles.progressTrack}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressSegment,
                    { backgroundColor: colors.border },
                    i <= step && { backgroundColor: colors.primary }
                  ]}
                />
              ))}
            </View>

            {/* BODY */}
            <View style={{ flex: 1 }}>
              {isInitializing ? (
                <View style={styles.centered}>
                  <Loader2 size={32} color={colors.primary} style={styles.spin} />
                  <Text allowFontScaling={false} style={[styles.loadingText, { color: colors.secondaryText }]}>Đang khởi tạo...</Text>
                </View>
              ) : (
                <>
                  {step === 0 && renderProjectStep()}
                  {step === 1 && renderAdvisorStep()}
                  {step === 2 && renderSlotStep()}
                  {step === 3 && renderConfirmStep()}
                </>
              )}
            </View>

            {/* FOOTER */}
            <View style={[styles.wizardFooter, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
              {step > 0 && (
                <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={handleBack}>
                  <ChevronLeft size={20} color={colors.text} />
                  <Text allowFontScaling={false} style={{ color: colors.text, fontWeight: '700' }}>Quay lại</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {step < 3 ? (
                <TouchableOpacity
                  style={[styles.nextBtn, { backgroundColor: canGoNext() ? colors.text : colors.border }]}
                  onPress={handleNext}
                  disabled={!canGoNext()}
                >
                  <Text allowFontScaling={false} style={{ color: colors.background, fontWeight: '800' }}>Tiếp theo</Text>
                  <ChevronRight size={20} color={colors.background} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : (
                    <>
                      <Check size={20} color="#fff" />
                      <Text allowFontScaling={false} style={{ color: '#fff', fontWeight: '900' }}>Gửi Yêu Cầu</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {showPaymentModal && (
          <PaymentModal
            isVisible={showPaymentModal}
            bookingId={createdBooking?.id || createdBooking?.Id}
            price={totalPrice}
            advisorName={selectedAdvisor?.advisorName}
            slotCount={selectedSlotIds.length}
            onClose={() => setShowPaymentModal(false)}
            onPaid={() => {
              setShowPaymentModal(false);
              onClose();
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullOverlay: { flex: 1 },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerStep: { fontSize: 13, fontWeight: '700', marginTop: 0 },
  progressTrack: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingTop: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  stepContainer: { flex: 1, padding: 16, paddingTop: 8 },
  stepHint: { fontSize: 13, fontWeight: '600', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    gap: 12,
    position: 'relative'
  },
  optionName: { fontSize: 14, fontWeight: '800' },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center'
  },
  advisorGrid: { gap: 12 },
  advisorCard: { padding: 16, borderRadius: 24, borderWidth: 2, position: 'relative' },
  advisorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 64,
  },
  dateTabWeekday: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 1 },
  dateTabDay: { fontSize: 16, fontWeight: '900', marginBottom: 1 },
  dateTabMonth: { fontSize: 9, fontWeight: '600' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    width: (SCREEN_WIDTH - 60) / 2,
    alignItems: 'center'
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  advisorName: { fontSize: 16, fontWeight: '800' },
  advisorExp: { fontSize: 12, fontWeight: '600' },
  rateTag: { fontSize: 13, fontWeight: '800', marginTop: 8, alignSelf: 'flex-end' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: '600', flex: 1 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: { width: (SCREEN_WIDTH - 60) / 2, padding: 8, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', gap: 2 },
  slotDate: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  slotTime: { fontSize: 14, fontWeight: '800' },
  noteSection: { paddingTop: 12, marginTop: 8, borderTopWidth: 1 },
  noteLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  noteInput: { borderWidth: 1, borderRadius: 12, padding: 10, minHeight: 60, fontSize: 13, textAlignVertical: 'top' },
  confirmCard: { padding: 20, borderRadius: 28, gap: 16 },
  summaryItem: { flexDirection: 'row', gap: 16 },
  summaryLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  summaryVal: { fontSize: 16, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  priceRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  summaryMeta: { fontSize: 12, fontWeight: '600' },
  totalPrice: { fontSize: 18, fontWeight: '900' },
  summaryNoteArea: { marginTop: 20, paddingHorizontal: 10 },
  summaryNote: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  wizardFooter: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    gap: 10
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 44, borderRadius: 22, borderWidth: 1.5 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, height: 44, borderRadius: 22 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, height: 44, borderRadius: 22 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 14, fontWeight: '700' },
  spin: { opacity: 0.8 },
  emptyState: { paddingVertical: 60, alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  successContainer: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' },
  successIconOuter: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  successIconInner: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
  successDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  successDetailCard: { width: '100%', padding: 20, borderRadius: 24, gap: 12, marginBottom: 40 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  successActions: { width: '100%', flexDirection: 'row' },
  freeBookingToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10
  },
  freeBookingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  freeBookingLabel: { fontSize: 14, fontWeight: '800' },
  freeBookingQuota: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  customCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }
});
