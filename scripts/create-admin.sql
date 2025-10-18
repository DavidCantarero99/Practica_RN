-- Script para crear un usuario administrador
-- Este script debe ejecutarse desde el dashboard de Supabase en SQL Editor

-- Paso 1: Crear el usuario en auth.users
-- IMPORTANTE: Reemplaza 'admin@ejemplo.com' y 'tu-contraseña-segura' con tus credenciales

-- Primero, registra el usuario normalmente desde la app
-- Luego, ejecuta este query para hacerlo administrador:

UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@ejemplo.com';

-- Verificar que el usuario ahora es admin
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE email = 'admin@ejemplo.com';
