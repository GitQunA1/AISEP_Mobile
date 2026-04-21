import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { FileText, Upload, Shield, Trash2, ExternalLink } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import projectSubmissionService from '../../services/projectSubmissionService';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import Button from '../Button';

export default function DocumentManager({ project, initialDocuments = [], onRefresh }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState(null);

  useEffect(() => {
    // Determine the actual array of documents
    const docSource = Array.isArray(initialDocuments) 
      ? initialDocuments 
      : (initialDocuments?.items || (initialDocuments?.data?.items) || (initialDocuments ? [initialDocuments] : []));
    
    // Check if it's really an array and not just a single object from a previous extraction mistake
    const docArray = Array.isArray(docSource) ? docSource : [];
    
    if (docArray.length > 0) {
      const mappedDocs = docArray.map((doc, index) => ({
        id: doc.id || doc.documentId || `doc-${index}`,
        name: doc.fileName || doc.documentType || 'Tài liệu',
// ...
        type: doc.documentType,
        uploadDate: new Date(doc.uploadedAt || doc.verifiedAt || new Date()).toLocaleDateString('vi-VN'),
        status: doc.blockchainTxHash ? 'verified' : 'pending',
        txHash: doc.blockchainTxHash,
        url: doc.fileUrl
      }));
      setDocuments(mappedDocs);
    } else {
      setDocuments([]);
    }
  }, [initialDocuments]);

  const loadDocuments = async () => {
    if (onRefresh) {
      onRefresh();
      return;
    }
    // Fallback if onRefresh not provided
    if (!project) return;
    setIsLoading(true);
    try {
      const response = await projectSubmissionService.getDocuments(project.id || project.projectId);
      if (response && response.data) {
        const docItems = Array.isArray(response.data) ? response.data : (response.data.items || []);
        
        const mappedDocs = docItems.map((doc, index) => ({
          id: doc.id || doc.documentId || `doc-${index}`,
          name: doc.fileName || doc.documentType || 'Tài liệu',
          type: doc.documentType,
          uploadDate: new Date(doc.uploadedAt || doc.verifiedAt || new Date()).toLocaleDateString('vi-VN'),
          status: 'verified',
          txHash: doc.blockchainTxHash,
          url: doc.fileUrl
        }));
        
        setDocuments(mappedDocs);
        if (onDocumentsUpdate) onDocumentsUpdate(mappedDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async () => {
    if (project?.status !== 'Draft') {
      Alert.alert('Chỉ có thể tải tài liệu lên khi dự án ở trạng thái Bản nháp.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Ensure file size is acceptable (<10MB usually)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('Lỗi', 'Kích thước tệp không được vượt quá 10MB.');
          return;
        }

        uploadDocument(file);
      }
    } catch (err) {
      console.error("Error picking document", err);
    }
  };

  const uploadDocument = async (file) => {
    if (!project) return;
    
    setIsUploading(true);
    try {
      // Create a native file object representation for FormData if needed
      const fileToUpload = {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream'
      };

      // Default type for now, you could add a picker before upload
      const docType = 'PitchDeck'; 
      
      const res = await projectSubmissionService.uploadDocument(project.id || project.projectId, fileToUpload, docType);
      
      if (res && (res.success || res.isSuccess)) {
        Alert.alert('Thành công', 'Tài liệu của bạn đã được tải lên thành công. Hệ thống AISEP sẽ thực hiện xác minh Blockchain tài liệu của bạn khi dự án được duyệt bởi Nhân viên vận hành.');
        loadDocuments();
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể tải tài liệu lên.');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ.');
    } finally {
      setIsUploading(false);
    }
  };

  const verifyDocument = async (docId) => {
    setVerifyingDocId(docId);
    try {
      const res = await projectSubmissionService.verifyDocument(docId);
        if (res && (res.success || res.isSuccess)) {
          Alert.alert('Xác thực thành công', `Tài liệu đã được xác nhận trên blockchain.\nMã Tx: ${res.data.blockchainTxHash || res.data.txHash || 'N/A'}`);
          loadDocuments();
        } else {
          Alert.alert('Chưa có thông tin', 'Tài liệu đã được tải lên nhưng chúng tôi sẽ sử dụng Blockchain để xác nhận sau khi dự án này được chấp thuận.');
        }
    } catch (error) {
      console.error('Verify error:', error);
      Alert.alert('Lỗi', 'Chưa có thông tin xác thực trên blockchain cho tài liệu này. Token sẽ được cấp khi dự án được duyệt.');
    } finally {
      setVerifyingDocId(null);
    }
  };

  const openDocument = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy liên kết tài liệu.');
    }
  };

  const deleteDocument = (id) => {
    if (project?.status !== 'Draft') return;
    // UI placeholder for delete - usually requires backend endpoint which might be missing in mockup
    Alert.alert('Thông báo', 'Tính năng xóa tài liệu đang được phát triển.');
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity 
        style={[
          styles.uploadDropzone, 
          { 
            borderColor: colors.border, 
            backgroundColor: colors.card,
            opacity: project?.status !== 'Draft' ? 0.6 : 1 
          }
        ]}
        onPress={pickDocument}
        disabled={project?.status !== 'Draft' || isUploading}
        activeOpacity={0.7}
      >
        {isUploading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <>
            <View style={[styles.uploadIconContainer, { backgroundColor: colors.mutedBackground }]}>
              <Upload size={24} color={colors.secondaryText} />
            </View>
            <Text style={[styles.uploadTitle, { color: colors.text }]}>Tải lên tài liệu mới</Text>
            <Text style={[styles.uploadSubtitle, { color: colors.secondaryText }]}>
              Nhấn để chọn file (PDF, DOCX, XLSX, Ảnh)
            </Text>
            {project?.status !== 'Draft' && (
              <Text style={[styles.disabledNotice, { color: colors.warning }]}>
                Chỉ có thể tải lên khi dự án ở dạng Nháp
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ margin: 20 }} />
        ) : documents.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Chưa có tài liệu nào được tải lên cho dự án này.
          </Text>
        ) : (
          documents.map((doc) => (
            <View key={doc.id} style={[styles.docItem, { borderBottomColor: colors.border }]}>
              <View style={styles.docIcon}>
                <FileText size={20} color={colors.secondaryText} />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                  {doc.name}
                </Text>
                <View style={styles.docMeta}>
                  <Text style={[styles.docType, { color: colors.secondaryText }]}>{doc.type}</Text>
                  <Text style={[styles.docDate, { color: colors.secondaryText }]}> • {doc.uploadDate}</Text>
                </View>
              </View>
              <View style={styles.docActions}>
                <TouchableOpacity onPress={() => openDocument(doc.url)} style={styles.actionBtn}>
                  <ExternalLink size={18} color={colors.secondaryText} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => verifyDocument(doc.id)} 
                  style={styles.actionBtn}
                  disabled={verifyingDocId === doc.id}
                >
                  {verifyingDocId === doc.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Shield size={18} color={colors.success} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => deleteDocument(doc.id)} 
                  disabled={project?.status !== 'Draft'}
                  style={styles.actionBtn}
                >
                  <Trash2 size={18} color={project?.status !== 'Draft' ? colors.border : colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  uploadDropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  disabledNotice: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  docIcon: {
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
    marginRight: 8,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docType: {
    fontSize: 12,
  },
  docDate: {
    fontSize: 12,
  },
  docActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
});
