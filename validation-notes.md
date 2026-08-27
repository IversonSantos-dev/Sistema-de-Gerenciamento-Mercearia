# Validação visual

As telas de visão geral, frente de caixa, produtos e estoque baixo foram verificadas nas larguras de desktop e mobile. A hierarquia do PDV, o resumo da venda, os atalhos e o formulário de busca permanecem legíveis em 375 px. Foi identificado que a versão inicial da tabela de produtos priorizava largura de desktop, por isso a listagem receberá uma apresentação em cartões exclusiva para telas móveis.

A página de importação de inventário foi revisada em desktop. O painel apresenta claramente a seleção de arquivo, o mapeamento das colunas e a confirmação de importação; a tela voltou a renderizar corretamente depois do ajuste de compatibilidade do leitor XLS/XLSX.

A frente de caixa foi revisada em desktop e mobile após a inclusão da redundância. Os indicadores de conexão aparecem junto ao título sem prejudicar o fluxo de leitura do produto, e o aviso de operação offline foi concebido para manter a confirmação de venda clara em telas estreitas.

A substituição para arquivo local foi revisada em desktop e mobile. O alerta de proteção local explica que o operador deve escolher uma pasta e cria o arquivo `pdv-local.json` nessa pasta, sem esconder o fluxo de leitura de código, carrinho ou finalização de venda.

O comando manual **Sincronizar vendas** foi revisado no cabeçalho da frente de caixa. Ele fica visível somente no PDV e aciona a mesma fila idempotente usada na sincronização automática, apresentando mensagens claras para internet indisponível, ausência de pendências, sincronização em andamento e envio concluído.

A tela de fechamento de caixa foi revisada em desktop e mobile. Os quatro meios de pagamento, os campos conferidos, as diferenças, as observações, o resumo geral e o histórico continuam visíveis e utilizáveis em uma largura de 375 px.

Os comprovantes foram configurados como prévia de 80 mm com folha de impressão isolada, usando apenas os dados persistidos de venda ou fechamento. A visualização é aberta após a confirmação da venda ou do fechamento, e o comando de impressão do último fechamento fica disponível no cabeçalho financeiro.
