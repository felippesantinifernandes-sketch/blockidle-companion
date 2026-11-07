# Histórico de versões

## Não lançado

- Instalação: o ZIP da extensão passa a se chamar `…-INSTALAR.zip` e o do código-fonte `…-codigo-fonte-NAO-INSTALAR.zip`. A pasta do código-fonte não tem mais um `manifest.json` na raiz (ele foi para `src/`), evitando o erro de manifesto ao carregar o arquivo errado.

## 0.7.0 · 05/11/2026

- **Vai ter Dragão? O Steve vai entrar?** A guia Eventos lê o Dragão pelo jogo (luta, invocação, olhos no altar) e confere cada regra do Entrar sozinho: opção ligada, Selo de Convocação (e o Encantado no invocado), portal, Combate 12, fora da Câmara do Vazio, Catacumbas, passeio, Invasão e de missão de Slayer (que segura o Steve na Masmorra). Cada condição que falha diz o que fazer. A barra de status mostra “entra/não entra” e o aviso chega 10 minutos antes dizendo o motivo.
- **Objetivo fixado no topo da guia Crafts:** escolha um item e a quantidade; o painel mostra o progresso, a ordem para craftar (incluindo os crafts intermediários), a árvore completa com ícones e o que falta coletar ou comprar, com onde está guardado e o custo no Bazar. “Adicionar e fixar como objetivo” também na receita.
- Ícones nos títulos das seções e nas colunas da grade; ícone do item cai para a textura do próprio jogo quando a da wiki falta.
- Automações: nova grade **Conjuntos de filtros** em 3 colunas (Compactador, Apagador e Auto-venda), com 9 quadrados cada. Cada quadrado guarda um conjunto completo; o que está ativo no jogo fica com borda verde.
- Criar conjunto a partir da lista atual do jogo, do modelo da região (compactador) ou escolhendo itens da mochila, dos drops de uma região ou do catálogo. Editar, duplicar e esvaziar quadrados.
- Novas ações confirmadas: salvar a lista do Apagador Pessoal e a lista da auto-venda nativa do jogo (7 vagas). Itens protegidos, favoritos, reservados ou de objetivos não entram. As regras de aceitação espelham o cliente do jogo (31/10/2026).
- Aviso quando a opção do jogo “Vender também qualquer outro item que não couber” está ligada, pois ela vende itens fora da lista.
- O estado lido agora inclui `apagar`, `autoVender`, `autoVenderJa` e `autoVenderTudo`, e as vagas do apagador vêm do catálogo conectado.
- **Compatibilidade por contrato** e suporte ao build `0ddf20e09b` (04/11/2026) para filtros e venda do excedente. Um build novo com o mesmo contrato (funções de `rede.js`, mapas de vagas, campos de estado) libera só os filtros; contrato alterado deixa a extensão em leitura, com o motivo na tela.
- **Barra de status** no topo: build e compatibilidade, área e tarefa, ouro, Bits, Gemas, mochila, tempo offline do dia, filtros ativos, total da auto-venda, cookie e rank. Sincroniza com o servidor a cada 5 minutos (`/api/estado` pela aba do jogo) e tem o botão **Atualizar agora**.
- **Sincronização em segundo plano** (opcional, Configurações › Avisos): a cada 5 minutos, mesmo com o painel fechado. Com a aba do jogo aberta, lê pelo módulo do jogo; sem a aba, faz só um GET de `/api/estado`. A barra de status mostra o último retrato quando não há aba conectada, e as notificações também funcionam com esse retrato.
- **Regras por área**: cada área aponta para um quadrado da grade em cada lista, mais as opções da auto-venda. Modo **Sugerir** (padrão) mostra um aviso ao chegar na área; **Automático** aplica sozinho com o painel aberto. Um pedido por vez, no máximo um por segundo, parando no primeiro erro.
- Regras por área com **conjunto do guarda-roupa**: a extensão grava as listas do Compactador e do Apagador no conjunto e liga a troca automática do jogo na área. Daí em diante o próprio jogo troca, mesmo com a extensão fechada. Nunca regrava uma lista igual (o jogo apagaria) e recusa se a lista atual não for a do conjunto.
- **Drops aprendidos e sugestão por área**: a extensão anota o que cresce no estoque enquanto você está numa área e, junto com os drops da wiki, sugere conjuntos (encantáveis no Compactador; sementes e itens baratos que não entram em receita no Apagador; o resto vendável na Auto-venda). Armaduras, armas, ferramentas, minérios brutos, carnes e itens de objetivo ou protegidos ficam de fora. Novo **limite de valor no Bazar**: acima dele, nada vai para o Apagador nem para a Auto-venda.
- Coluna Auto-venda com as opções do jogo **Vender os marcados assim que chegam** e **Vender também qualquer outro item que não couber**, e o total vendido.
- **Retirado:** a venda automática própria da extensão (a auto-venda nativa faz isso, sem mexer no que já está guardado). A venda manual do excedente guardado continua em Venda.
- Novo botão **Abrir jogo em janela compacta** na guia Jogo. Testes impedem chamar `visivel`, `ilha` ou `passeio`.
- Ações de filtro em sequência agora esperam 1 segundo entre pedidos.
- **Assistente de craft:** a origem aceita segue a regra do jogo (mochila, saco, bolsas, **reservas da aba** e Compactador/Apagador guardados; `oak_planks` aceita qualquer tábua). Cada ingrediente que falta mostra onde está guardado (baú com coordenada e rótulo, Ender, farm) e, depois de consultar o Bazar, quanto custa comprar o que não existe em lugar nenhum. Filtros **Posso fazer agora** e **Falta pouco (75%)**.
- **Movimentação no build `0ddf20e09b`**: retirar e depositar entre mochila, Ender, sacos, bolsas, farms, baús da ilha e Terminal. O depósito usa `por`. Terminal e baús da ilha usam o passeio (liga, até 3 tentativas em “só na ilha”, sempre desliga ao final) e avisam que o Steve para durante a operação.
- **Pegar e craftar no build `0ddf20e09b`**: crafts da mesa, do SkyBlock, de armaduras, forja, compactação e lapidação liberados. A retirada de baús da ilha usa o passeio uma vez para todas as retiradas e desliga antes de craftar. Receitas que divergem do cliente atual continuam bloqueadas antes de qualquer pedido.
- Ações rápidas **Guardar mochila no Ender** e **Juntar nos baús**, com confirmação e bloqueio se a mochila tiver item protegido. Barra de **lotação dos baús** na guia Terminal.
- **Notificações do jogo** (Configurações › Avisos), cada uma pode ser desligada: mochila cheia, tempo offline em 80%, fila de craft vazia, Dragão nasce em 5 minutos, Dark Auction com lote raro, Bazar com algo para resgatar, build do jogo mudou e regra de área aplicada.
- Nomes e ícones de itens com as **cores de raridade do jogo** (ajustadas para contraste no tema escuro; variantes escuras do jogo no tema claro) e números com largura fixa.
- Nova guia **Eventos**: contagem para o Dragão do End (a cada 3 h), janela do Dark Auction (:40 a :55) e o calendário do próprio jogo (Zoológico, Mining Fiesta, Festa da Pesca, Outono…). A barra de status mostra o próximo Dragão e o leilão. Interruptor **Entrar sozinho na luta do Dragão**.
- Nova guia **Novidades** com o **radar de mudanças**: segue os imports de `/js/main.js`, guarda o hash de cada módulo e, quando o build muda, lista arquivos alterados, ações e funções novas ou removidas, itens, receitas e itens do Bazar novos, constantes alteradas, campos de estado e os comentários datados novos. Campo para colar o anúncio do Discord e botão **Copiar prompt de atualização**.
- Nova guia **Bazar**: preços de compra e venda imediata, margem de revenda já com a taxa, volume, filtro por categoria, livro de ofertas, gráfico de 24 h, prévia com a taxa real da conta, compra e venda imediata, ordens de compra e venda, cancelamento e resgate. Toda escrita pede confirmação; vender item protegido, favorito, reservado ou de objetivo fica bloqueado. No máximo uma consulta por segundo.

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
- Título/ícone neutros e prevenção de descarte opcionais.

## 0.4.0

- Objetivos de craft com prioridade, componentes, alternativas e proteção de materiais.
- Recomendações de acessórios, avisos de Forja e alertas de atualização.

## 0.3.0

- Bancada ligada à wiki, requisitos, coleções, estoque e Forja.
- Central de atualização com preservação da instalação e preferências.

## 0.2.0

- Drops por região, modelos de compactador, terminal e transformações supervisionadas.
