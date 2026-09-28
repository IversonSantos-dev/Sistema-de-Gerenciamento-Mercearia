-- Permissões granulares por módulo para usuários locais.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions jsonb;

-- Administradores existentes sem matriz explícita continuam com acesso total
-- pela regra do servidor. Novos operadores recebem uma matriz padrão no cadastro.
UPDATE public.users
SET permissions = NULL
WHERE role = 'admin' AND username IS NOT NULL AND permissions IS NULL;

COMMENT ON COLUMN public.users.permissions IS 'Mapa JSON de módulos com ações read/edit; NULL para administrador legado significa acesso total.';
