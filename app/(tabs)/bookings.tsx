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
import { CheckCircle, XCircle, AlertCircle, Calendar, Clock, Trash2 } from 'lucide-react-native';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  rooms: { name: string; description: string };
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)');
      return;
    }
    loadBookings();

    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms (name, description)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (bookingId: string, status: string) => {
    if (status !== 'pending') {
      Alert.alert('Error', 'Solo puedes cancelar reservas pendientes');
      return;
    }

    Alert.alert(
      'Cancelar reserva',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('bookings').delete().eq('id', bookingId);

              if (error) throw error;
              loadBookings();
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo cancelar la reserva');
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} color="#34C759" />;
      case 'rejected':
        return <XCircle size={20} color="#FF3B30" />;
      default:
        return <AlertCircle size={20} color="#FF9500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#FF9500';
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const startDate = new Date(item.start_time);
    const endDate = new Date(item.end_time);
    const isPast = endDate < new Date();

    return (
      <View style={[styles.bookingCard, isPast && styles.pastBooking]}>
        <View style={styles.bookingHeader}>
          <Text style={styles.roomName}>{item.rooms.name}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}
          >
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#666" />
            <Text style={styles.detailText}>
              {startDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Clock size={16} color="#666" />
            <Text style={styles.detailText}>
              {startDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              -{' '}
              {endDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notas:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {item.admin_notes && (
          <View style={styles.adminNotesContainer}>
            <Text style={styles.adminNotesLabel}>Respuesta del administrador:</Text>
            <Text style={styles.adminNotesText}>{item.admin_notes}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteBooking(item.id, item.status)}
          >
            <Trash2 size={16} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Cancelar reserva</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
        <Text style={styles.title}>Mis Reservas</Text>
        <Text style={styles.subtitle}>Gestiona tus solicitudes de reserva</Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertCircle size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No tienes reservas</Text>
          <Text style={styles.emptySubtitle}>
            Ve a la pestaña de Salas para hacer tu primera reserva
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {isAdmin && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push('/admin/bookings')}
        >
          <Text style={styles.adminButtonText}>Ver panel de administrador</Text>
        </TouchableOpacity>
      )}
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
  bookingCard: {
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
  pastBooking: {
    opacity: 0.6,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  notesContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
  },
  adminNotesContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  adminNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  adminNotesText: {
    fontSize: 14,
    color: '#333',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  adminButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
