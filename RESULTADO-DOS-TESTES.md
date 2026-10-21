# Validação da versão 0.6.0

Conferência local em 21/10/2026: **267 verificações aprovadas**. TypeScript e compilação de produção aprovados.

| Suíte | Verificações |
| --- | ---: |
| Unitários (inclui diagnóstico local opcional) | 152 |
| Interface e transporte | 13 |
| Ações nativas | 22 |
| Bancada e Forja | 10 |
| Atualizador | 8 |
| Objetivos | 14 |
| Avisos da Forja | 8 |
| Acessórios, SkyBlock e tela Jogo | 15 |
| Venda, compactador e personalização | 25 |

Sem o diagnóstico local, há 151 unitários e um teste omitido; o total executado é 266. As suítes de venda e ações nativas foram repetidas após a última alteração do adaptador.

Os resultados detalhados são produzidos pelas suítes listadas em package.json. A publicação executa TypeScript, testes unitários, compilação de produção e todas as suítes de navegador antes de gerar os pacotes.

A cobertura inclui interface e transporte, ações nativas anteriores, bancada/Forja, atualização, objetivos, avisos, acessórios, SkyBlock, tela Jogo e venda por excedente. A nova suíte de vendas confere checkbox, busca/região/limpeza, reserva, preço, baús autorizados, capacidade com e sem campo de slots no estado, proteções, comandos divergentes, automação desligada, visibilidade simulada oculta, falhas e bloqueio de repetição, builds, substituição/limpeza do compactador, ordem das guias e seções recolhíveis persistentes. Também verifica largura de 390 px e erros de página.

## Limites

Os testes utilizam perfis de navegador isolados, clientes e endpoints simulados. Não houve venda, retirada nem alteração de filtros na conta real do usuário. O teste de visibilidade simula o getter do navegador como oculto; não comprova execução contínua em segundo plano no Windows.

O build 6b899075fb foi informado pelo usuário e confrontado com os módulos públicos coletados em 21/10/2026. Somente filtros do compactador e vendas têm suporte nesse build; cada execução relê o estado e compara contrato e versão. Receitas e movimentações anteriores continuam bloqueadas nele. A evidência dos arquivos está em docs/compatibility-0.6.0.json. Não é uma homologação autenticada do servidor.

Preços vêm do catálogo carregado no jogo. Offline, apenas valores explícitos coletados são exibidos. A confirmação de venda exige diminuição exata do estoque, preservação da reserva e recebimento do ouro esperado. Respostas divergentes bloqueiam repetição até revisão.

O teste opcional de importação de diagnóstico lê somente o arquivo local apontado por BLOCKIDLE_DIAGNOSTIC; ele não é copiado para o projeto nem para os pacotes. Sem essa variável, o teste é omitido.
