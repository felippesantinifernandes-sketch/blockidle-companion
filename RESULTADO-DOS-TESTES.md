# Validação da versão 0.7.0

Conferência local em 05/11/2026. TypeScript e compilação de produção aprovados.

| Suíte | Verificações |
| --- | ---: |
| Unitários (inclui contrato do build, segurança, regras por área, Bazar, Dragão, radar e árvore de craft) | 215 |
| Interface e transporte | 13 |
| Ações nativas (inclui passeio, guarda-roupa e radar no build 0ddf20e09b) | 27 |
| Bancada e Forja (inclui craft com passeio no build 0ddf20e09b) | 11 |
| Atualizador | 8 |
| Objetivos | 14 |
| Avisos da Forja | 8 |
| Venda, compactador e personalização | 25 |

Há um teste unitário omitido (diagnóstico local opcional). A suíte de acessórios, SkyBlock e tela Jogo (`test:features`) não pôde ser executada no ambiente desta conferência; a publicação a executa antes de gerar os pacotes.

A publicação executa TypeScript, testes unitários, compilação de produção e todas as suítes de navegador antes de gerar os pacotes.

## Limites

Os testes utilizam perfis de navegador isolados, clientes e endpoints simulados. Não houve venda, compra no Bazar, retirada, craft, gravação do guarda-roupa nem alteração de filtros na conta real do usuário.

O build 0ddf20e09b foi comparado com os módulos públicos do cliente em 04/11/2026 e conferido de novo em 05/11/2026 (sem alterações). As funções de `rede.js`, as ações `acao` e as rotas do Bazar usadas pelo adaptador são verificadas contra a lista extraída desses módulos. A evidência dos arquivos está em docs/compatibility-0.7.0.json. Não é uma homologação autenticada do servidor.

Preços vêm do catálogo e do Bazar carregados no jogo. Offline, apenas valores explícitos coletados são exibidos. Respostas divergentes bloqueiam repetição até revisão.

O teste opcional de importação de diagnóstico lê somente o arquivo local apontado por BLOCKIDLE_DIAGNOSTIC; ele não é copiado para o projeto nem para os pacotes. Sem essa variável, o teste é omitido.
