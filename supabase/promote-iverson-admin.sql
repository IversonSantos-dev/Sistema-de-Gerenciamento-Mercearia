-- Promoção idempotente do acesso operacional principal.
-- Execute no SQL Editor do Supabase se o ambiente estiver sem conexão.
UPDATE public.users
SET role = 'admin',
    active = true,
    updated_at = now()
WHERE lower(username) = 'iverson';

-- Conferência: deve retornar username=iverson, role=admin e active=true.
SELECT id, username, name, role, active
FROM public.users
WHERE lower(username) = 'iverson';
