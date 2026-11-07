import type { Entry, Envelope, VaultData } from "../../types/vault";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 2_000_000;
const arr = (v: unknown): v is unknown[] =>
  Array.isArray(v) && v.length <= 20000;
function entry(v: unknown): v is Entry {
  return (
    object(v) &&
    str(v.id) &&
    v.id.length > 0 &&
    ["thought", "letter", "reflection"].includes(v.kind as string) &&
    str(v.title) &&
    str(v.body) &&
    arr(v.tags) &&
    v.tags.every(str) &&
    str(v.createdAt) &&
    Number.isFinite(Date.parse(v.createdAt)) &&
    str(v.updatedAt) &&
    Number.isFinite(Date.parse(v.updatedAt)) &&
    (v.parentId === undefined || str(v.parentId)) &&
    (v.prompt === undefined || str(v.prompt))
  );
}
export function validateData(v: unknown): VaultData {
  if (
    !object(v) ||
    v.version !== 1 ||
    !arr(v.entries) ||
    !v.entries.every(entry) ||
    !arr(v.drafts) ||
    !v.drafts.every(entry) ||
    !arr(v.nodes) ||
    !arr(v.edges) ||
    !arr(v.migratedIds) ||
    !v.migratedIds.every(str)
  )
    throw new Error("This vault contains an unsupported data structure.");
  const data = v as unknown as VaultData;
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  if (
    !unique(data.entries.map((e) => e.id)) ||
    !unique(data.drafts.map((e) => e.id))
  )
    throw new Error("Duplicate entry identifiers in backup.");
  const ids = new Set(data.entries.map((e) => e.id));
  if (
    [...data.entries, ...data.drafts].some(
      (e) => e.kind === "reflection" && (!e.parentId || !e.prompt),
    )
  )
    throw new Error(
      "A reflection references missing writing or a missing question.",
    );
  if (
    [...data.entries, ...data.drafts].some(
      (e) =>
        e.parentId &&
        data.entries.find((parent) => parent.id === e.parentId)?.kind ===
          "reflection",
    )
  )
    throw new Error("A reflection must reference a thought or a letter.");
  if (
    [...data.entries, ...data.drafts].some(
      (e) => e.parentId && (!ids.has(e.parentId) || e.parentId === e.id),
    )
  )
    throw new Error("A reflection references missing writing.");
  if (
    data.nodes.length !== data.entries.length ||
    !data.nodes.every(
      (n) =>
        object(n) &&
        str(n.id) &&
        n.id === n.entryId &&
        ids.has(n.entryId) &&
        str(n.theme) &&
        str(n.createdAt) &&
        Number.isFinite(Date.parse(n.createdAt)) &&
        Number.isFinite(n.x) &&
        Number.isFinite(n.y) &&
        Math.abs(n.x) <= 1e7 &&
        Math.abs(n.y) <= 1e7,
    ) ||
    !unique(data.nodes.map((n) => n.id)) ||
    !unique(data.nodes.map((n) => n.entryId))
  )
    throw new Error("Invalid constellation stars.");
  const nodes = new Set(data.nodes.map((n) => n.id));
  if (
    !data.edges.every(
      (e) =>
        object(e) &&
        str(e.id) &&
        nodes.has(e.source) &&
        nodes.has(e.target) &&
        e.source !== e.target &&
        str(e.label),
    ) ||
    !unique(data.edges.map((e) => e.id)) ||
    !unique(data.edges.map((e) => JSON.stringify([e.source, e.target].sort())))
  )
    throw new Error("Invalid constellation connections.");
  return data;
}
export function validateEnvelope(v: unknown): Envelope {
  if (
    !object(v) ||
    v.format !== "unsaid-vault" ||
    v.version !== 1 ||
    v.kdf !== "PBKDF2-SHA256" ||
    v.iterations !== 600000 ||
    !Number.isSafeInteger(v.revision) ||
    (v.revision as number) < 1 ||
    !str(v.salt) ||
    !str(v.iv) ||
    typeof v.ciphertext !== "string" ||
    v.ciphertext.length > 28_000_000 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(v.ciphertext)
  )
    throw new Error("This is not a compatible UNSAID backup.");
  try {
    if (
      atob(v.salt).length !== 16 ||
      atob(v.iv).length !== 12 ||
      atob(v.ciphertext).length < 16
    )
      throw new Error();
  } catch {
    throw new Error("Invalid backup encoding.");
  }
  return v as unknown as Envelope;
}
export function validatePassphrase(passphrase: string) {
  if (passphrase.length < 12)
    throw new Error(
      "Use at least 12 characters. A few unrelated words work well.",
    );
  if (passphrase.length > 1024)
    throw new Error("Please use a passphrase shorter than 1,025 characters.");
}
