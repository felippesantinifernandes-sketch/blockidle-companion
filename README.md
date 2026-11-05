<div align="center">

![Blockidle Companion](docs/images/banner.svg)

[![Versão](https://img.shields.io/github/v/release/felippesantinifernandes-sketch/blockidle-companion?color=9fbd6b&label=vers%C3%A3o)](https://github.com/felippesantinifernandes-sketch/blockidle-companion/releases/latest)
[![Validação](https://github.com/felippesantinifernandes-sketch/blockidle-companion/actions/workflows/release.yml/badge.svg)](https://github.com/felippesantinifernandes-sketch/blockidle-companion/actions/workflows/release.yml)
![Chrome e Edge](https://img.shields.io/badge/Chrome%20%2F%20Edge-Manifest%20V3-59755b)
![Interface em português](https://img.shields.io/badge/interface-pt--BR-59755b)

**Organize recursos, planeje crafts e acompanhe sua evolução em um só painel.**

[Baixar extensão](https://github.com/felippesantinifernandes-sketch/blockidle-companion/releases/latest) · [Como instalar](INSTALACAO.md) · [Novidades](CHANGELOG.md) · [Reportar problema](https://github.com/felippesantinifernandes-sketch/blockidle-companion/issues/new)

</div>

## O que você encontra

| Guia | Para que serve |
| --- | --- |
| Terminal | Busca global com cada lugar, movimentação (com passeio para Terminal e baús da ilha), Guardar mochila no Ender, Juntar nos baús e lotação dos baús. |
| Venda | Venda manual do excedente guardado, com reserva na mochila. |
| Bazar | Preços, margem de revenda, livro de ofertas, gráfico de 24 h, prévia com a taxa real, compra, venda, ordens e resgate. |
| Automações | Grade de conjuntos (Compactador, Apagador, Auto-venda), regras por área, modelos por região e transformações. |
| Crafts | O que falta em cada receita, onde está, quanto custa no Bazar, Pegar e craftar, e objetivos encadeados. |
| Personagem | Coleção de acessórios, efeitos, famílias e próximos tiers. |
| Progressão | Coleções, habilidades e planejamento do nível SkyBlock. |
| Jogo | Página própria, janela do jogo e consulta ao ranking. |
| Eventos | Dragão do End, Dark Auction e calendário do jogo. |
| Novidades | Radar de mudanças do jogo e prompt pronto para atualizar a extensão. |
| Configurações | Notificações, sincronização em segundo plano, ordem das guias, tema e atualização. |

No topo de todas as guias, a barra de status mostra build e compatibilidade, área, moedas, mochila, tempo offline e filtros ativos. Ela sincroniza com o jogo a cada 5 minutos.

Todas as seções com título podem ser recolhidas pela seta. A escolha e a ordem das guias ficam salvas.

## Filtros da mochila e regras por área

Em **Automações › Conjuntos de filtros**, a página tem três colunas (Compactador, Apagador e Auto-venda) com 9 quadrados cada. Cada quadrado guarda uma lista completa; clique para criar, revisar e aplicar no jogo. O quadrado ativo fica com borda verde.

Em **Regras por área**, escolha qual quadrado vale em cada área. No modo **Sugerir** (padrão), o painel avisa ao chegar na área e aplica com um clique. No modo **Automático**, aplica sozinho com o painel aberto. O apagador descarta itens de forma definitiva; revise os conjuntos antes de ligar o automático.

## Venda por excedente · 0.6

![Aba Venda](docs/images/venda.png)

**Exemplo:** você tem 900 sementes, quer manter 256 e marca o item para venda. A prévia mostra 644 excedentes e 322 de ouro ao preço de NPC de 0,5 por unidade.

1. Abra **Venda**, escolha uma região ou busque o item.
2. Marque o checkbox e ajuste **Manter na mochila**.
3. Opcionalmente, habilite **Incluir baús e colheita**.
4. Revise e confirme a venda manual.

A venda automática própria da extensão foi retirada: a auto-venda nativa do jogo vende o que chega com a mochila cheia e é configurada na grade de conjuntos. Um resultado incerto bloqueia novas transações até revisão.

A reserva deve estar na mochila antes de vender de baús. A retirada usa lotes de até 64, após conferir espaço; não inclui ração, bolsas, sacos ou Ender. Favoritos, proteções, reservas locais e materiais de objetivos impedem a venda. A lista usa os preços do catálogo carregado no jogo; offline, mostra os valores explícitos coletados em 21/10/2026. Cada operação confere novamente o preço atual do cliente: não são cotações do Bazar e valores desconhecidos não são estimados.

## Instalar e atualizar

Baixe o ZIP da extensão em **Releases**, extraia em uma pasta permanente e use **Carregar sem compactação** em chrome://extensions ou edge://extensions, com o modo do desenvolvedor ativado. Selecione a pasta que contém manifest.json e recarregue o jogo.

**Já utiliza a extensão?** Atualize pela central em Configurações, selecionando a mesma pasta instalada. Também é possível substituir os arquivos nessa pasta e recarregar a extensão. Não desinstale: manter a mesma instalação preserva suas preferências. É possível atualizar diretamente da 0.4 para a 0.6; os novos campos recebem valores iniciais e a venda começa desativada.

[Instruções completas de instalação](INSTALACAO.md)

## Compatibilidade e privacidade

O build anterior `ef3c8efa9f` mantém as ações já validadas. Os builds `6b899075fb` e `0ddf20e09b` (comparado com os módulos públicos em 04/11/2026) têm suporte restrito a filtros (compactador, apagador, auto-venda) e venda do excedente. Um build novo cujo contrato continua igual (mesmas funções de `rede.js`, mapas de vagas e campos de estado) libera só os filtros, sempre com confirmação; se o contrato mudar, a extensão fica em leitura e mostra o motivo. Crafts e movimentações nesses builds aguardam revisão.

Os testes usam clientes e respostas simulados. Não comprovam transações em uma conta real. O catálogo mantém lacunas e receitas antigas identificadas; o preço e as regras do servidor prevalecem.

Preferências e histórico ficam no navegador. O repositório e os pacotes não incluem diagnósticos de contas, autenticação ou inventários pessoais. Antes de abrir uma issue, remova informações pessoais e credenciais. O atualizador consulta este repositório público e confere a integridade do pacote.

Projeto independente, sem afiliação oficial com Blockidle ou Mojang. [Fontes e avisos de terceiros](THIRD_PARTY_NOTICES.md).

## Desenvolvimento

Requer Node.js 22. Instale as dependências com `npm ci`, compile com `npm run build` e rode os testes unitários com `npm test`. Para os testes de navegador, instale o Chromium do Playwright. `npm run release` executa a validação completa e gera os ZIPs e metadados.

- [Resultado dos testes](RESULTADO-DOS-TESTES.md)
- [Histórico de versões](CHANGELOG.md)
- [Evidências de compatibilidade](docs/compatibility-0.6.0.json)
