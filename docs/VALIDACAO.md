# Validação 0.3.0

As fontes públicas do jogo e a wiki foram consultadas em 18/10/2026. A wiki tem data-base anterior a algumas alterações do cliente; custos e requisitos atuais são confrontados novamente antes de executar. O catálogo reúne 462 receitas (131 mesa, 158 SkyBlock, 141 armaduras, 32 forja) e 61 acessórios vinculados à wiki, além dos modelos e transformações anteriores.

A suíte unitária cobre estoques físicos, formatos, busca, capacidade, proteção, reservas, perfis, regiões, importação offline, desbloqueios, comparação de origens, plano de retirada, cálculo da Forja Rápida, rank ativo, famílias de acessórios e integridade/instalação de ZIPs. Um diagnóstico local opcional pode ser fornecido por variável de ambiente; seu conteúdo não é copiado para o projeto.

As verificações de navegador carregam a extensão real em perfis descartáveis, com cliente e endpoints simulados. Cobrem fluxo MAIN → worker → painel, ações nativas antigas, retirada apenas do faltante, interrupção em parcial, estoque alterado, requisitos de coleção, SkyBlock com saco/bolsas, tarefa da forja e prazo, atualização por clique e avisos flutuantes. Layouts estreitos e erros JavaScript são inspecionados.

O atualizador usa APIs reais de arquivos do navegador em uma pasta OPFS isolada de teste, com seletor de pasta substituído pelo teste. Confere gravação, preferências preservadas, autorização persistida e recusa de pacote adulterado. O seletor nativo é exposto na página da extensão; a interação humana com a janela de autorização de uma pasta do Windows não é automatizada nesse ensaio. A pasta pessoal da extensão não foi alterada.

**Não houve transação na conta real nem homologação autenticada do servidor.** Chrome/Chromium foi testado; Edge não foi homologado separadamente. O servidor continua responsável por acesso, desbloqueios e limites. Alguns dados ausentes ficam como Não informado. Build desconhecido suspende escrita. Drops não publicados não são garantidos, e Cobre/Vazio têm lacunas sinalizadas. Resultados finais e contagens estão em RESULTADO-DOS-TESTES.md.
