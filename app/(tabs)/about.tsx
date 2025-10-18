// Pantalla "Acerca" — mantiene la misma estructura y estilo que las demás pantallas
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Info, User } from 'lucide-react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Acerca</Text>
        <Text style={styles.subtitle}>Información sobre la aplicación</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <Info size={28} color="#007AFF" />
            </View>
            <Text style={styles.appName}>BookingBolt</Text>
          </View>

          <Text style={styles.infoText}>
            BookingBolt facilita la reserva de salas y la gestión de tus reservas desde una
            interfaz rápida y sencilla.
          </Text>

          <Text style={styles.infoText}>
            Características principales: búsqueda de salas, solicitud de reservas, notificaciones y
            panel de administrador para gestionar solicitudes.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Autor principal:</Text>
          <Text style={styles.value}>Boris Calzadia</Text>
          
          <View style={styles.studentInfo}>
            <View style={styles.studentImageContainer}>
              <View style={styles.studentImage}>
                {/* Aquí puedes sustituir el icono por una imagen real */}
                <User size={28} color="#007AFF" />
              </View>
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.label}>Estudiante</Text>
              <Text style={styles.value}>David Alexander Cantarero Perez</Text>
              <Text style={styles.career}>Técnico en sistemas de computación</Text>
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Versión</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>

        <Text style={styles.thanks}>Gracias por usar BookingBolt.</Text>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    padding: 16,
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
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  thanks: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  studentImageContainer: {
    marginRight: 16,
  },
  studentImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF20',
  },
  studentDetails: {
    flex: 1,
  },
  career: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

