/*
  # Sistema de Reserva de Salas

  1. Nuevas Tablas
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - 'user' o 'admin'
      - `created_at` (timestamp)
    
    - `rooms`
      - `id` (uuid, primary key)
      - `name` (text) - Nombre de la sala
      - `description` (text) - Descripción de la sala
      - `capacity` (integer) - Capacidad de personas
      - `created_at` (timestamp)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references profiles)
      - `start_time` (timestamptz) - Fecha y hora de inicio
      - `end_time` (timestamptz) - Fecha y hora de fin
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `notes` (text) - Notas del usuario
      - `admin_notes` (text) - Notas del administrador
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para usuarios: ver salas, crear reservas, ver sus propias reservas
    - Políticas para administradores: acceso completo a reservas y gestión
*/

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Crear tabla de salas
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  capacity integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text DEFAULT '',
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para rooms (todos pueden ver las salas)
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Políticas para bookings
CREATE POLICY "Users can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can update own pending bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any booking"
  ON bookings FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can delete own pending bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Insertar 3 salas por defecto
INSERT INTO rooms (name, description, capacity) VALUES
  ('Sala A', 'Sala de reuniones pequeña con proyector', 6),
  ('Sala B', 'Sala de conferencias mediana con pizarra digital', 12),
  ('Sala C', 'Auditorio grande para presentaciones', 30)
ON CONFLICT DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();