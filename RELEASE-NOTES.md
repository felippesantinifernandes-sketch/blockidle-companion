# Blockidle Companion 0.4.0

- Meus objetivos: cadeias completas de receitas publicadas, quantidade final, prioridades, pausa e estoque compartilhado sem dupla atribuição.
- Etapas de craft/forja/compactação/lapidação revisadas individualmente, com retirada só do faltante e nova conferência de estoque e fila antes de executar.
- Quantidade exata na compactação de objetivos; lapidação bloqueia excedentes que a operação nativa consumiria.
- Faltantes vinculados às regiões, sugestões de filtros e revisão para desativar filtros conflitantes, preservando ingredientes diretos.
- Recomendações de acessórios pelo ganho efetivo de Poder Mágico e materiais disponíveis, considerando famílias e recombobulação.
- Alarmes opcionais da forja, com prazo salvo, cancelamento em nova leitura e retomada depois de reiniciar o navegador.
- Aviso de nova versão ao abrir o painel, novidades e central de atualização.
- Preferências antigas migradas sem remover tema, grupos, reservas ou histórico.

Se já usa a 0.3, abra Configurações → Central de atualização → Verificar versões. Prepare o pacote, autorize a mesma pasta instalada e aplique. Em instalações mais antigas, substitua os arquivos na mesma pasta e recarregue a extensão; não a remova. Os avisos da forja só pedem novas permissões quando forem ativados.

Os fluxos do jogo foram testados com cliente/endpoints simulados. Não houve movimentação na conta real. Alarmes e retorno da API de notificações foram verificados no Chromium; a janela humana de permissão e a exibição visual do aviso pelo Windows não foram automatizadas. Confira RESULTADO-DOS-TESTES.md.
