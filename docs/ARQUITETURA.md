# Arquitetura 0.3.0

O observador projeta respostas de /api/estado em campos permitidos e o worker lê também o HUD oficial. A leitura comum não cria sessão nem faz GET adicional. O clique é processado antes da releitura, preservando checkboxes controlados. Ações usam revisão, exclusão mútua e aplicação imediata do estado retornado; leituras concorrentes não substituem resultados recentes.

Comandos só são aceitos de páginas da própria extensão, com schema Zod estrito, aba ativa, escopo, build e proteções revalidados. Mensagens da página não executam escrita. As funções MAIN são autocontidas e usam somente módulos oficiais previamente carregados na mesma instância ESM. Uma consulta limitada confirma o build antes da ação. Cookies de autenticação ficam sob gestão do navegador, sem leitura/exportação.

A bancada utiliza craftRecipes estático com custos, fonte, rendimento, padrões e requisitos. O worker encontra a receita por ID e envia a especificação do catálogo, nunca uma receita arbitrária da página. O executor compara custos e requisitos com os módulos vivos, confere o estoque revisado, valida a soma das retiradas e comprova cada saldo. Interrompe em retirada parcial. Só depois envia craftar, sb_craft, arm_craft ou início de forja. Confirma saída física/equipada, entrada na fila ou nova tarefa com prazo, conforme a operação.

A bolsa de acessórios permanece fora do estoque físico. O normalizador disponibiliza um mapa separado para posse e ativação. O cálculo considera maior grau da família, raridade, recombobulação e Hegemonia; o valor do jogo é a referência final.

As preferências continuam na chave v1, com migração compatível. Snapshots em IndexedDB têm limite de 200; histórico de ações locais, 100. A intenção de operação é persistida em chrome.storage.session antes da execução. Resultado desconhecido bloqueia até consulta explícita de reconciliação. Não há repetição automática.

O atualizador abre uma página própria para o seletor de pasta. Consulta Releases do repositório fixo sem autenticação; verifica SHA-256, CRC, tamanho, versão, caminhos e manifesto. Confere a pasta pelo manifesto e código instalado. Grava ativos e depois o manifesto, conserva originais em memória para restauração se houver falha e solicita chrome.runtime.reload ao concluir. Não lê nem regrava preferências. A autorização de pasta pode ser persistida como FileSystemDirectoryHandle em IndexedDB, sujeita à política do navegador.

O catálogo e o adaptador não são atualizados por JSON remoto durante ações. Uma nova versão só entra após confirmação do usuário. A consulta periódica da wiki compara somente a data-base. Coleta pública usa análise sintática e interpretação restrita de dados, sem executar os módulos remotos obtidos.
