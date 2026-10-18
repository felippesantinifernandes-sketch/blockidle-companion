export const observedBuild = 'ef3c8efa9f';
export const compatibility = (build?: string) => !build ? 'Build não disponível; compatibilidade não confirmada.' : build === observedBuild ? 'Build citado no documento. Ações manuais disponíveis para o adaptador conhecido.' : 'Nova versão do Blockidle identificada. Verifique a compatibilidade da API Ações no jogo suspensas até validar o adaptador.';
