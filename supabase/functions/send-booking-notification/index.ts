import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface BookingNotificationPayload {
  bookingId: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, status, adminNotes }: BookingNotificationPayload = await req.json();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms (name),
        profiles (email, full_name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      throw new Error('Error al obtener la reserva: ' + bookingError.message);
    }

    const userEmail = booking.profiles.email;
    const userName = booking.profiles.full_name;
    const roomName = booking.rooms.name;
    const startTime = new Date(booking.start_time).toLocaleString('es-ES');
    const endTime = new Date(booking.end_time).toLocaleString('es-ES');

    const statusText = status === 'approved' ? 'aprobada' : 'rechazada';
    const subject = `Reserva ${statusText}: ${roomName}`;

    let message = `Hola ${userName},\n\n`;
    message += `Tu solicitud de reserva para ${roomName} ha sido ${statusText}.\n\n`;
    message += `Detalles de la reserva:\n`;
    message += `- Sala: ${roomName}\n`;
    message += `- Fecha y hora de inicio: ${startTime}\n`;
    message += `- Fecha y hora de fin: ${endTime}\n\n`;

    if (adminNotes) {
      message += `Nota del administrador:\n${adminNotes}\n\n`;
    }

    message += `Saludos,\nEquipo de Reservas`;

    console.log('\n=== NOTIFICACIÓN POR CORREO ===');
    console.log('Para:', userEmail);
    console.log('Asunto:', subject);
    console.log('Mensaje:', message);
    console.log('================================\n');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notificación procesada correctamente',
        emailDetails: {
          to: userEmail,
          subject: subject,
          preview: message.substring(0, 100) + '...',
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});