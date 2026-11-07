# Blockidle Companion 0.7.1

**Correção de instalação.** Baixe o arquivo que termina em **`-INSTALAR.zip`**, extraia numa pasta permanente e use “Carregar sem compactação” escolhendo a pasta que tem o `manifest.json`. O ZIP `codigo-fonte-NAO-INSTALAR` e o botão “Code” do GitHub não são a extensão.

- Os arquivos da publicação foram renomeados para não confundir a extensão com o código-fonte.
- O código-fonte não tem mais um `manifest.json` na raiz, que causava o erro de manifesto ao ser carregado por engano.

Quem já usa a 0.7.0 pode atualizar pela central em Configurações; as preferências são preservadas.

---

## Novidades da 0.7.0

Compatível com o build do jogo `0ddf20e09b` (04/11/2026). Um build novo com o mesmo contrato libera só os filtros; contrato alterado deixa a extensão em leitura, com o motivo na tela.

- **Filtros da mochila em grade 3×9** (Automações): Compactador, Apagador e Auto-venda, 9 conjuntos cada, com as opções do jogo “vender ao chegar” e “vender tudo”.
- **Regras por área** (modo Sugerir ou Automático) ligadas aos conjuntos e ao guarda-roupa do jogo, drops aprendidos por área, sugestão de conjuntos e limite de valor no Bazar.
- **Crafts:** objetivo fixado no topo com a árvore do que falta (inclusive crafts intermediários), onde está cada material, custo no Bazar e Pegar e craftar no build atual.
- **Bazar:** preços, margem, livro, gráfico de 24 h, prévia com a taxa real, compra e venda imediata, ordens, cancelamento e resgate, sempre com confirmação.
- **Terminal:** movimentação no build atual (Terminal e baús da ilha com passeio), Guardar mochila no Ender, Juntar nos baús e lotação dos baús.
- **Eventos:** Dragão (e se o Steve vai entrar sozinho, com o motivo quando não vai), Dark Auction e calendário do jogo.
- **Barra de status**, sincronização a cada 5 minutos (também em segundo plano, opcional) e **notificações** configuráveis.
- **Novidades:** radar de mudanças do jogo e prompt pronto para atualizar a extensão.
- Retirada a venda automática própria da extensão (a auto-venda nativa do jogo cobre isso). A venda manual do excedente continua.

Atualização direta da 0.4 ou da 0.6 preserva preferências. Regras por área começam no modo Sugerir e as notificações começam desligadas. Os testes usam respostas simuladas; nenhuma ação foi feita em conta real.
