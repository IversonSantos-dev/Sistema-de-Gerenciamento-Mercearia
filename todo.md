# Project TODO

- [x] Modelar e aplicar as tabelas de produtos, vendas e itens de venda no banco de dados.
- [x] Criar procedimentos de backend para cadastrar, editar, consultar e localizar produtos por código de barras.
- [x] Criar procedimentos transacionais para finalizar vendas, registrar pagamentos e baixar o estoque imediatamente.
- [x] Implementar a estrutura de navegação administrativa com acesso ao PDV, produtos e estoque baixo.
- [x] Implementar o dashboard operacional com indicadores de estoque e vendas.
- [x] Implementar cadastro e gerenciamento de produtos com nome, descrição, custo, venda, unidade, estoque e EAN-13/UPC.
- [x] Implementar alerta visual de produtos no estoque mínimo ou abaixo dele.
- [x] Implementar leitura de código de barras compatível com leitores USB/Bluetooth Keyboard Wedge no cadastro e no PDV.
- [x] Implementar tela de venda rápida com carrinho, agrupamento de itens repetidos, edição de quantidades e subtotais em tempo real.
- [x] Implementar finalização por dinheiro, débito, crédito ou Pix, incluindo cálculo de troco quando aplicável.
- [x] Implementar atalhos de teclado para busca, alteração ou remoção de itens, cancelamento e finalização de venda.
- [x] Aplicar estilo elegante, enxuto e responsivo, priorizando desempenho em computadores de configurações básicas.
- [x] Criar e executar testes unitários para operações críticas de estoque, vendas e cálculos do carrinho.
- [x] Validar visualmente as telas em formatos de desktop e mobile, corrigindo problemas encontrados.
- [x] Ajustar a listagem de produtos para apresentar cartões acessíveis e completos em telas móveis.
- [x] Analisar a estrutura e os campos disponíveis na planilha XLS de inventário fornecida.
- [x] Implementar o upload e o processamento seguro de planilhas XLS/XLSX para produtos.
- [x] Mapear e validar campos de produto, preços, unidade, estoque e código de barras antes da importação.
- [x] Criar interface de importação com resumo de registros criados, atualizados e rejeitados.
- [x] Testar a importação com a planilha fornecida e registrar os resultados.
- [x] Definir a arquitetura de operação offline e sincronização com o banco principal online.
- [x] Adicionar persistência local no navegador para catálogo, estoque e vendas pendentes quando não houver internet.
- [x] Implementar uma fila de operações offline com sincronização automática e idempotente ao restabelecer a conexão.
- [x] Exibir estado de conexão e pendências de sincronização no PDV.
- [x] Testar venda offline, recuperação de conexão e prevenção de duplicidade no banco principal.
- [x] Documentar uma plataforma gratuita de banco online e o procedimento de administração e manutenção.
- [x] Configurar com segurança as credenciais do projeto Supabase como banco principal.
- [x] Migrar as tabelas de usuários, produtos, vendas e itens de venda do banco atual para o Supabase PostgreSQL.
- [x] Implementar uma cópia operacional local no navegador para um único caixa e fila idempotente de sincronização.
- [x] Sincronizar automaticamente produtos e vendas pendentes ao restabelecer a conexão.
- [x] Exibir na frente de caixa o estado online/offline e a quantidade de operações aguardando envio.
- [x] Testar a recuperação de conexão e documentar o painel de manutenção do Supabase.
- [x] Validar visualmente os indicadores de conexão e sincronização da frente de caixa em desktop e mobile.
- [x] Substituir a cópia local no navegador por um armazenamento em arquivos locais do computador do caixa.
- [x] Adotar pasta autorizada e arquivo local em vez de serviço local instalado, conforme a opção escolhida para um único caixa.
- [x] Integrar a sincronização idempotente dos arquivos locais com o Supabase quando a internet retornar.
- [x] Remover o IndexedDB como armazenamento de dados comerciais, mantendo-o somente para recordar a autorização da pasta.
- [x] Criar instruções de ativação e backup do arquivo local do caixa.
- [x] Implementar a seleção autorizada de pasta local via File System Access API no navegador do caixa.
- [x] Persistir catálogo e vendas pendentes no arquivo pdv-local.json escolhido pelo operador.
- [x] Substituir a fila baseada em IndexedDB pela leitura e escrita do arquivo local autorizado.
- [x] Orientar o operador a autorizar a pasta do PDV antes da primeira operação offline.
- [x] Adicionar botão de sincronização manual para enviar vendas pendentes do arquivo local ao Supabase.
- [x] Exibir retorno claro de sincronização manual, indisponibilidade de internet e ausência de pendências.
- [x] Testar o acionamento manual sem duplicar vendas ou alterar itens já sincronizados.
- [x] Avaliar atualizações de confiabilidade, segurança e operação da plataforma do PDV.
- [x] Priorizar as melhorias recomendadas para as próximas versões do sistema.
- [x] Modelar e aplicar o histórico de fechamentos diários no Supabase.
- [x] Apurar vendas do dia por dinheiro, débito, crédito e Pix para conferência de caixa.
- [x] Criar uma tela de fechamento com valores apurados, valores contados e diferenças.
- [x] Registrar observações e o resultado do fechamento para consulta posterior.
- [x] Testar os cálculos financeiros e a prevenção de fechamentos duplicados na mesma data.
- [x] Preparar consulta detalhada de vendas para emissão de comprovante simplificado.
- [x] Criar layout de comprovante térmico não fiscal para venda e fechamento de caixa.
- [x] Adicionar comandos de prévia e impressão pelo navegador nas telas de venda e fechamento.
- [x] Validar o conteúdo e o layout de impressão em formato térmico.
- [x] Remover a guia e a rota independentes de importação de planilha.
- [x] Adicionar a opção de importar planilha dentro da ação de cadastrar produto.
- [x] Preservar prévia, validação, mapeamento e importação para o Supabase no fluxo integrado.
- [x] Validar a nova organização da tela de produtos em desktop e mobile.
- [x] Modelar categorias de produtos e o estoque mínimo padrão de cada categoria no Supabase.
- [x] Permitir criar, editar e selecionar categorias no cadastro de produtos.
- [x] Aplicar o estoque mínimo da categoria automaticamente, preservando ajustes específicos do produto.
- [x] Ampliar alertas visuais de estoque baixo nas telas de produtos, estoque e painel operacional.
- [x] Testar o cálculo de reposição por categoria e validar os alertas em desktop e mobile.
- [x] Criar uma operação segura de ajuste manual de estoque com motivo e registro de movimentação.
- [x] Adicionar filtro de categoria ao catálogo, combinado à busca por nome e código de barras.
- [x] Criar controle rápido de ajuste de estoque diretamente em cada produto da listagem.
- [x] Exibir confirmação e atualizar alertas de estoque imediatamente após o ajuste.
- [x] Testar ajuste, filtragem e responsividade da listagem de produtos.
- [x] Corrigir o controle incremental de ajuste para usar o valor atual informado pelo operador.
- [x] Ampliar testes determinísticos para validações de filtro e ajuste de estoque.
- [x] Registrar validação funcional específica dos controles de filtro e ajuste rápido.
- [x] Corrigir o controle incremental de ajuste para usar o valor atual informado pelo operador.
- [x] Ampliar testes determinísticos para validações de filtro e ajuste de estoque.
- [x] Registrar validação funcional específica dos controles de filtro e ajuste rápido.
- [x] Registrar a dependência de levantamento do protocolo e do padrão de etiqueta quando a balança for escolhida.
- [x] Reservar a ativação final da integração de etiquetas para a homologação do modelo futuro da balança.
- [x] Criar um padrão configurável para códigos de etiqueta com PLU, preço total e dígito verificador.
- [x] Preparar o reconhecimento de etiquetas de peso variável sem alterar a leitura atual de EAN/UPC.
- [x] Exibir o modo de etiqueta preparado, porém desativado, até a definição do modelo da balança.
- [x] Testar a decodificação de etiquetas e documentar os dados necessários para a ativação futura.
- [x] Integrar a detecção de etiquetas configuradas ao leitor do PDV com fallback para EAN/UPC convencional.
- [x] Validar o produto por PLU e a compatibilidade entre total impresso, preço e peso antes de incluir a etiqueta no carrinho.
- [x] Criar consulta exclusiva de produtos vendidos por peso para a gestão de PLUs.
- [x] Permitir atribuir, alterar e remover PLUs diretamente pela interface de gestão.
- [x] Adicionar acesso à gestão de PLUs no catálogo e orientar seu uso antes da balança ser ativada.
- [x] Testar validação de PLU único, atualização da listagem e responsividade da gestão.
- [x] Cobrir o conflito de PLU duplicado na atualização de produtos por peso.
- [x] Validar a atualização do estado da listagem após salvar ou remover um PLU.
- [x] Revisar a interface aberta de gestão de PLUs em desktop e celular.
- [x] Revisar o fluxo de autenticação atual e definir a transição para login próprio por credencial.
- [x] Criar estrutura segura para usuários operacionais e credenciais protegidas por hash.
- [x] Implementar tela de login, criação inicial controlada e proteção de sessão nas rotas do PDV.
- [x] Testar login, logout, credencial inválida e bloqueio das áreas protegidas.
- [x] Restringir explicitamente a execução pública da função de fechamento de caixa no Supabase.
- [x] Permitir que a sessão autenticada do proprietário configure o primeiro acesso local sem depender da chave de ativação.
- [x] Corrigir a interface para dispensar a chave de ativação somente para a sessão real do proprietário.
- [x] Testar a configuração inicial assistida pelo proprietário e a exigência de chave para outros administradores.
- [x] Testar que o proprietário cria o primeiro acesso local sem chave de ativação.
- [x] Testar que outro administrador não cria o acesso local sem chave válida.

