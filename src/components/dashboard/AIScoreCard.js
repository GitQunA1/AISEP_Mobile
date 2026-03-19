import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import Button from '../Button';

export default function AIScoreCard({ score = 0, onRefresh, loading, style }) {
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  // Calculate descriptive text based on score
  let description = 'Startup của bạn thể hiện tiềm năng mạnh mẽ về đổi mới thị trường và sức mạnh đội ngũ.';
  let stateLabel = 'Tiềm năng Cao';
  
  if (!score || score === 0) {
    description = 'Chưa có phân tích AI. Nhấn nút bên dưới để Gemini đánh giá dự án của bạn.';
    stateLabel = 'Chưa đánh giá';
  } else if (score < 50) {
    description = 'Hồ sơ dự án cần được cải thiện nhiều hơn để tăng tính cạnh tranh trong mắt nhà đầu tư.';
    stateLabel = 'Cần cải thiện';
  } else if (score < 70) {
    description = 'Dự án có triển vọng tốt nhưng cần làm rõ thêm về lộ trình doanh thu và quy mô thị trường.';
    stateLabel = 'Tiềm năng';
  }
  
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <TrendingUp size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Đánh giá từ AI (Gemini)</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.scoreNumber, { color: colors.primary }]}>{score || '--'}</Text>
            <Text style={[styles.scoreDivider, { color: colors.secondaryText }]}>/ 100</Text>
          </View>
          <View style={[styles.stateBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.stateText, { color: colors.primary }]}>{stateLabel}</Text>
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            {description}
          </Text>
          {(!score || score === 0) && onRefresh && (
            <Button 
               title="Đánh giá ngay" 
               onPress={onRefresh} 
               loading={loading}
               style={styles.actionBtn}
               size="small"
            />
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  scoreSection: {
    alignItems: 'center',
    gap: 12,
  },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreDivider: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
    textTransform: 'uppercase',
  },
  stateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stateText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textContainer: {
    flex: 1,
    gap: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    opacity: 0.9,
  },
  actionBtn: {
    height: 38,
    borderRadius: 19,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
});
