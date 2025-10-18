/*
  # Agregar trigger para notificaciones de reservas

  1. Nuevas Funciones
    - `notify_booking_status_change()` - Función que se ejecuta cuando cambia el estado de una reserva
      - Se activa cuando el estado cambia a 'approved' o 'rejected'
      - Registra el cambio en los logs para seguimiento
  
  2. Triggers
    - `on_booking_status_change` - Trigger que se ejecuta después de actualizar una reserva
      - Solo se activa cuando el estado cambia
      - Ejecuta la función de notificación

  Nota: La función Edge Function `send-booking-notification` debe ser llamada desde
  la aplicación móvil cuando el administrador aprueba/rechaza una reserva para
  enviar el correo al usuario.
*/

-- Función para registrar cambios de estado en las reservas
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si el estado cambió a approved o rejected
  IF NEW.status IN ('approved', 'rejected') AND OLD.status != NEW.status THEN
    -- Registrar en logs (en producción, aquí se llamaría a la Edge Function)
    RAISE NOTICE 'Booking % status changed to % for user %', NEW.id, NEW.status, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar cambios de estado
DROP TRIGGER IF EXISTS on_booking_status_change ON bookings;
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_booking_status_change();