- [x] Levantar o acesso oficial disponível para NF-e e os requisitos de autorização do contribuinte.
- [x] Implementar importação segura de XML autorizado de NF-e com prévia dos itens antes de gravar.
- [x] Mapear itens da NF-e para produtos, EAN/GTIN, custos e entrada de estoque; lotes permanecem fora do modelo atual.
- [x] Impedir duplicidade pela chave única e testar as validações de entrada disponíveis no contrato.
- [x] Documentar que o portal oficial não deve ser automatizado com credenciais pessoais sem integração autorizada.

Não incluir credenciais de portal fiscal em código ou em variáveis sem solicitação explícita e fluxo de autorização adequado.

- [x] Revisar a disponibilidade de uma integração fiscal autorizada antes de implementar consulta automática ao portal.
- [x] Definir alternativa segura por upload de XML quando a consulta direta não estiver disponível.
- [x] Implementar importação de NF-e somente após validação dos requisitos fiscais e da autorização do contribuinte.
- [x] Testar duplicidade, associação de produtos, atualização de estoque e auditoria da entrada.
- [x] Documentar os limites da integração com o portal oficial.

- [x] Corrigir o escopo de integração para não incluir dependência desnecessária de funcionalidade já habilitada.

- [x] Levantar a modalidade oficial de consulta/importação de NF-e disponível para o estabelecimento.
- [x] Adicionar prévia e conferência manual dos itens antes da entrada no estoque.
- [x] Registrar chave, fornecedor, data, valores e itens importados para auditoria.
- [x] Testar rejeição de XML inválido, NF-e duplicada e produto sem correspondência.
- [x] Documentar a necessidade de certificado/autorização fiscal quando a consulta direta for escolhida.

