import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { X, Send, MapPin, User, Mail, Phone, Globe } from 'lucide-react-native';
import connectionService from '../../services/connectionService';
import { useTheme } from '../../context/ThemeContext';
import Button from '../Button';

export default function RequestInfoModal({ isOpen, onClose, projectId, projectName, onSuccess }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [founderInfo, setFounderInfo] = useState(null);
  const [isLoadingFounder, setIsLoadingFounder] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchFounderInfo();
    }
  }, [isOpen, projectId]);

  const fetchFounderInfo = async () => {
    setIsLoadingFounder(true);
    try {
      const response = await connectionService.getFounderContact(projectId);
      if (response && response.data) {
        setFounderInfo(response.data);
      }
    } catch (err) {
      console.error('[RequestInfoModal] Failed to fetch founder info:', err);
    } finally {
      setIsLoadingFounder(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() || message.length < 10) {
      setError('Vui lòng nhập tin nhắn (từ 10 đến 500 ký tự)');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await connectionService.createConnectionRequest(projectId, message);
      
      if (response && (response.success || response.data)) {
        setSuccess('✓ Yêu cầu đã được gửi! Startup sẽ xem xét và liên hệ với bạn.');
        setMessage('');
        
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setError(response?.message || 'Không thể gửi yêu cầu');
      }
    } catch (err) {
      setError(err?.message || 'Lỗi: Không thể gửi yêu cầu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setMessage('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Yêu cầu thông tin dự án</Text>
            <TouchableOpacity onPress={handleClose} disabled={isLoading} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.projectName, { color: colors.text }]}>
              Dự án: <Text style={{ fontWeight: '700' }}>{projectName}</Text>
            </Text>
            
            {/* Founder Info */}
            {isLoadingFounder ? (
              <View style={[styles.loadingSection, { backgroundColor: colors.mutedBackground }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ marginLeft: 8, color: colors.secondaryText }}>Đang tải thông tin...</Text>
              </View>
            ) : founderInfo ? (
              <View style={[styles.founderInfo, { backgroundColor: colors.mutedBackground }]}>
                <Text style={[styles.founderTitle, { color: colors.text }]}>Thông tin liên lạc</Text>
                
                {founderInfo.companyName && (
                  <View style={styles.infoRow}>
                    <Globe size={14} color={colors.secondaryText} />
                    <Text style={[styles.infoText, { color: colors.text }]}>{founderInfo.companyName}</Text>
                  </View>
                )}
                
                {founderInfo.founder && (
                  <View style={styles.infoRow}>
                    <User size={14} color={colors.secondaryText} />
                    <Text style={[styles.infoText, { color: colors.text }]}>{founderInfo.founder}</Text>
                  </View>
                )}
                
                {founderInfo.email && (
                  <View style={styles.infoRow}>
                    <Mail size={14} color={colors.secondaryText} />
                    <Text style={[styles.infoText, { color: colors.text }]}>{founderInfo.email}</Text>
                  </View>
                )}
                
                {founderInfo.phoneNumber && (
                  <View style={styles.infoRow}>
                    <Phone size={14} color={colors.secondaryText} />
                    <Text style={[styles.infoText, { color: colors.text }]}>{founderInfo.phoneNumber}</Text>
                  </View>
                )}
                
                {founderInfo.country_city && (
                  <View style={styles.infoRow}>
                    <MapPin size={14} color={colors.secondaryText} />
                    <Text style={[styles.infoText, { color: colors.text }]}>{founderInfo.country_city}</Text>
                  </View>
                )}
              </View>
            ) : null}
            
            {/* Form */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Tin nhắn (Bắt buộc)</Text>
              <TextInput
                style={[
                  styles.textarea, 
                  { 
                    backgroundColor: colors.inputBackground, 
                    color: colors.text,
                    borderColor: colors.inputBorder
                  }
                ]}
                placeholder="Hãy giới thiệu bản thân và lý do bạn quan tâm đến dự án này..."
                placeholderTextColor={colors.secondaryText}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!isLoading && !success}
              />
              <Text style={[styles.hint, { color: colors.secondaryText }]}>Tối thiểu 10 ký tự, tối đa 500 ký tự</Text>
            </View>

            {error ? <Text style={[styles.errorMessage, { color: colors.error }]}>{error}</Text> : null}
            {success ? <Text style={[styles.successMessage, { color: colors.success }]}>{success}</Text> : null}
          </ScrollView>
          
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button 
              title="Hủy" 
              variant="outline" 
              onPress={handleClose} 
              disabled={isLoading}
              style={{ flex: 1, marginRight: 12 }} 
            />
            <Button 
              title={isLoading ? "Đang gửi..." : "Gửi yêu cầu"} 
              onPress={handleSubmit} 
              disabled={isLoading || message.length < 10 || !!success}
              loading={isLoading}
              style={{ flex: 1 }} 
              icon={<Send size={16} color="#fff" />}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  projectName: {
    fontSize: 16,
    marginBottom: 20,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  founderInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  founderTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    height: 120,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  errorMessage: {
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  successMessage: {
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
  }
});
