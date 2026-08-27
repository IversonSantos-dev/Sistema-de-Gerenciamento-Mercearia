# Recomendações de evolução da plataforma

## Diagnóstico atual

O sistema já possui uma estrutura adequada para uma operação de **caixa único**: o Supabase concentra o banco principal, enquanto o arquivo `pdv-local.json`, na pasta autorizada do computador, mantém a continuidade de vendas quando a internet não estiver disponível. A sincronização automática e o comando manual reduzem o risco de acumular operações pendentes e a idempotência impede que o mesmo identificador de venda seja registrado duas vezes no banco principal.

O principal ponto de atenção é operacional. A contingência depende de o catálogo ter sido sincronizado no computador antes da queda de conexão, de a pasta permanecer acessível e de o arquivo local não ser removido. Assim, as próximas melhorias devem priorizar recuperação, rastreabilidade e rotina de caixa antes de recursos visuais adicionais.

## Atualizações priorizadas

| Prioridade | Atualização | Motivo e resultado esperado |
|---|---|---|
| **Alta** | **Transformar o sistema em PWA instalável com cache da tela de caixa** | Garante que a interface do PDV possa abrir mesmo sem internet, e não apenas continuar aberta após uma queda. O arquivo local continuará sendo a fonte de dados de contingência. |
| **Alta** | **Criar backup local com um clique** | Adiciona o botão “Criar cópia de segurança”, que salva uma cópia datada do `pdv-local.json` na mesma pasta. Facilita a recuperação após troca de computador, falha de disco ou exclusão acidental. |
| **Alta** | **Adicionar ajustes de estoque com histórico** | Toda entrada, perda, conferência ou correção deve gerar um movimento auditável, com data, operador, motivo e saldo anterior/posterior. Evita alterar estoque diretamente sem rastreabilidade. |
| **Alta** | **Implementar fechamento de caixa diário** | Permite informar o valor contado, comparar com vendas por forma de pagamento e registrar diferenças. É a evolução mais relevante para controle financeiro da mercearia. |
| **Média** | **Adicionar devolução/cancelamento de venda confirmada** | Uma devolução precisa reverter o estoque de forma controlada e ficar vinculada à venda original, em vez de editar registros concluídos. |
| **Média** | **Criar relatórios e exportação CSV/Excel** | Relatórios diários, semanais e mensais de vendas, produtos mais vendidos, margem estimada e estoque baixo reduzem trabalho manual de conferência. |
| **Média** | **Separar perfis de operador e administrador** | O operador usa o caixa; o administrador altera produtos, preços, estoque mínimo, importações e relatórios. Isso reduz alterações indevidas em uma operação compartilhada. |
| **Baixa** | **Adicionar impressão de comprovante** | Pode gerar comprovante simplificado para impressora térmica ou PDF. Deve ser feito após o fechamento de caixa e as devoluções estarem definidos. |

## Rotina recomendada de operação

Antes de iniciar o caixa, confirme o indicador **Conectado** e o status do arquivo local. Quando a conexão estiver disponível, use **Sincronizar vendas** até não existir nenhuma pendência. Ao encerrar o dia, faça o fechamento de caixa e crie uma cópia de segurança do arquivo local quando esse recurso for adicionado.

Semanalmente, teste a contingência: aguarde a atualização do catálogo, interrompa a internet, registre uma venda de teste e restabeleça a conexão. Em seguida, confirme que a venda pendente foi enviada uma única vez. Esse teste simples verifica os três elementos essenciais da operação: arquivo local, fila de pendências e baixa de estoque no banco principal.

> Não mova, renomeie nem apague `pdv-local.json` enquanto houver pendências. Antes de trocar de computador, sincronize todas as vendas e guarde uma cópia de segurança do arquivo.

## Manutenção do Supabase

O Supabase permanece adequado como banco principal porque oferece PostgreSQL e painel para visualizar tabelas, executar consultas e acompanhar logs. O acesso às tabelas comerciais deve continuar restrito ao servidor, sem publicar a chave secreta no navegador. A rotação de chaves deve seguir o procedimento de criar a nova chave, atualizar o sistema, verificar o funcionamento e somente depois invalidar a chave anterior. [1] [2]

No plano gratuito, acompanhe regularmente os limites do projeto e a política de inatividade pelo painel, especialmente em períodos em que o caixa não for utilizado. O painel e os limites aplicáveis são definidos pelo próprio Supabase e podem mudar ao longo do tempo. [3]

## Referências

[1]: https://supabase.com/docs/guides/getting-started/api-keys "Supabase — API Keys"
[2]: https://supabase.com/docs/guides/database/overview "Supabase — Database Overview"
[3]: https://supabase.com/pricing "Supabase — Pricing"
