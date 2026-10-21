# Filtros, SkyBlock e tela Jogo — 0.5

## Acessórios

Personagem → Bolsa e coleção → engrenagem. Combine efeitos por qualquer/todos, família, raridade e evolução. O atalho Evoluir famílias mostra as versões acima do melhor item atualmente em posse, incluindo terminal. Sem nenhum item da família aparecem todos; com o tier 2 de 3 aparece só o 3. Também há próximo tier e maior tier publicado. Versões únicas podem ser excluídas. Os cards e os detalhes mostram a cadeia de versões.

Os efeitos são classificados pela descrição do catálogo. Não se atribuem atributos diretos a engastes sem saber as gemas instaladas. Posse não é um registro histórico: o tier antigo pode ter sido consumido. Os filtros não alteram o Poder Mágico calculado.

## Nível SkyBlock

Progressão → Nível SkyBlock. A leitura usa xpSkyBlock do módulo oficial que a aba já carregou. Sem essa leitura o painel não substitui o valor por nível geral nem XP de encantamento. Cada nível requer 100 XP. A meta inicial é 32 e pode ser alterada.

Selecione destinos de coleções, habilidades ou Slayer. Dentro de uma mesma fonte o destino maior substitui o menor. Coleção exige ganho na contagem da coleção, não simplesmente possuir/comprar os materiais. O resumo separa XP, ouro fixo e gastos não tabelados. Os custos de Slayer se referem exclusivamente às taxas de início do Tier I; pré-requisitos, equipamentos, consumíveis, derrotas e tempo continuam dependendo do jogo. Outras fontes de XP aparecem no detalhamento do cálculo, mas nem todas têm uma rota de planejamento nesta versão.

## Página própria e Jogo

Abrir página própria abre o Companion em uma aba normal. Na tela Jogo, abra/reutilize a janela do Blockidle ou selecione uma das abas existentes para leitura. As ações manuais trazem a aba vinculada para a frente e continuam verificando sessão, estoque, build e visibilidade real. A incorporação do jogo é bloqueada por X-Frame-Options: DENY e frame-ancestors none; a extensão usa uma janela separada.

O ranking é obtido pelo módulo de rede da aba autenticada, no mesmo serviço usado no lobby. Nomes públicos são mostrados apenas no componente, sem persistência em snapshots ou diagnósticos. Falhas limpam a lista anterior e mostram erro; não são apresentadas como lista vazia válida.

## Aparência e atividade

Na tela Jogo, Aparência discreta altera o título/ícone das abas do Blockidle e do Companion e o ícone da ação do navegador. Impedir descarte altera autoDiscardable e conserva o valor anterior para restauração. Manter presença no cliente é experimental: altera a indicação de visibilidade que o cliente lê ao trocar de guia. A conferência real de visibilidade das ações usa o getter do navegador, não essa indicação substituída.

Essas opções começam desativadas e entram no backup normal de preferências. A preferência de atividade não simula cliques, movimento ou coleta. Não garante execução contínua: congelamento de processos, limites do navegador, rede e suspensão do computador podem interromper o jogo. Ao desativar, título/ícone e propriedades de visibilidade são restaurados. Nenhuma nova permissão de navegador é adicionada.
