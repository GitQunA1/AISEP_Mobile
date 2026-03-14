import { Tabs } from "expo-router";
import { Home, MessageSquare, Users, User, LayoutDashboard, Target } from "lucide-react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

export default function TabsLayout() {
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.secondaryText,
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
      },
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        fontWeight: '700',
        color: colors.text,
      },
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: "Khám phá",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerTitle: "AISEP Discovery",
        }} 
      />
      <Tabs.Screen 
        name="advisors" 
        options={{
          title: "Cố vấn",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          headerTitle: "Đội ngũ cố vấn",
        }} 
      />
      <Tabs.Screen 
        name="investors" 
        options={{
          title: "Nhà đầu tư",
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
          headerTitle: "Tìm nhà đầu tư",
        }} 
      />
      <Tabs.Screen 
        name="chat" 
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
          headerTitle: "AI Trợ lý ảo",
        }} 
      />
      <Tabs.Screen 
        name="dashboard" 
        options={{
          title: "Trình quản lý",
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          headerTitle: "Bảng điều khiển",
          href: user ? "/dashboard" : null,
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerTitle: "Hồ sơ của bạn",
        }} 
      />
    </Tabs>
  );
}
