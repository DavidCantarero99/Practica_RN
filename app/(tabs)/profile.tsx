import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (error: any) {
            Alert.alert('Error', 'No se pudo cerrar sesión');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={48} color="#007AFF" />
          </View>
          <Text style={styles.userName}>{profile?.full_name || 'Usuario'}</Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Shield size={16} color="#FFF" />
              <Text style={styles.adminBadgeText}>Administrador</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Mail size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Correo electrónico</Text>
              <Text style={styles.infoValue}>{profile?.email || user?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Shield size={20} color="#666" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Rol</Text>
              <Text style={styles.infoValue}>
                {isAdmin ? 'Administrador' : 'Usuario'}
              </Text>
            </View>
          </View>
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/admin/bookings')}
          >
            <Shield size={20} color="#FFF" />
            <Text style={styles.adminButtonText}>Panel de Administrador</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.signOutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  },
  content: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adminBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  adminButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
  },
  signOutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
