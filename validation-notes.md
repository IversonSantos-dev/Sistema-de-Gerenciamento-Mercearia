# Validação visual

As telas de visão geral, frente de caixa, produtos e estoque baixo foram verificadas nas larguras de desktop e mobile. A hierarquia do PDV, o resumo da venda, os atalhos e o formulário de busca permanecem legíveis em 375 px. Foi identificado que a versão inicial da tabela de produtos priorizava largura de desktop, por isso a listagem receberá uma apresentação em cartões exclusiva para telas móveis.

A página de importação de inventário foi revisada em desktop. O painel apresenta claramente a seleção de arquivo, o mapeamento das colunas e a confirmação de importação; a tela voltou a renderizar corretamente depois do ajuste de compatibilidade do leitor XLS/XLSX.

A frente de caixa foi revisada em desktop e mobile após a inclusão da redundância. Os indicadores de conexão aparecem junto ao título sem prejudicar o fluxo de leitura do produto, e o aviso de operação offline foi concebido para manter a confirmação de venda clara em telas estreitas.

A substituição para arquivo local foi revisada em desktop e mobile. O alerta de proteção local explica que o operador deve escolher uma pasta e cria o arquivo `pdv-local.json` nessa pasta, sem esconder o fluxo de leitura de código, carrinho ou finalização de venda.

O comando manual **Sincronizar vendas** foi revisado no cabeçalho da frente de caixa. Ele fica visível somente no PDV e aciona a mesma fila idempotente usada na sincronização automática, apresentando mensagens claras para internet indisponível, ausência de pendências, sincronização em andamento e envio concluído.

A tela de fechamento de caixa foi revisada em desktop e mobile. Os quatro meios de pagamento, os campos conferidos, as diferenças, as observações, o resumo geral e o histórico continuam visíveis e utilizáveis em uma largura de 375 px.

Os comprovantes foram configurados como prévia de 80 mm com folha de impressão isolada, usando apenas os dados persistidos de venda ou fechamento. A visualização é aberta após a confirmação da venda ou do fechamento, e o comando de impressão do último fechamento fica disponível no cabeçalho financeiro.

A tela de produtos foi revisada em desktop e mobile depois da centralização da importação. A guia independente foi removida da navegação; o botão **Cadastrar produto** e o estado vazio passam a oferecer, em um único ponto, cadastro manual ou importação de planilha com as validações existentes.

As telas de Produtos, Estoque baixo e Visão geral foram revisadas após a inclusão de categorias. A configuração de categorias está acessível no catálogo, e os alertas passam a distinguir produtos em reposição e produtos esgotados, mostrando o mínimo efetivo individual ou por categoria.

Em largura móvel, a ação **Categorias**, o cadastro de produto e os cartões de alerta permanecem acessíveis. O painel operacional reorganiza os indicadores em uma única coluna e preserva a leitura dos alertas de estoque sem truncamento de conteúdo essencial.

A listagem de Produtos foi revisada em desktop e em 375 px após a inclusão do seletor **Todas as categorias** ao lado da busca. Ambos os controles se empilham no celular sem colisão e preservam o contador de resultados. A validação automatizada cobre a composição do filtro de categoria, a restrição `category_id` na consulta do catálogo, o cálculo incremental dos botões de ajuste e a chamada da operação transacional que grava a movimentação manual.

O ajuste rápido aparece como uma ação por produto e abre uma confirmação com o estoque atual, novo saldo, variação prevista e motivo opcional. A operação invalida catálogo, alertas de reposição e visão geral após a confirmação. Como o ambiente de validação permanece sem produtos comerciais cadastrados, a inspeção visual confirma o estado vazio e o layout dos filtros; a interação do ajuste foi validada de forma determinística pelos testes de controle e contrato do backend, sem inserir dados de demonstração no banco principal.

A frente de caixa foi revisada em desktop e em 375 px após o preparo para etiquetas de balança. O aviso deixa explícito que o recurso permanece desativado até a escolha e homologação do modelo, sem ocultar o leitor existente, os avisos de contingência ou a operação de venda. A suíte automatizada valida o dígito verificador, a leitura de PLU e valor em centavos, o bloqueio quando a configuração está desativada e a conversão de preço total em peso compatível com o preço/kg cadastrado.

A tela de Produtos foi revisada em desktop e em 375 px após a inclusão do acesso **PLUs da balança**. A nova ação permanece alinhada às opções de categoria e cadastro no computador e se reorganiza em uma segunda linha no celular, mantendo alvos de toque e textos legíveis. A gestão pesquisa somente produtos ativos vendidos por quilograma, aceita PLUs de um a seis dígitos, permite removê-los e invalida as consultas do catálogo após cada atualização.

O painel dedicado **PLUs da balança** foi revisado aberto em desktop e em 375 px. A busca, o contador de códigos configurados, o estado vazio e o aviso de ativação futura permanecem visíveis sem corte. A validação automatizada cobre os limites de PLU, a consulta exclusiva de itens por peso e o bloqueio de conflito de código antes da atualização; a interface invalida a própria listagem e o catálogo após salvar ou remover um PLU.

A revisão final do painel aberto foi feita no preview autenticado, tanto em desktop quanto em celular. Os cenários automatizados de `updateProductScalePlu` confirmam que um código duplicado não aciona a atualização e que as operações de atribuir e remover enviam, respectivamente, um PLU numérico e `null` ao banco. Após cada sucesso, a interface invalida a lista de produtos por peso, o catálogo geral e a busca por PLU, fazendo o saldo de códigos exibido ser recarregado.

A rota pública `/login` foi revisada em desktop e em 375 px. A primeira configuração reúne nome, usuário, senha e confirmação em um cartão com todos os controles visíveis; quando aberta pelo proprietário já autenticado, a chave de ativação é omitida de forma explícita. A validação automatizada cobre a chave de ativação, hash e conferência de senha, emissão do cookie de sessão, credencial inválida, logout e bloqueio dos procedimentos comerciais sem sessão. A auditoria do Supabase não retornou avisos de execução pública para a função de fechamento após a revogação explícita de permissões.

O estado de configuração assistida agora é enviado pelo servidor com base na comparação entre a identidade autenticada e a identidade real do proprietário, e não apenas pela função de administrador. Os testes confirmam que somente o proprietário recebe `ownerAssistedSetup: true`; outro administrador continua recebendo `false` e, portanto, precisa informar a chave de ativação para a configuração inicial.

O fluxo de configuração foi exercitado diretamente pelo roteador. A sessão do proprietário cria o primeiro administrador local sem enviar chave de ativação e recebe a sessão protegida; uma sessão administrativa diferente é recusada antes da criação se não apresentar uma chave válida. Essa cobertura evita que a interface e a regra do servidor tratem administradores distintos como se fossem o proprietário do sistema.
