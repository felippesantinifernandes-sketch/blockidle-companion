export const pageNames=['Visão Geral','Terminal','Venda','Bazar','Grupos','Automações','Personagem','Progressão','Crafts','Jogo','Histórico','Eventos','Novidades','Configurações'];
export function orderedNames(saved:string[]){return [...new Set([...saved.filter(n=>pageNames.includes(n)),...pageNames])];}
