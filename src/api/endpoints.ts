/** Documented endpoints are catalogued, but no mutating transport is shipped. */
export const supportedReads = ['/api/estado'] as const;
export const mutationsEnabled = false;
export const pendingValidation = ['/api/armazem', '/api/autocompactar', '/api/vender', '/api/craftar', 'terminal_juntar'] as const;
