# Operação do banco principal — Supabase

O banco principal do sistema é o projeto **Mercearia PDV**, hospedado no Supabase na região de São Paulo. A administração diária pode ser feita no [Dashboard do Supabase](https://supabase.com/dashboard/project/fmatopzoavmgazrbruua).

## Manutenção de rotina

| Necessidade | Onde realizar | Orientação |
|---|---|---|
| Consultar ou corrigir cadastro de produto | **Table Editor → products** | Use para nome, preço, código de barras e estoque mínimo. Para ajustes de estoque, prefira criar uma rotina de ajuste no sistema para preservar o histórico. |
| Conferir vendas realizadas | **Table Editor → sales** e **sale_items** | `sales` registra totais e pagamento; `sale_items` registra cada item vendido. Não altere uma venda concluída. |
| Consultar pendências de sincronização | Frente de caixa | O indicador mostra vendas guardadas no arquivo local que aguardam o retorno da internet. |
| Revisar erros técnicos | **Logs** | Use os filtros do painel para verificar falhas de banco ou requisições. |
| Rotacionar chave do servidor | **Settings → API Keys** | Crie uma nova chave secreta, atualize a configuração do sistema e só então exclua a chave antiga. Nunca exponha uma chave `sb_secret_...` no navegador. |

## Funcionamento sem internet

Antes de usar o modo offline pela primeira vez, abra o PDV e selecione **Escolher pasta**. O sistema cria o arquivo `pdv-local.json` na pasta autorizada. Esse arquivo guarda a cópia local do catálogo e as vendas pendentes; quando não houver internet, as vendas são registradas no arquivo e o estoque da cópia local é reduzido. Na reconexão, cada venda é reenviada com um identificador único; o banco principal reconhece uma repetição e impede que uma venda seja registrada duas vezes.

> Os dados comerciais de contingência ficam no arquivo local escolhido pelo operador, e não no armazenamento interno do navegador. O navegador conserva apenas a autorização da pasta para evitar que ela seja solicitada em toda abertura. Não mova, renomeie ou apague `pdv-local.json` enquanto houver vendas pendentes.

## Plano gratuito

O plano gratuito do Supabase disponibiliza 500 MB de banco por projeto e o painel de administração, mas pode pausar um projeto após uma semana sem uso. Consulte periodicamente os limites e a política atual em [Pricing](https://supabase.com/pricing). O recurso de cópia local preserva a continuidade no caixa durante indisponibilidades pontuais, mas não substitui uma rotina de conferência e backup operacional.

## Referências

1. [Supabase Pricing](https://supabase.com/pricing)
2. [Supabase Database Overview](https://supabase.com/docs/guides/database/overview)
3. [Understanding API Keys](https://supabase.com/docs/guides/getting-started/api-keys)
