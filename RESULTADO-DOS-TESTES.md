# Resultado da validação — 0.5.0

Conferência local em 20/10/2026: **228 verificações aprovadas**. TypeScript e compilação de produção aprovados.

- Testes unitários: **138**. Inclui um teste opcional de importação offline do diagnóstico enviado pelo usuário. Seu conteúdo não é copiado para o projeto. No GitHub esse teste é omitido quando a variável local não existe: 137 aprovados e 1 omitido.
- Interface e transporte: **13**.
- Ações nativas: **22**.
- Bancada e forja: **10**.
- Atualizador: **8**.
- Objetivos: **14**.
- Avisos da forja: **8**.
- Filtros, SkyBlock e tela Jogo: **15**.

## Cobertura nova

Filtros: família ausente, tier intermediário e família completa; posse no terminal; próximo/maior tier; combinação de atributos; distinção entre vida e cura, defesa e redução de dano, engastes e atributos diretos; busca, raridade e largura de 390 px.

SkyBlock: leitura do cálculo do cliente, meta 32, ausência explícita da leitura, total coerente, tiers cumulativos sem duplicação, XP de habilidade restante, custos inteiros de missões Tier I e migração/restauração de preferências. A lista de rotas é parcial; custos variáveis não são inventados.

Tela Jogo: leitura da aba vinculada em página própria; respostas simuladas de ranking e erro; título/ícone neutros e restauração; prevenção de descarte e restauração da configuração anterior; abertura reutiliza aba existente. O bloqueio de ação sob presença experimental foi testado com o getter de visibilidade do navegador **simulado como oculto**; não representa medição de execução contínua em segundo plano no Windows.

## Limites e dados

Não houve transação na conta real nem homologação autenticada de um novo build do jogo. As suítes usam clientes/endpoints simulados e perfis de teste. A guarda de build e as verificações de estoque/sessão continuam ativas. A presença experimental não simula cliques, movimento ou coleta; seu comportamento em uma conta real e a continuidade sob suspensão do navegador/sistema não foram comprovados.

O ranking usa o módulo oficial já carregado na aba; os testes usam nomes fictícios. Resultados não são persistidos em snapshots nem diagnósticos.

As APIs de alarmes/notificações do Chromium foram exercitadas, inclusive reinício. A exibição visual da notificação pelo Windows, a autorização humana de pasta/permissões e o Microsoft Edge separado não foram observados.

A consulta pública confirmou que o jogo bloqueia incorporação em outras páginas. Por isso a tela Jogo abre uma janela separada. A aparência/atividade começa desativada e não exige novas permissões.

O catálogo de 462 crafts, 102 transformações e 61 acessórios mantém a base anterior. A auditoria de 19/10 identificou alterações do jogo ainda não incorporadas nesse catálogo (Ruínas, novos itens e receitas de Slayer). Esta versão acrescenta os painéis solicitados, sem declarar essa atualização de catálogo nem liberar builds novos.
