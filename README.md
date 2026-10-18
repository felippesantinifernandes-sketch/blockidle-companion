# Blockidle Companion 0.3.0

Extensão independente para Chrome/Edge (Manifest V3), com painel em português para terminal, bancada de crafts, coleções, forja, acessórios e compactador. Não é um produto oficial do Blockidle.

## Instalação e atualização

Baixe o ZIP da extensão em [Releases](https://github.com/felippesantinifernandes-sketch/blockidle-companion/releases/latest), extraia para uma pasta permanente e carregue a pasta com manifest.json em chrome://extensions ou edge://extensions (Modo do desenvolvedor → Carregar sem compactação). Recarregue o jogo e clique no ícone da extensão → Conectar jogo.

Se já utiliza 0.1/0.2, substitua os arquivos na mesma pasta e recarregue a mesma extensão. **Não remova a extensão para atualizar.** O ID e as preferências ficam preservados. A 0.3 precisa dessa atualização inicial; as versões seguintes podem ser aplicadas em Configurações → Central de atualização, sem exportar/restaurar backup.

Na central, verifique a nova versão, prepare o download e escolha a mesma pasta instalada. O navegador exige autorização de escrita nessa pasta; a escolha fica salva em IndexedDB. Depois de revisar a versão, Aplicar e recarregar substitui os arquivos e reinicia a extensão. Um ZIP já baixado também pode ser utilizado. Se o navegador bloquear seleção de pasta, a alternativa é substituir os arquivos manualmente na mesma instalação.

## Bancada e coleções

A seção Crafts reúne **462 receitas**: 131 de mesa, 158 SkyBlock, 141 peças de armadura e 32 de forja. Os dados vêm da wiki e das definições públicas atuais do cliente. Mudanças do cliente podem ser mais recentes que a data-base da wiki.

Clique em um item para abrir a receita, o item na wiki, o desenho real quando publicado no cliente, ingredientes no formato disponível / necessário e requisitos de coleção, Combate, Slayer, equipamento anterior, estações e Coração da Montanha. A aba Coleções mostra o total coletado, o próximo nível e as receitas vinculadas. Coleções não são somadas ao estoque de materiais.

Receitas pequenas de até 2×2 cabem na mochila; receitas grandes exigem a mesa do acampamento na Floresta ou a Mesa de Trabalho Portátil. A extensão não teleporta o personagem. Acesso aos armazenamentos e regras adicionais continuam sob validação do servidor.

Retirar faltantes do terminal prepara somente o que falta na origem aceita pela receita. As retiradas são mostradas antes de confirmar e executadas em sequência, com limite de 24. Se uma for parcial, falhar ou não tiver confirmação, o craft não será enviado; materiais já retirados ficam na mochila. Não há desfazer ou repetição automática de transações.

Mesa e forja usam materiais na mochila. Crafts SkyBlock/armaduras também podem consumir saco, bolsas e compactador/apagador guardado, conforme a regra nativa. O estoque global é mostrado separadamente da quantidade aceita pela operação. Ouro, ferramentas anteriores, proteção, favoritos e reservas são revalidados.

Crafts de mesa podem ser aceitos na **fila de preparo** do jogo: o aviso diferencia pedido aceito de item concluído. SkyBlock, armadura e início de forja executam uma receita por confirmação. A mesa permite até 64 lotes por pedido, conforme aceitação do servidor.

## Forja

Mostra fila, prazo retornado pelo servidor, vagas do Coração + rank ativo, tempo base e estimativa com o nível de **Forja Rápida**. A fórmula acompanha efeitoCoracao do cliente, incluindo o nível 20. Um bônus ausente fica como Não informado; o nível do Coração não é convertido em um desconto suposto. A contagem continua com o jogo fechado.

## Acessórios

Em Personagem há **61 acessórios ligados à wiki**, com filtros para em uso, em posse e faltantes, efeitos, raridade, Poder Mágico e acesso à receita. Só mochila e bolsa ativam acessórios; o maior da família prevalece. Recombobulação e Hegemonia entram no cálculo. Itens guardados no terminal contam como posse, mas não como ativos. O Poder Mágico informado pelo jogo prevalece sobre o cálculo local. A posse atual não prova histórico de coleção: upgrades podem consumir versões anteriores.

## Atualização dos dados e avisos

Ao abrir Terminal, selecionar itens ou interagir com os controles, o painel relê o HUD do jogo. A leitura ocorre depois do clique para preservar o comportamento dos checkboxes. Ações concluídas aplicam o novo estado imediatamente. Há botões Atualizar aqui próximos dos controles e avisos flutuantes de sucesso, falha ou resultado desconhecido, sem necessidade de voltar ao topo.

Resultados desconhecidos bloqueiam novas ações até Revisar estado. A intenção pendente sobrevive ao repouso do worker em chrome.storage.session. Não há repetição automática. Vendas, descarte e organização automática em lote continuam indisponíveis.

## Funções preservadas

39 modelos de região, 430 ocorrências de drops/condições, 84 compactações e 18 lapidações, incluindo filtros automáticos de gemas. Busca, localização, grupos, apelidos, favoritos, proteção, reservas, movimentações manuais, planejamento, temas, snapshots, backup opcional e diagnóstico sanitizado. Catacumbas exigem escolha manual do andar; Cobre e Vazio têm lacunas sinalizadas. A consulta da wiki verifica a data-base e não atualiza silenciosamente regras de execução.

## Privacidade e distribuição

Cookies e tokens do jogo não são lidos, persistidos ou exportados. Somente campos permitidos do estado são projetados. A bolsa de acessórios é tratada separadamente do estoque físico. Importação e demonstração são offline e não autorizam ações no jogo. Dados de diagnóstico, HAR, arquivos .env e credenciais não integram o repositório nem os ZIPs.

O atualizador consulta somente o repositório público deste projeto, sem token do GitHub na extensão. Verifica SHA-256, CRC do ZIP, limites de tamanho, caminhos, identidade do manifesto, versão e permissões. O manifesto é escrito por último; falhas de escrita tentam restaurar os arquivos anteriores. Nenhuma configuração do navegador é removida. Código de atualização só é aplicado por confirmação explícita em uma pasta autorizada.

## Desenvolver e testar

Requer Node.js 22+.

```text
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:ui
npm run test:native
npm run test:workbench
npm run test:updater
```

A pasta instalável é dist/. A prévia npm run dev não possui acesso ao jogo. Os testes de navegador usam perfis descartáveis e respostas simuladas; não utilizam a conta pessoal. O teste visual procura Chrome no caminho padrão do Windows; os demais usam Chromium do Playwright. BLOCKIDLE_DIAGNOSTIC é uma variável opcional para verificar localmente um diagnóstico, sem copiá-lo ao projeto.

scripts/collect-workbench.mjs coleta fontes públicas em work/research-v030 fora do projeto. scripts/extract-workbench.mjs interpreta apenas estruturas de dados com operações permitidas; não executa os módulos obtidos. Os resultados devem ser revisados antes de distribuir uma nova versão. scripts/release.mjs valida, testa e empacota. Uma tag vX.Y.Z dispara o workflow de publicação, que confere a versão, testa, compila e publica os ZIPs, os hashes e update.json.

Fontes: [wiki](https://blockidle.io/wiki/), [crafts](https://blockidle.io/wiki/crafts_sb), [coleções](https://blockidle.io/wiki/colecoes), [forja](https://blockidle.io/wiki/forja), [acessórios](https://blockidle.io/wiki/acessorios) e módulos públicos catalogo.js, sistemas_sb.js, armazem.js, forjaui.js e mochilacfg.js. Consulte docs/ e RESULTADO-DOS-TESTES.md para limites e evidências. As texturas permanecem nos servidores do jogo; créditos em THIRD_PARTY_NOTICES.md.
