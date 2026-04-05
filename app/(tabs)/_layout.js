import { Tabs } from "expo-router";
import { Home, MessageSquare, Users, User, LayoutDashboard, Target } from "lucide-react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import CustomTabBar from "../../src/components/navigation/CustomTabBar";

export default function TabsLayout() {
  const { user } = useAuth();
  const { activeTheme } = useTheme();
  const colors = activeTheme.colors;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: colors.background }} // Fix white flash
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: colors.text,
        },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Khám phá",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerTitle: "Khám phá dự án",
        }}
      />
      <Tabs.Screen
        name="advisors"
        options={{
          title: "Cố vấn",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          headerTitle: "Tìm cố vấn",
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
        name="dashboard"
        options={{
          title: "Quản lý",
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
          headerTitle: "Hồ sơ cá nhân",
        }}
      />
    </Tabs>
  );
}
