export const pageNames=['Visão Geral','Terminal','Venda','Grupos','Automações','Personagem','Progressão','Crafts','Jogo','Histórico','Configurações'];
export function orderedNames(saved:string[]){return [...new Set([...saved.filter(n=>pageNames.includes(n)),...pageNames])];}
