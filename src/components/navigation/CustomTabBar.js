import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import TabIcon from './TabIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;
  const { unreadCount } = useNotifications();
  
  const numTabs = state.routes.length;
  const tabWidth = SCREEN_WIDTH / numTabs;
  
  // Sliding pill animation
  const translateX = useRef(new Animated.Value(0)).current;

  const triggerHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Fail silently
    }
  };

  useEffect(() => {
    // Animate pill to center of active tab
    Animated.spring(translateX, {
      toValue: state.index * tabWidth + (tabWidth / 2) - 16,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background, 
        paddingBottom: insets.bottom + 4,
        borderTopColor: colors.border,
        borderTopWidth: 0.5,
      }
    ]}>
      {/* Active Indicator Pill */}
      <Animated.View 
        style={[
          styles.pill, 
          { 
            backgroundColor: colors.primary,
            transform: [{ translateX }] 
          }
        ]} 
      />

      <View style={styles.tabItemsRaw}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          
          // Skip rendering if href is null (used for auth guards in _layout.js)
          if (options.href === null) return null;

          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              triggerHaptic();
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <TabIcon 
                Icon={options.tabBarIcon ? ({ color, size }) => options.tabBarIcon({ color, size, focused: isFocused }) : () => null}
                color={isFocused ? colors.primary : colors.secondaryText}
                size={22}
                label={label}
                focused={isFocused}
                badgeCount={route.name === 'notifications' ? unreadCount : 0}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  pill: {
    position: 'absolute',
    top: 4, // Just below the top border area
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  tabItemsRaw: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
