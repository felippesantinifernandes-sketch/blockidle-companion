# Formatos de leitura

## Confirmados no cliente público em 18/10/2026

A resposta de estado pode vir em { versao, estado }. O adaptador também aceita o objeto de estado diretamente ao importar JSON.

- inventario: mapa de ID de item para quantidade inteira não negativa.
- guardado: mapa de armazenamento para mapa de itens.
- base: mapa de coordenada x,y,z para ID do bloco. Tipos de baú: chest (27), chest_iron (54), chest_gold (81), chest_diamond (108) e chest_netherite (135).
- O ID de armazenamento do baú é bau:x,y,z. Baús vazios são preservados mesmo sem guardado correspondente.
- bauRotulo e bausGolem usam x,y,z, sem bau:.
- guardado.ender: conteúdo do Baú do Ender.
- guardado.bolsa0, bolsa1 etc.: conteúdos das bolsas. bolsas é o array dos níveis de cada bolsa; null indica ausência. Níveis 0 a 4 possuem 9, 18, 27, 36 e 45 slots.
- guardado.saco: conteúdo físico compartilhado entre os sacos. Não multiplicar pelo número de sacos. sacos e sacosN são metadados, não outro estoque.
- guardado com prefixo fazenda: contém os baús da fazenda reconhecidos.
- guardado.banco, aljava, acessorios e quaisquer formatos não reconhecidos são omitidos dos totais até validar sua elegibilidade. O diagnóstico informa a omissão.
- colecoes, progressos, habilidades, anas, minions e forja são dados de progressão; não são somados ao estoque. Estoque de minions aguarda mapeamento próprio de saída de cada tipo.

Números fracionários, negativos, infinitos, strings de quantidade e objetos de item com formato individual desconhecido não são convertidos silenciosamente. O restante do estado continua disponível e o diagnóstico lista os campos omitidos.

## Compatibilidade adicional

O normalizador também reconhece arrays de blocos com coordenadas explícitas e campos tipo/t/id/type; esses formatos alternativos estão cobertos somente por validação local, sem confirmação em HAR. Só IDs de baú explícitos entram na descoberta. Outros blocos nunca se tornam baús por inferência.

## Exemplo mínimo para importação

```json
{
  "versao": "build-observado",
  "estado": {
    "inventario": { "diamond": 7 },
    "base": { "1,0,0": "chest", "2,0,0": "chest_iron" },
    "guardado": { "bau:1,0,0": { "diamond": 3 }, "saco": { "hard_stone": 160 } },
    "bauRotulo": { "1,0,0": "diamond" },
    "bausGolem": ["1,0,0"],
    "colecoes": { "diamond": 9999 }
  }
}
```

O estoque de diamante do exemplo é 10. O segundo baú existe e aparece vazio; a coleção de 9999 diamantes não é estoque.

## Regiões e operações manuais (0.2.0)

camada só identifica região quando area é mina. floresta usa bosque; End ignora uma camada antiga de mina. compactador e autoCompactar pertencem ao estado do personagem, quando presentes. A falta de dados não é substituída por valores supostos.

Comandos aceitos: compactor (itemId, enabled), profile (itemIds), move (direction, storageId, itemId, quantity) e transform (recipeId, expectedBatches). São objetos estritos, sem campos extras ou endpoints arbitrários.

Payloads nativos: autocompactar {id,liga}; compactar {id,vezes:'max'}; armazem {acao:'guardar' ou 'tirar',local,item,qtd,...coordenadas/índice}; lapidar {acao:'lapidar',id:saída}. Não se presume parâmetro de quantidade para lapidação.

Regiões contêm drops com itemId, condition, frequency, source e cobertura. Transformações contêm ingredients, kind, eligibleStorages e sourceDate. A importação aceita tanto {versao,estado} quanto {state:...} do diagnóstico normalizado; sempre resulta em source import, sem aba autorizada para escrita.

A área real de Catacumbas é catacumba (singular). O andar está em dados de grupo não coletados nesta versão; os três modelos são selecionados manualmente. Não se presume andar I nem se usa uma camada antiga de mina como substituta.

## Campos e comandos 0.3.0

O estado projetado inclui fila/alvo de craft, mesa/suporte/ferraria, equipamento anterior, rank (ID e expiração), recomb e poderMagico. guardado.acessorios é disponibilizado em character.accessoryBag, com indicação de presença do campo, sem entrar nos totais físicos.

craft possui recipeId, batches (1..64 para mesa; uma receita para as demais operações), expectedStock e até 24 pulls com origem, item e quantidade. Ouro é separado dos itens físicos. O executor confere o plano e não aceita custo ou endpoint informado pelo chamador.

Payloads: craftar {receita,vezes}; armazem {acao:'sb_craft',id}; armazem {acao:'arm_craft',id}; armazem {acao:'forja',sub:'iniciar',id}. A resposta deve confirmar a fila, a produção/equipamento ou a nova tarefa de forja, além dos saldos aplicáveis.

## Preferências 0.4

O formato de backup continua na versão 1. Campos novos têm defaults: objectives=[], preserveGoalMaterials=true, forgeNotifications=false, updateAlerts=true. Cada objetivo contém id, recipeId, quantity (unidades finais), enabled e choices (receita alternativa por item). Quantidade máxima de 1.000.000, 50 objetivos e IDs únicos. Pausas e prioridades são preservadas.

goalStep: {kind:'goalStep', goalId, stepId, review}. A revisão detecta mudanças; não concede autoridade. O worker sempre reconstrói a etapa a partir das preferências atuais. goalTransform é interno e rejeitado pelo schema externo. Compactação de objetivo usa o payload nativo {id,vezes:n}, enquanto o modo manual anterior continua usando max. Lapidação usa o endpoint nativo existente e exige que seu processamento total corresponda à etapa revisada.

blockidle.forge-alerts.v1 contém um ledger local limitado, com deliveredAt somente após retorno bem-sucedido da API de notificações. Não acompanha backup de preferências nem o repositório. Permissões opcionais não são presumidas a partir de um backup restaurado.
