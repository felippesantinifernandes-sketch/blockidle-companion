# Arquitetura 0.4.0

O observador projeta respostas de /api/estado em campos permitidos e o worker lê também o HUD oficial. A leitura comum não cria sessão nem faz GET adicional. O clique é processado antes da releitura, preservando checkboxes controlados. Ações usam revisão, exclusão mútua e aplicação imediata do estado retornado; leituras concorrentes não substituem resultados recentes.

Comandos só são aceitos de páginas da própria extensão, com schema Zod estrito, aba ativa, escopo, build e proteções revalidados. Mensagens da página não executam escrita. As funções MAIN são autocontidas e usam somente módulos oficiais previamente carregados na mesma instância ESM. Uma consulta limitada confirma o build antes da ação. Cookies de autenticação ficam sob gestão do navegador, sem leitura/exportação.

A bancada utiliza craftRecipes estático com custos, fonte, rendimento, padrões e requisitos. O worker encontra a receita por ID e envia a especificação do catálogo, nunca uma receita arbitrária da página. O executor compara custos e requisitos com os módulos vivos, confere o estoque revisado, valida a soma das retiradas e comprova cada saldo. Interrompe em retirada parcial. Só depois envia craftar, sb_craft, arm_craft ou início de forja. Confirma saída física/equipada, entrada na fila ou nova tarefa com prazo, conforme a operação.

A bolsa de acessórios permanece fora do estoque físico. O normalizador disponibiliza um mapa separado para posse e ativação. O cálculo considera maior grau da família, raridade, recombobulação e Hegemonia; o valor do jogo é a referência final.

As preferências continuam na chave v1, com migração compatível. Snapshots em IndexedDB têm limite de 200; histórico de ações locais, 100. A intenção de operação é persistida em chrome.storage.session antes da execução. Resultado desconhecido bloqueia até consulta explícita de reconciliação. Não há repetição automática.

O atualizador abre uma página própria para o seletor de pasta. Consulta Releases do repositório fixo sem autenticação; verifica SHA-256, CRC, tamanho, versão, caminhos e manifesto. Confere a pasta pelo manifesto e código instalado. Grava ativos e depois o manifesto, conserva originais em memória para restauração se houver falha e solicita chrome.runtime.reload ao concluir. Não lê nem regrava preferências. A autorização de pasta pode ser persistida como FileSystemDirectoryHandle em IndexedDB, sujeita à política do navegador.

O catálogo e o adaptador não são atualizados por JSON remoto durante ações. Uma nova versão só entra após confirmação do usuário. A consulta periódica da wiki compara somente a data-base. Coleta pública usa análise sintática e interpretação restrita de dados, sem executar os módulos remotos obtidos.

## Planejamento e alertas — 0.4

core/objectives.ts expande o grafo em ordem de prioridade com lotes físicos, produções pendentes e sobras futuras. Um lote futuro carrega a dependência de sua produção; não é contado como posse concluída. Nós são limitados em quantidade/profundidade. Estoques, requisitos e filas relevantes compõem uma revisão determinística, independente da ordem das propriedades.

O comando externo goalStep contém somente objetivo, etapa e revisão. O worker relê as preferências e reconstrói o comando; parâmetros internos de transformação exata não são aceitos pelo schema de mensagens. O MAIN compara quantidades globais relevantes e fila novamente com o GET de preflight, além das validações nativas existentes. Uma mutação nunca é repetida após resultado incerto.

Objetivos são preferências locais. Claims preservam materiais nas operações externas; retained distingue ingredientes diretos dos destinados somente a uma conversão, para sugestões do compactador. Uma etapa autorizada pode consumir sua própria atribuição, respeitando proteções manuais. Não há movimentação automática de personagem ou de acessórios.

background/forgeNotifications.ts serializa atualizações de alarmes e armazena apenas item, prazo, aba e status de entrega. Identificadores distinguem tarefas iguais, o ledger impede avisos repetidos, nova leitura cancela tarefas removidas e inicialização restaura alarmes ausentes. Alarmes/notificações são permissões opcionais. Um prazo salvo é um lembrete, não uma consulta autenticada em segundo plano.

update/updateState.ts compartilha consultas e cache de seis horas. UpdateBanner mostra novidades sem aplicar código sozinho. O instalador aceita apenas as duas permissões opcionais previstas; novas permissões ou hosts exigem revisão manual.
