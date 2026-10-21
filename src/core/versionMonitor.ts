export const observedBuild = 'ef3c8efa9f';
export const operationsBuild = '6b899075fb';
/** Only reviewed filters and sale contracts are enabled on the newer client. */
export const supportsCommandBuild=(build:string|undefined,kind:string)=>build===observedBuild||(build===operationsBuild&&['compactor','profile','sell'].includes(kind));
export const compatibility = (build?: string) => !build ? 'Build não disponível; compatibilidade não confirmada.' : build === observedBuild ? 'Build anterior validado para as ações do adaptador.' : build===operationsBuild?'Filtros do compactador e vendas por excedente revisados para este build. Crafts e outras transações aguardam validação das receitas atuais.':'Nova versão do Blockidle identificada. Ações suspensas até validar o adaptador.';
