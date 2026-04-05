import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import TabScreenWrapper from '../../src/components/navigation/TabScreenWrapper';
import StartupDashboard from '../../src/components/dashboard/StartupDashboard';
import InvestorDashboard from '../../src/components/dashboard/InvestorDashboard';
import AdvisorDashboard from '../../src/components/dashboard/AdvisorDashboard';

export default function DashboardRouter() {
  const { user, loading: authLoading } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  if (authLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderDashboard = () => {
    // Role strings might be lowercase or capitalized depending on API
    const role = user?.role?.toLowerCase();

    switch (role) {
      case 'startup':
        return <StartupDashboard />;
      case 'investor':
        return <InvestorDashboard />;
      case 'advisor':
        return <AdvisorDashboard />;
      default:
        // Default to StartupDashboard or an error state if role is unknown
        return <StartupDashboard />;
    }
  };

  return (
    <TabScreenWrapper>
      {renderDashboard()}
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
