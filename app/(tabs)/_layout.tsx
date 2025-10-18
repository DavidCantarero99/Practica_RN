import { Tabs } from 'expo-router';
import { Calendar, ListChecks, User, Info } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Salas',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'Acerca',
          tabBarIcon: ({ size, color }) => <Info size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Mis Reservas',
          tabBarIcon: ({ size, color }) => <ListChecks size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
