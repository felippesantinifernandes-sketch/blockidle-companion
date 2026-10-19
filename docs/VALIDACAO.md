# Validação 0.4.0

O relatório RESULTADO-DOS-TESTES.md contém contagens e limites. As suítes são reproduzíveis por npm run release. A publicação por tag executa testes unitários, compilação e todos os testes de navegador antes de criar os arquivos da versão.

Os testes de objetivos cobrem atribuição única, rendimentos e sobras, dependências entre metas, ciclos, filas, quantidades, origens, coleções, proteções e equipamentos consumidos. O transporte MAIN/worker é exercitado com a extensão real e respostas controladas. Há cenários de mudança de estoque e de fila entre a revisão e a consulta final, retiradas parciais e mensagens inválidas.

Os alarmes usam APIs reais do Chromium, com permissões pré-autorizadas no manifesto de teste. O ensaio inclui reinício do navegador, cancelamento e deduplicação. O retorno da API é observado; janela de permissão e exibição visual do aviso pelo Windows não foram automatizadas.

O atualizador usa uma pasta OPFS isolada de teste, com seletor substituído. Valida pacote, hash, permissões, identidade, versão, escrita e restauração. A autorização humana de pasta não foi automatizada e a instalação pessoal não foi alterada.

As fontes públicas foram reconferidas em 19/10/2026. Os fluxos do jogo permanecem sob validação final do servidor. **Não houve transação na conta real.** Chrome/Chromium foi testado; Edge não foi homologado separadamente.
