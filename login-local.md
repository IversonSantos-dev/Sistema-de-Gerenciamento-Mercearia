# Acesso local ao Mercearia PDV

O sistema passou a utilizar um **login próprio por usuário e senha**. Para criar o primeiro acesso, abra `/login` enquanto estiver conectado como proprietário do projeto. A tela solicitará o nome, um usuário e uma senha de pelo menos 12 caracteres; nessa condição, a chave de ativação não é solicitada.

Em um computador sem a sessão do proprietário, a mesma configuração exige a **chave de ativação** definida durante a configuração técnica do sistema. Essa chave não deve ser compartilhada com operadores e não deve ser usada como senha do dia a dia.

Depois de criado o administrador local, os operadores devem entrar por `/login` com o usuário e a senha cadastrados. A aplicação armazena apenas o hash da senha. Após cinco tentativas incorretas, o usuário fica bloqueado por 15 minutos.

O usuário local `iverson` é promovido automaticamente para `admin` quando o sistema consegue acessar o banco. Esse perfil pode abrir o painel **Usuários**, criar e editar acessos, bloquear ou desbloquear operadores, redefinir senhas e consultar as funções administrativas disponíveis.

> A credencial inicial controla o acesso ao aplicativo; ela não substitui os usuários ou permissões do painel administrativo do Supabase.
