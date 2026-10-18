import { executeMutation } from '../api/client';
/** No executable transaction queue exists before real server integration validation. */
export function executeBatch(): never { return executeMutation(); }
