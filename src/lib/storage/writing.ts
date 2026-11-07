import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Draft, Thought } from "../../types/writing";
interface WritingDatabase extends DBSchema {
  thoughts: { key: string; value: Thought };
  drafts: { key: string; value: Draft };
}
let connection: Promise<IDBPDatabase<WritingDatabase>> | undefined;
function db() {
  connection ??= openDB<WritingDatabase>("unsaid-writing", 1, {
    upgrade(database) {
      database.createObjectStore("thoughts", { keyPath: "id" });
      database.createObjectStore("drafts");
    },
    blocking() {
      void connection?.then((database) => database.close());
      connection = undefined;
    },
    terminated() {
      connection = undefined;
    },
  }).catch((error) => {
    connection = undefined;
    throw error;
  });
  return connection;
}
export async function listThoughts(): Promise<Thought[]> {
  return (await (await db()).getAll("thoughts")).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
export async function saveThought(draft: Draft): Promise<Thought> {
  if (!draft.body.trim())
    throw new Error("Write a little before keeping this thought.");
  const database = await db();
  const tx = database.transaction(["thoughts", "drafts"], "readwrite");
  const existing: Thought | undefined = draft.entryId
    ? await tx.objectStore("thoughts").get(draft.entryId)
    : undefined;
  const now = new Date().toISOString();
  const thought: Thought = {
    id: existing?.id ?? crypto.randomUUID(),
    title: draft.title.trim(),
    body: draft.body,
    tags: [
      ...new Set(
        draft.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await tx.objectStore("thoughts").put(thought);
  await tx.objectStore("drafts").delete("current");
  await tx.done;
  return thought;
}
export async function getDraft(): Promise<Draft | undefined> {
  return (await db()).get("drafts", "current");
}
export async function preserveDraft(draft: Draft) {
  await (await db()).put("drafts", draft, "current");
}
export async function discardDraft() {
  await (await db()).delete("drafts", "current");
}
export async function deleteThought(id: string) {
  const database = await db();
  const tx = database.transaction(["thoughts", "drafts"], "readwrite");
  await tx.objectStore("thoughts").delete(id);
  const draft: Draft | undefined = await tx
    .objectStore("drafts")
    .get("current");
  if (draft?.entryId === id) await tx.objectStore("drafts").delete("current");
  await tx.done;
}
