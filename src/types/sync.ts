export type SyncAction = 'push' | 'pull' | 'sync' | 'read' | 'write' | 'delete';

export interface SyncRequest {
  action: SyncAction;
  table: string;
  data?: Record<string, unknown> | Record<string, unknown>[];
  filters?: Record<string, unknown>;
  id?: string;
}

export interface SyncResult {
  success: boolean;
  data?: unknown[];
  count?: number;
  message?: string;
  pushedToExternal?: number;
  pulledToInternal?: number;
  internalCount?: number;
  externalCount?: number;
  errors?: string[];
}

export interface SyncProgress {
  current: number;
  total: number;
  currentTable?: string;
}
