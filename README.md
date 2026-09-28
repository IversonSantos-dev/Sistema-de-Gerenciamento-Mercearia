# Mercearia PDV

Sistema de gestão de produtos, estoque, frente de caixa e fechamento diário para uma mercearia.

## Autenticação

A aplicação usa **somente login local por usuário e senha**. Não há dependência de OAuth, portal externo ou redirecionamento de autenticação.

- Senhas são armazenadas com hash `scrypt`; nenhuma senha é persistida em texto puro.
- Após cinco tentativas inválidas, o usuário fica bloqueado temporariamente.
- O primeiro administrador é criado com a chave de ativação configurada no ambiente.
- Administradores acessam **Usuários** para criar operadores, alterar perfil, bloquear/desbloquear acessos e redefinir senhas.
- Cada usuário também pode alterar a própria senha informando a senha atual.
- O sistema impede bloquear ou remover o último administrador ativo.

## Configuração local

Crie um `.env` apenas no ambiente local, sem versioná-lo:

```env
JWT_SECRET=uma-chave-longa-e-aleatoria
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servidor
LOCAL_SETUP_KEY=uma-chave-para-o-primeiro-acesso
```

O arquivo `pdv-local.json` continua sendo usado para a contingência local do caixa conforme a pasta autorizada pelo operador.

## Desenvolvimento

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

O teste de configuração do Supabase precisa de conectividade DNS e de credenciais válidas do projeto configurado.
