# Importação de NF-e por XML

## Fluxo operacional

Baixe o XML autorizado da NF-e pelo canal fiscal disponível para o estabelecimento e abra **Produtos → Cadastrar produto → Importar NF-e**. Selecione o arquivo XML. O sistema lê o arquivo no navegador e apresenta fornecedor, número, série, chave, total e todos os itens encontrados.

Antes de confirmar, revise a quantidade, o custo unitário e a associação de cada item. A correspondência é tentada pelo GTIN/EAN e pelo código interno. Para um item sem correspondência, escolha **Cadastrar como novo** e informe o preço de venda; para um item existente, selecione o produto correto. A confirmação soma a quantidade ao estoque, atualiza o custo do produto e registra a entrada e seus itens para auditoria.

## Proteções

A chave de acesso possui 44 dígitos e é única no banco. Uma NF-e já importada é rejeitada pela transação. XML inválido, sem itens ou com valores inconsistentes não pode ser confirmado. A operação é transacional: se um item falhar, a nota e as alterações de estoque não são parcialmente gravadas.

O XML não é enviado ao Supabase durante a leitura da prévia. Somente os dados revisados e confirmados são enviados ao backend. Não armazene certificado digital, senha fiscal ou credenciais de portal no frontend.

## GTIN, lote e validade

GTIN ausente ou inválido é apresentado como aviso, pois alguns itens podem ser fornecidos sem código comercial. A associação deve ser conferida pelo operador antes da confirmação. O modelo atual não possui campos de lote e validade; portanto, esses dados não são importados nem inventados. Caso o controle por lote seja necessário, será preciso adicionar um modelo específico de lotes antes de ativar esse requisito.

## Limites fiscais

Esta funcionalidade importa o XML que o operador já obteve de forma autorizada. Ela não faz scraping do portal da NF-e, não automatiza login e não consulta notas por chave. Uma integração oficial de consulta exigiria avaliar certificado digital, autorização do contribuinte, ambiente fiscal e serviço homologado separadamente.
