# Redundância offline e banco principal

## Recomendação de arquitetura

Para um único computador de caixa, a alternativa mais leve é manter uma cópia operacional local no navegador, com fila de vendas e alterações pendentes. O sistema envia cada operação ao banco principal quando houver conexão e marca a operação como sincronizada somente após a confirmação do servidor. Cada alteração recebe um identificador único, evitando duplicidade caso a internet caia durante o envio.

Para mais de um computador operando simultaneamente sem internet, é necessário um serviço local em um computador dedicado na própria loja, pois cada navegador teria uma cópia isolada. Essa alternativa exige instalação e manutenção adicional.

## Plataformas online pesquisadas

| Plataforma | Plano gratuito atual | Administração | Observação para este projeto |
|---|---|---|---|
| Supabase | 500 MB por projeto e até dois projetos ativos; projetos gratuitos entram em pausa após uma semana de inatividade. | Painel com editor visual de tabelas e editor SQL. | É a opção mais amigável para manutenção manual, mas exige migrar o banco atual de MySQL/TiDB para PostgreSQL. |
| Neon | 0,5 GB por projeto, 100 horas de computação por mês e suspensão após inatividade. | Painel, API e conexão PostgreSQL. | Boa para desenvolvimento, porém é menos indicada como base gratuita única de um PDV que precisa estar permanentemente disponível. |

## Fontes oficiais

1. https://supabase.com/pricing
2. https://supabase.com/docs/guides/database/overview
3. https://neon.com/pricing
