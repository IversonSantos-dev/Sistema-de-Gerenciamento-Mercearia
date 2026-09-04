# Pesquisa para importação de NF-e

## Conclusões

A importação direta de NF-e não deve ser feita por automação de login e scraping do portal. A modalidade oficial para consultar documentos destinados ao CNPJ é o Web Service NFeDistribuicaoDFe, que exige certificado digital ICP-Brasil e identifica o interessado pelo CNPJ-base. A Nota Técnica 2014/002 descreve distribuição de resumos e documentos, com retorno compactado e paginação por NSU.

A documentação oficial informa que a Manifestação do Destinatário pode consultar notas destinadas, enviar Ciência da Emissão, Confirmação da Operação, Desconhecimento ou Operação não Realizada e fazer download do XML de NF-e conforme as regras do serviço. A Sefaz-SP informa que seu aplicativo antigo foi descontinuado em 01/08/2025 e indica o Portal Nacional ou soluções de mercado como alternativas.

## Implicações para o PDV

O caminho mais seguro para a primeira entrega é aceitar o XML autorizado por upload, validar assinatura, chave, CNPJ destinatário, situação/autorização, fornecedor, itens, GTIN, unidade, quantidade, custo e valores, mostrar uma prévia e somente depois lançar entrada de estoque. A NF-e deve ter uma chave única no banco para impedir duplicidade e precisa manter registro de auditoria.

A consulta automática por chave ou por documentos destinados deve ser uma integração posterior com certificado A1/A3 e um serviço local ou provedor fiscal autorizado. O certificado não deve ser enviado ao frontend nem armazenado em texto no banco. Como o projeto usa hospedagem autoscale e o caixa pode operar offline, uma ponte local ou um provedor fiscal pode ser necessário para a consulta com certificado.

## Referências

1. https://portal.fazenda.sp.gov.br/servicos/nfe/Paginas/Aplicativo-de-Manifesta%C3%A7%C3%A3o-do-Destinat%C3%A1rio.aspx — Sefaz-SP, Aplicativo de Manifestação do Destinatário.
2. https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=Enkznb1F1SM= — Portal Nacional NF-e, Nota Técnica 2014/002, NFeDistribuicaoDFe.
3. https://portalsped.fazenda.mg.gov.br/spedmg/nfe/Manifestacao-do-Destinataro/ — Sefaz-MG, Manifestação do Destinatário.
