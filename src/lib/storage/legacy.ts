import { openDB } from "idb";
import type { Thought, Draft } from "../../types/writing";
import type { VaultData } from "../../types/vault";
import { keepEntry, putDraft } from "../../domain/operations";
export interface LegacyData {
  thoughts: Thought[];
  draft?: Draft;
}
async function legacyDB() {
  if (
    indexedDB.databases &&
    !(await indexedDB.databases()).some((d) => d.name === "unsaid-writing")
  )
    return null;
  try {
    return await openDB("unsaid-writing", 1, {
      upgrade(_db, old, _new, tx) {
        if (old === 0) tx.abort();
      },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    throw e;
  }
}
export async function readLegacy(): Promise<LegacyData> {
  const db = await legacyDB();
  if (!db) return { thoughts: [] };
  try {
    return {
      thoughts: await db.getAll("thoughts"),
      draft: await db.get("drafts", "current"),
    };
  } finally {
    db.close();
  }
}
export function mergeLegacy(data: VaultData, legacy: LegacyData) {
  for (const old of legacy.thoughts) {
    const migrationId = `legacy:${old.id}:${old.updatedAt}`;
    if (data.migratedIds.includes(migrationId)) continue;
    const id = data.entries.some((e) => e.id === old.id)
      ? crypto.randomUUID()
      : old.id;
    keepEntry(data, { ...old, id, kind: "thought" });
    data.entries.find((entry) => entry.id === id)!.updatedAt = old.updatedAt;
    data.migratedIds.push(migrationId);
  }
  if (
    legacy.draft &&
    !data.migratedIds.includes(`legacy:current-draft:${legacy.draft.updatedAt}`)
  ) {
    const d = legacy.draft;
    putDraft(data, {
      id: crypto.randomUUID(),
      kind: "thought",
      title: d.title,
      body: d.body,
      tags: d.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: d.updatedAt,
      updatedAt: d.updatedAt,
    });
    data.drafts[data.drafts.length - 1].updatedAt = d.updatedAt;
    data.migratedIds.push(`legacy:current-draft:${d.updatedAt}`);
  }
}
export async function clearLegacy(expected?: LegacyData) {
  const db = await legacyDB();
  if (!db) return;
  try {
    const tx = db.transaction(["thoughts", "drafts"], "readwrite");
    if (expected) {
      const current = {
        thoughts: await tx.objectStore("thoughts").getAll(),
        draft: await tx.objectStore("drafts").get("current"),
      };
      if (JSON.stringify(current) !== JSON.stringify(expected)) {
        tx.abort();
        await tx.done.catch(() => {});
        throw new Error(
          "Earlier writing changed in another tab. Plaintext records were preserved. Close the older app tab and retry migration.",
        );
      }
    }
    await tx.objectStore("thoughts").clear();
    await tx.objectStore("drafts").clear();
    await tx.done;
  } finally {
    db.close();
  }
}
