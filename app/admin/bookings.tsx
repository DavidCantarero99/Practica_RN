import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  User,
} from 'lucide-react-native';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  rooms: { name: string; description: string };
  profiles: { full_name: string; email: string };
};

export default function AdminBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Acceso denegado', 'No tienes permisos para acceder a esta página');
      router.back();
      return;
    }
    loadBookings();

    const channel = supabase
      .channel('admin-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, filter]);

  const loadBookings = async () => {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          rooms (name, description),
          profiles (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (booking: Booking, action: 'approve' | 'reject') => {
    setSelectedBooking(booking);
    setActionType(action);
    setAdminNotes('');
    setModalVisible(true);
  };

  const handleBookingAction = async () => {
    if (!selectedBooking) return;

    const newStatus = actionType === 'approve' ? 'approved' : 'rejected';

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          admin_notes: adminNotes.trim(),
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-booking-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              bookingId: selectedBooking.id,
              status: newStatus,
              adminNotes: adminNotes.trim(),
            }),
          }
        );

        const notificationResult = await response.json();
        console.log('Notification sent:', notificationResult);
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      Alert.alert(
        'Éxito',
        `Reserva ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} correctamente. Se ha enviado una notificación al usuario.`
      );
      setModalVisible(false);
      loadBookings();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo actualizar la reserva');
    }
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

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingHeaderLeft}>
            <Text style={styles.roomName}>{item.rooms.name}</Text>
            <View style={styles.userInfo}>
              <User size={14} color="#666" />
              <Text style={styles.userName}>{item.profiles.full_name}</Text>
            </View>
          </View>
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
            <Text style={styles.notesLabel}>Notas del usuario:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {item.admin_notes && (
          <View style={styles.adminNotesContainer}>
            <Text style={styles.adminNotesLabel}>Tus notas:</Text>
            <Text style={styles.adminNotesText}>{item.admin_notes}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => openActionModal(item, 'approve')}
            >
              <CheckCircle size={18} color="#FFF" />
              <Text style={styles.approveButtonText}>Aprobar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => openActionModal(item, 'reject')}
            >
              <XCircle size={18} color="#FFF" />
              <Text style={styles.rejectButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Administrar Reservas</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}
          >
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'approved' && styles.filterButtonActive]}
          onPress={() => setFilter('approved')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'approved' && styles.filterButtonTextActive,
            ]}
          >
            Aprobadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'rejected' && styles.filterButtonTextActive,
            ]}
          >
            Rechazadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertCircle size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No hay reservas</Text>
          <Text style={styles.emptySubtitle}>
            No se encontraron reservas con el filtro seleccionado
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? 'Aprobar reserva' : 'Rechazar reserva'}
            </Text>

            {selectedBooking && (
              <View style={styles.modalBookingInfo}>
                <Text style={styles.modalBookingText}>
                  {selectedBooking.rooms.name} - {selectedBooking.profiles.full_name}
                </Text>
                <Text style={styles.modalBookingDate}>
                  {new Date(selectedBooking.start_time).toLocaleDateString('es-ES')} -{' '}
                  {new Date(selectedBooking.start_time).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            <Text style={styles.modalLabel}>Notas (opcional)</Text>
            <TextInput
              style={styles.modalInput}
              value={adminNotes}
              onChangeText={setAdminNotes}
              placeholder="Agrega una nota para el usuario..."
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  actionType === 'reject' && styles.modalRejectButton,
                ]}
                onPress={handleBookingAction}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {actionType === 'approve' ? 'Aprobar' : 'Rechazar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFF',
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingHeaderLeft: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
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
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  rejectButtonText: {
    color: '#FFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  modalBookingInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalBookingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalBookingDate: {
    fontSize: 14,
    color: '#666',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalRejectButton: {
    backgroundColor: '#FF3B30',
  },
  modalConfirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
