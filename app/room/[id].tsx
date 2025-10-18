import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  profiles: { full_name: string };
  rooms: { name: string };
};

export default function RoomDetailsScreen() {
  const { id, name } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles (full_name),
          rooms (name)
        `)
        .eq('room_id', id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time');

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const isTimeSlotAvailable = (time: string, durationHours: number): boolean => {
    const requestedStart = new Date(`${selectedDate}T${time}`);
    const requestedEnd = new Date(requestedStart.getTime() + durationHours * 60 * 60 * 1000);

    return !bookings.some((booking) => {
      if (booking.status === 'rejected') return false;

      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      return (
        (requestedStart >= bookingStart && requestedStart < bookingEnd) ||
        (requestedEnd > bookingStart && requestedEnd <= bookingEnd) ||
        (requestedStart <= bookingStart && requestedEnd >= bookingEnd)
      );
    });
  };

  const handleBooking = async () => {
    if (!user) return;

    const durationHours = parseFloat(duration);
    if (isNaN(durationHours) || durationHours <= 0) {
      Alert.alert('Error', 'Por favor ingresa una duración válida');
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

    if (startDateTime < new Date()) {
      Alert.alert('Error', 'No puedes reservar en el pasado');
      return;
    }

    if (!isTimeSlotAvailable(selectedTime, durationHours)) {
      Alert.alert('Error', 'Este horario no está disponible');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        room_id: id as string,
        user_id: user.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: notes.trim(),
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert(
        'Solicitud enviada',
        'Tu solicitud de reserva ha sido enviada. Espera la aprobación del administrador.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#34C759" />;
      case 'rejected':
        return <XCircle size={16} color="#FF3B30" />;
      default:
        return <AlertCircle size={16} color="#FF9500" />;
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>Reservar sala</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seleccionar fecha y hora</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput
              style={styles.input}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Hora de inicio</Text>
              <TextInput
                style={styles.input}
                value={selectedTime}
                onChangeText={setSelectedTime}
                placeholder="HH:MM"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1, styles.ml8]}>
              <Text style={styles.label}>Duración (horas)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="1"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Propósito de la reunión..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.availabilityCheck}>
            {isTimeSlotAvailable(selectedTime, parseFloat(duration) || 0) ? (
              <View style={styles.availableTag}>
                <CheckCircle size={20} color="#34C759" />
                <Text style={styles.availableText}>Disponible</Text>
              </View>
            ) : (
              <View style={styles.unavailableTag}>
                <XCircle size={20} color="#FF3B30" />
                <Text style={styles.unavailableText}>No disponible</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.bookButton,
              (submitting || !isTimeSlotAvailable(selectedTime, parseFloat(duration) || 0)) &&
                styles.bookButtonDisabled,
            ]}
            onPress={handleBooking}
            disabled={submitting || !isTimeSlotAvailable(selectedTime, parseFloat(duration) || 0)}
          >
            <Text style={styles.bookButtonText}>
              {submitting ? 'Enviando solicitud...' : 'Solicitar reserva'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reservas del día</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : bookings.length === 0 ? (
            <Text style={styles.emptyText}>No hay reservas para este día</Text>
          ) : (
            bookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTime}>
                    {new Date(booking.start_time).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(booking.end_time).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(booking.status) + '20' },
                    ]}
                  >
                    {getStatusIcon(booking.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {getStatusText(booking.status)}
                    </Text>
                  </View>
                </View>
                {booking.notes && <Text style={styles.bookingNotes}>{booking.notes}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  ml8: {
    marginLeft: 8,
  },
  availabilityCheck: {
    marginBottom: 16,
  },
  availableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C75920',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  availableText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  unavailableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B3020',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  unavailableText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  bookingCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingNotes: {
    fontSize: 14,
    color: '#666',
  },
});
