# Notas de integração de balança

## Evidências consultadas

- A documentação da Toledo para configuração de etiquetas EAN-13 informa que a composição pode carregar **preço total** ou **peso/quantidade**, código do item e dígito verificador; a configuração varia por modelo e tipo de etiqueta. Fonte: https://help.toledobrasil.com/mgvCloud/codigo_barras_EAN13.html
- A GS1 explica que códigos de medida variável identificam mercadorias cujo preço depende de peso, volume ou comprimento e que etiquetas emitidas no ponto de pesagem tradicionalmente usam EAN-13. Fonte: https://www.gs1uk.org/knowledge-hub/barcodes/how-to-barcode-variable-measure-items

## Consequência para o PDV

O caminho preferencial é configurar a balança etiquetadora para gravar no EAN-13 o identificador do produto e o **preço total** da etiqueta. O PDV deve reconhecer um prefixo reservado da loja, validar o dígito verificador e criar no carrinho uma linha de peso variável com o valor codificado. O produto continua cadastrado no catálogo para fins de nome, unidade e baixa de estoque; o preço impresso prevalece somente para aquela etiqueta.

## Dados ainda necessários

Antes da implementação, confirmar marca e modelo da balança, manual ou foto de etiqueta de teste, forma de conexão (Ethernet/Wi-Fi) e se ela oferece cadastro/sincronização de PLU por arquivo, API ou protocolo de rede.
