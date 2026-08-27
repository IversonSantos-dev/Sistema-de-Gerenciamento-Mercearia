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