- [x] Confirmar o fluxo de importação por XML ou chave antes de integrar qualquer serviço fiscal externo.
- [x] Implementar o fluxo fiscal escolhido após confirmação do usuário e dos requisitos do emissor.
- [x] Validar parser e contrato de entrada em ambiente automatizado sem alterar dados comerciais reais.

- [x] Registrar a decisão de não adicionar dependência fiscal externa para o fluxo XML-only.
- [x] Definir o mecanismo oficial de entrada de NF-e e a estratégia de autenticação correspondente.
- [x] Criar a interface de prévia, conferência e confirmação da nota.
- [x] Cobrir os cenários fiscais e de estoque com testes automatizados.

- [x] Confirmar que a NF-e será fornecida por XML autorizado, sem consulta automática por chave nesta etapa.
- [x] Implementar a importação da modalidade confirmada sem armazenar credenciais fiscais no frontend.
- [x] Validar fornecedor, itens, GTIN, custo, quantidade, unidade e duplicidade antes de atualizar estoque.
- [x] Registrar auditoria da entrada e documentar a operação no sistema.

- [x] Aguardar a confirmação do usuário sobre XML autorizado, chave/certificado ou integração fiscal contratada antes da implementação definitiva.
- [x] Implementar a alternativa escolhida para importar itens da NF-e com prévia e confirmação.
- [x] Testar parser e contrato de importação e orientar os requisitos fiscais para ativação futura.

- [x] Criar importação de NF-e por upload de XML baixado pelo operador.
- [x] Exibir prévia editável dos itens, custos, quantidades e unidades antes da confirmação.
- [x] Associar itens da nota a produtos existentes por GTIN/EAN ou permitir cadastro durante a revisão.
- [x] Registrar chave e dados da NF-e para impedir importação duplicada.
- [x] Confirmar entrada e atualizar estoque somente após revisão do operador.
- [x] Testar XML inválido, valores editados, produto não associado e duplicidade de nota.

- [x] Criar parser de XML autorizado de NF-e e normalizar cabeçalho e itens.
- [x] Criar tabelas e transação de entrada de NF-e com chave única e histórico.
- [x] Implementar prévia editável de custos, quantidades e correspondência de produtos.
- [x] Atualizar estoque somente após confirmação da prévia e registrar auditoria.
- [x] Validar XML inválido, nota duplicada e itens sem correspondência.

- [x] Criar ou atualizar o usuário local Iverson com perfil admin e senha armazenada por hash.
- [x] Validar autenticação do usuário Iverson sem expor a senha.

# Revisão de completude da importação de NF-e

- [x] Corrigir o escopo documentado para importação por XML autorizado, sem declarar suporte a consulta por chave.
- [x] Adicionar testes automatizados da mutação `commerce.nfe.import` para duplicidade, associação existente, criação de produto e atualização/auditoria de estoque.
- [x] Definir e documentar o tratamento de lote/validade: não importar lotes enquanto o modelo de produtos não os suportar.
- [x] Alinhar validação e testes para produto sem correspondência, permitindo cadastro novo somente com preço de venda informado.
- [x] Criar documentação operacional consolidada do upload de NF-e e de seus limites fiscais.

# Cobertura adicional da transação de NF-e

- [x] Testar a mutação tRPC `commerce.nfe.import` para sucesso, duplicidade e produto novo sem preço de venda.
- [x] Executar uma verificação controlada da função `import_nfe_entry` em transação reversível, sem deixar dados comerciais de teste.
- [x] Confirmar em esquema que a entrada cria itens e movimentações `nfe_entry` vinculadas à nota.
