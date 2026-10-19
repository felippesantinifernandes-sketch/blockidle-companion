# Resultado da validação — 0.4.0

Conferência local em 19/10/2026: **191 verificações aprovadas**.

- TypeScript e compilação de produção Manifest V3: aprovados.
- Suíte unitária: **116 testes**. Inclui importação offline de diagnóstico local, sem copiar seu conteúdo para o projeto. No ambiente público, esse teste opcional é omitido se BLOCKIDLE_DIAGNOSTIC não estiver definido.
- Interface/transporte: **13 verificações**, navegação, busca, proteção, reservas, persistência, IndexedDB, sanitização, isolamento de aba e largura de 360 px.
- Ações nativas anteriores: **22 verificações**, filtros, modelos, terminal, movimentações, compactação/lapidação, deduplicação, bloqueio persistente de resultado incerto e recusa de build divergente.
- Bancada/forja/acessórios: **10 verificações**, grade e fontes, retirada só do faltante, fila, interrupção em parcial, estoque alterado, coleção, origens aceitas, prazo da forja e largura de 390 px.
- Atualizador: **8 verificações**, consulta pública simulada, hash, manifesto, correspondência da pasta, persistência da autorização, gravação, preferências preservadas e pacote adulterado recusado.
- Objetivos/evolução: **14 verificações**, migração 0.3, etapas, quantidade exata de compactação, invalidação de revisão, fila alterada entre HUD e preflight, retirada parcial, comando forjado, drops, filtros conflitantes/sugeridos, ganho líquido de MP, criação de objetivo, aviso de versão e ausência de erros JavaScript.
- Avisos da forja: **8 verificações**, usando APIs reais de alarmes e notificações do Chromium. Confere agendamento, retorno bem-sucedido da API, ledger de entrega, deduplicação, cancelamento, desativação e retomada depois de reiniciar o navegador.

## Dados e proteção

As definições públicas de catálogo, sistemas SkyBlock, armaduras, forja e acessórios foram conferidas em 19/10/2026 e permaneceram iguais à coleta anterior. O planejamento combina 462 receitas de craft e 102 transformações, respeitando rendimentos, alternativas, requisitos, equipamento consumido, prioridades e produções pendentes. O estoque de uma meta não é atribuído novamente a outra. Coleções são desbloqueios e não materiais.

O comando externo de objetivo só contém a identificação da etapa e sua revisão. O worker reconstrói a operação e o MAIN confere novamente quantidades globais relevantes e fila com o estado recebido do servidor. A compactação do objetivo pede quantidade exata. A lapidação nativa processa tudo e fica bloqueada se consumiria excedentes. Proteções manuais continuam valendo. Filtros que já estão ativos no jogo exigem revisão explícita para serem desativados.

## Limites da validação

**Não houve movimentação da conta real nem homologação autenticada do servidor do jogo.** Os testes de ações usam cliente/endpoints simulados, perfis descartáveis e dados fictícios. O servidor real continua responsável por acesso, espaço, desbloqueios e regras finais. Não houve requisição POST ao jogo real.

Os avisos usam o último prazo observado. A janela humana de autorização não foi automatizada: no teste de alarmes, as duas APIs opcionais foram pré-autorizadas em um manifesto de teste, com os mesmos arquivos compilados. O retorno da API de notificações foi conferido; a exibição visual do balão pelo Windows não foi observada. Sistema, navegador fechado e suspensão podem atrasar avisos. Mudanças em outra aba/aparelho só são conhecidas na próxima leitura.

O teste do atualizador grava em OPFS isolado, com seletor substituído. A API nativa de seleção foi detectada, mas a janela humana de autorização de pasta não foi automatizada. A instalação pessoal não foi alterada.

Chrome/Chromium foi testado; Edge não foi homologado separadamente. Regiões com dados incompletos permanecem sinalizadas. Drops não publicados não são garantidos. Equipamentos que precisem ser preparados/equipados e processos sem receita de execução publicada continuam como requisitos ou obtenção manual. O tempo de trabalho da forja é uma soma sequencial, não um agendamento ótimo com vagas compartilhadas. Recomendações de acessórios não presumem preços de mercado; o MP do servidor prevalece.
