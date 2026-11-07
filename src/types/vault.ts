export type EntryKind = "thought" | "letter" | "reflection";
export interface Entry {
  id: string;
  kind: EntryKind;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  prompt?: string;
}
export interface Star {
  id: string;
  entryId: string;
  x: number;
  y: number;
  theme: string;
  createdAt: string;
}
export interface Connection {
  id: string;
  source: string;
  target: string;
  label: string;
}
export interface VaultData {
  version: 1;
  entries: Entry[];
  drafts: Entry[];
  nodes: Star[];
  edges: Connection[];
  migratedIds: string[];
}
export interface Envelope {
  format: "unsaid-vault";
  version: 1;
  kdf: "PBKDF2-SHA256";
  iterations: 600000;
  salt: string;
  iv: string;
  ciphertext: string;
  revision: number;
}
export const emptyVault = (): VaultData => ({
  version: 1,
  entries: [],
  drafts: [],
  nodes: [],
  edges: [],
  migratedIds: [],
});
export function newEntry(
  kind: EntryKind,
  id: string = crypto.randomUUID(),
  parentId?: string,
  prompt?: string,
): Entry {
  const now = new Date().toISOString();
  return {
    id,
    kind,
    title: "",
    body: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...(parentId ? { parentId } : {}),
    ...(prompt ? { prompt } : {}),
  };
}
