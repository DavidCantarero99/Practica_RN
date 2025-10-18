import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DoorOpen, Users, Calendar as CalendarIcon, Shield } from 'lucide-react-native';

type Room = Database['public']['Tables']['rooms']['Row'];

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)');
      return;
    }
    loadRooms();
  }, [user]);

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las salas');
    } finally {
      setLoading(false);
    }
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push({
        pathname: '/room/[id]',
        params: { id: item.id, name: item.name }
      })}
    >
      <View style={styles.roomHeader}>
        <View style={styles.iconContainer}>
          <DoorOpen size={32} color="#007AFF" />
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomDescription}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.roomFooter}>
        <View style={styles.capacityBadge}>
          <Users size={16} color="#666" />
          <Text style={styles.capacityText}>{item.capacity} personas</Text>
        </View>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push({
            pathname: '/room/[id]',
            params: { id: item.id, name: item.name }
          })}
        >
          <Text style={styles.viewButtonText}>Ver disponibilidad</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Salas Disponibles</Text>
        <Text style={styles.subtitle}>Selecciona una sala para reservar</Text>
      </View>

      {isAdmin && (
        <TouchableOpacity
          style={styles.adminBanner}
          onPress={() => router.push('/admin/bookings')}
        >
          <Shield size={24} color="#FFF" />
          <View style={styles.adminBannerContent}>
            <Text style={styles.adminBannerTitle}>Panel de Administrador</Text>
            <Text style={styles.adminBannerSubtitle}>Toca aquí para gestionar reservas</Text>
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  adminBannerContent: {
    flex: 1,
    marginLeft: 16,
  },
  adminBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  adminBannerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  roomCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  capacityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  viewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
