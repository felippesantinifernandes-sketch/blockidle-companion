# Resultado da validação — 0.3.0

Validação em 18/10/2026: **132 verificações aprovadas**, sem falhas nessa execução.

- TypeScript e compilação de produção Manifest V3: aprovados.
- Suíte unitária: **79 testes**, incluindo a importação offline de um diagnóstico local. O arquivo e os dados pessoais não acompanham a distribuição. No ambiente público, esse teste opcional é omitido se a variável BLOCKIDLE_DIAGNOSTIC não estiver definida.
- Interface e transporte: **13 verificações**, em Chrome/Chromium com perfis descartáveis. Navegação, busca, proteção, reservas, preferências, IndexedDB, painel de 360 px, sanitização e isolamento por aba.
- Ações nativas: **22 verificações** com endpoints interceptados, incluindo filtros, gemas, modelos, movimentações, compactação/lapidação, proteção, deduplicação, bloqueio persistente de resultado desconhecido e recusa de build divergente.
- Bancada, forja e acessórios: **10 verificações** com a extensão real e respostas simuladas. Receita, wiki, grade, retirada somente do faltante, craft na fila, interrupção em retirada parcial, estoque alterado, consumo de saco/bolsas, coleção, tempo da forja, atualização por clique e layout de 390 px.
- Atualizador: **8 verificações** em navegador. Consulta pública do GitHub simulada, pacote e SHA-256, manifesto, correspondência da pasta, autorização persistida, gravação e recarga, preferências preservadas, rejeição de adulteração e layout estreito.

## Dados e regras

462 receitas: 131 de mesa, 158 SkyBlock, 141 armaduras e 32 de forja. 61 acessórios ligados à wiki. Mantém os 39 modelos de região, 430 ocorrências de drops/condições, 84 compactações e 18 lapidações. As definições públicas e a wiki foram consultadas em 18/10/2026. O cliente pode conter mudanças posteriores à data-base da wiki; as regras nativas disponíveis são confrontadas antes da execução.

Coleções representam desbloqueios, sem serem somadas ao estoque. Mesa e forja usam a mochila; SkyBlock/armaduras consideram as origens nativas aceitas. O plano de retirada cobre somente a diferença, exige revisão e não repete transações. Uma confirmação de fila não é apresentada como item pronto. A forja usa o bônus de Forja Rápida, vagas do Coração e rank ativo; o prazo retornado pelo servidor prevalece. Acessórios guardados no terminal contam como posse, mas não como ativos.

## Limites do ensaio

**Não houve movimentação da conta real nem homologação autenticada do servidor.** As ações do jogo foram testadas com dados fictícios e respostas controladas. O servidor real continua responsável pelo acesso, desbloqueios e limites.

O ensaio do atualizador usa uma pasta OPFS isolada, com o seletor substituído pelo teste. A API do seletor nativo está disponível na página da extensão, mas a janela humana de autorização de pasta no Windows não foi automatizada. A instalação pessoal não foi alterada. Há fallback de atualização manual na mesma pasta.

Chrome/Chromium foi testado; Edge não foi homologado separadamente. Cobre/Vazio têm lacunas sinalizadas; Catacumbas exigem seleção manual do andar. Drops não publicados não são garantidos. Campos ausentes aparecem como não informados. A consulta da wiki não substitui silenciosamente regras de execução. Vendas, descarte e organização automática em lote permanecem indisponíveis.
