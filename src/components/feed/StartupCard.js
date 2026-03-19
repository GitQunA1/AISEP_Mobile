import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import { Target, Heart, MessageCircle, Share2, Bookmark, Lock, ChevronRight, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import Card from '../Card';
import { useRouter } from 'expo-router';

export default function StartupCard({ startup, isPremium = false, user, onViewProfile }) {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <View style={[
      styles.projectCard, 
      { 
        backgroundColor: colors.card,
        shadowColor: colors.shadow,
        borderColor: colors.border,
        borderWidth: 1
      }
    ]}>
      <TouchableOpacity 
        style={styles.cardContentWrapper}
        onPress={() => onViewProfile ? onViewProfile(startup.id) : router.push(`/startup/${startup.id}`)}
        activeOpacity={0.7}
      >
        {/* HEADER ROW */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
             style={[styles.avatarContainer, { backgroundColor: colors.primary }]}
             onPress={() => onViewProfile ? onViewProfile(startup.id) : router.push(`/startup/${startup.id}`)}
          >
            {startup.logo ? (
              <Image source={{ uri: startup.logo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{(startup.name || 'S').charAt(0).toUpperCase()}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.nameSection}>
            <View style={styles.nameTopRow}>
                <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>{startup.name}</Text>
                <View style={[styles.pillBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]}>AI: {startup.aiScore || '...'}</Text>
                </View>
            </View>
            <View style={styles.tagRow}>
              {(startup.tags && startup.tags.length > 0
                ? startup.tags.slice(0, 1) // Showing industry tag
                : startup.industry
                  ? [startup.industry]
                  : []
              ).map(tag => (
                <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.mutedBackground }]}>
                  <Text style={[styles.tagText, { color: colors.secondaryText }]}>{tag}</Text>
                </View>
              ))}
              {startup.stage && (
                <View style={[styles.pillBadge, { backgroundColor: colors.successLight }]}>
                  <Text style={[styles.pillText, { color: colors.success }]}>{startup.stage}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={[styles.timeText, { color: colors.secondaryText }]}>{startup.timestamp}</Text>
            <Pressable style={styles.menuBtn} hitSlop={8}>
                <MoreHorizontal size={18} color={colors.secondaryText} />
            </Pressable>
          </View>
        </View>

        {/* DESCRIPTION */}
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
          {startup.description}
        </Text>

        {/* PREMIUM DATA ROW */}
        <Pressable style={({pressed}) => [
            styles.premiumTease, 
            { backgroundColor: colors.mutedBackground, opacity: pressed ? 0.8 : 1 }
        ]}>
          <Lock size={14} color={colors.secondaryText} />
          <Text style={[styles.premiumText, { color: colors.secondaryText }]}>Dữ liệu tài chính & Nhu cầu gọi vốn</Text>
          <ChevronRight size={16} color={colors.secondaryText} />
        </Pressable>

        {/* ENGAGEMENT ROW */}
        <View style={[styles.actionRow]}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.6}>
              {isLiked ? <Heart size={20} color={colors.error} fill={colors.error} /> : <Heart size={20} color={colors.secondaryText} />}
              <Text style={[styles.actionCount, { color: colors.secondaryText }]}>24</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
              <MessageCircle size={20} color={colors.secondaryText} />
              <Text style={[styles.actionCount, { color: colors.secondaryText }]}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
              <Share2 size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.bookmarkBtn} onPress={handleBookmark} activeOpacity={0.6}>
            {isBookmarked ? <Bookmark size={20} color={colors.primary} fill={colors.primary} /> : <Bookmark size={20} color={colors.secondaryText} />}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  projectCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardContentWrapper: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  nameSection: {
    flex: 1,
  },
  nameTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
    maxWidth: '65%',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginRight: 4,
  },
  menuBtn: {
    padding: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: 16,
  },
  premiumTease: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  premiumText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '500',
  },
  bookmarkBtn: {
    padding: 4,
  },
});
