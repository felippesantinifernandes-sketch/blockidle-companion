# Histórico de versões

## Não lançado

- Automações: nova grade **Conjuntos de filtros** em 3 colunas (Compactador, Apagador e Auto-venda), com 9 quadrados cada. Cada quadrado guarda um conjunto completo; o que está ativo no jogo fica com borda verde.
- Criar conjunto a partir da lista atual do jogo, do modelo da região (compactador) ou escolhendo itens da mochila, dos drops de uma região ou do catálogo. Editar, duplicar e esvaziar quadrados.
- Novas ações confirmadas: salvar a lista do Apagador Pessoal e a lista da auto-venda nativa do jogo (7 vagas). Itens protegidos, favoritos, reservados ou de objetivos não entram. As regras de aceitação espelham o cliente do jogo (31/10/2026).
- Aviso quando a opção do jogo “Vender também qualquer outro item que não couber” está ligada, pois ela vende itens fora da lista.
- O estado lido agora inclui `apagar`, `autoVender`, `autoVenderJa` e `autoVenderTudo`, e as vagas do apagador vêm do catálogo conectado.
- **Compatibilidade por contrato** e suporte ao build `0ddf20e09b` (04/11/2026) para filtros e venda do excedente. Um build novo com o mesmo contrato (funções de `rede.js`, mapas de vagas, campos de estado) libera só os filtros; contrato alterado deixa a extensão em leitura, com o motivo na tela.
- **Barra de status** no topo: build e compatibilidade, área e tarefa, ouro, Bits, Gemas, mochila, tempo offline do dia, filtros ativos, total da auto-venda, cookie e rank. Sincroniza com o servidor a cada 5 minutos (`/api/estado` pela aba do jogo) e tem o botão **Atualizar agora**.
- **Regras por área**: cada área aponta para um quadrado da grade em cada lista, mais as opções da auto-venda. Modo **Sugerir** (padrão) mostra um aviso ao chegar na área; **Automático** aplica sozinho com o painel aberto. Um pedido por vez, no máximo um por segundo, parando no primeiro erro.
- Coluna Auto-venda com as opções do jogo **Vender os marcados assim que chegam** e **Vender também qualquer outro item que não couber**, e o total vendido.
- **Retirado:** a venda automática própria da extensão (a auto-venda nativa faz isso, sem mexer no que já está guardado). A venda manual do excedente guardado continua em Venda.
- **Manter presença ao trocar de guia** agora vem ligado por padrão (inclusive em instalações existentes, uma única vez; depois vale a sua escolha). Novo botão **Abrir jogo em janela compacta**. Testes impedem chamar `visivel`, `ilha` ou `passeio` e restringem a alteração da visibilidade à opção de presença.
- Ações de filtro em sequência agora esperam 1 segundo entre pedidos.
- **Assistente de craft:** a origem aceita segue a regra do jogo (mochila, saco, bolsas, **reservas da aba** e Compactador/Apagador guardados; `oak_planks` aceita qualquer tábua). Cada ingrediente que falta mostra onde está guardado (baú com coordenada e rótulo, Ender, farm) e, depois de consultar o Bazar, quanto custa comprar o que não existe em lugar nenhum. Filtros **Posso fazer agora** e **Falta pouco (75%)**.
- Consulta de preços do Bazar (só leitura, um pedido por clique).

## 0.6.0 · 21/10/2026

- Nova guia Venda: checkbox por item, preço de NPC, reserva na mochila, busca e filtro por região; limpar busca ou desmarcar todas as vendas.
- Venda manual revisada e automação opcional do excedente. Baús da ilha e colheita podem abastecer lotes de até 64; ração, sacos, bolsas e Ender ficam fora. Reserva primeiro na mochila.
- Preço e estoque são conferidos novamente antes da venda. Favoritos, proteções, reservas e materiais de objetivos são preservados. Falhas pausam a automação; resultados incertos exigem revisão.
- Compactador: leitura das vagas do cliente, substituição de modelos por região e limpeza confirmada dos filtros.
- Suporte restrito de filtros e vendas ao build 6b899075fb. Receitas e movimentações antigas nesse build permanecem bloqueadas. Builds desconhecidos não executam ações.
- Setas para recolher/expandir seções com escolha persistente. Ordem das guias configurável por setas em Configurações.
- Histórico identifica vendas manuais/automáticas e quantidades confirmadas; recupera registros antigos com campos opcionais nulos.
- Corrigido o texto da versão na tela de compatibilidade. README renovado com guia de uso, imagem e documentação.

Inclui as melhorias da 0.5: filtros avançados de acessórios, planejamento SkyBlock, página própria, ranking e opções de apresentação do jogo. Atualização direta da 0.4 preserva preferências; venda inicia desativada.

A automação funciona com o painel aberto e o jogo realmente visível, no máximo uma regra a cada 15 segundos. Não assume atividade contínua em segundo plano. Testes utilizam respostas simuladas; nenhuma venda foi feita em conta real.

## 0.5.0 · 20/10/2026

- Filtros avançados de acessórios por efeito, família, raridade e progresso de tiers.
- Plano para nível SkyBlock, fontes de XP e custos fixos conhecidos.
- Página própria, abertura do jogo em janela separada e ranking do servidor.
- Título/ícone neutros, prevenção de descarte e presença experimental opcionais.

## 0.4.0

- Objetivos de craft com prioridade, componentes, alternativas e proteção de materiais.
- Recomendações de acessórios, avisos de Forja e alertas de atualização.

## 0.3.0

- Bancada ligada à wiki, requisitos, coleções, estoque e Forja.
- Central de atualização com preservação da instalação e preferências.

## 0.2.0

- Drops por região, modelos de compactador, terminal e transformações supervisionadas.
