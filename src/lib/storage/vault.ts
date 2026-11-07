import { openDB, type DBSchema } from "idb";
import type { Envelope } from "../../types/vault";
import { validateEnvelope } from "../validation/vault";
interface VaultDB extends DBSchema {
  vault: { key: string; value: Envelope };
}
const database = () =>
  openDB<VaultDB>("unsaid-encrypted", 1, {
    upgrade(db) {
      db.createObjectStore("vault");
    },
  });
export async function readVault() {
  const db = await database();
  try {
    const value = await db.get("vault", "primary");
    return value ? validateEnvelope(value) : undefined;
  } finally {
    db.close();
  }
}
export async function writeVault(
  envelope: Envelope,
  expectedRevision: number | null,
) {
  const db = await database();
  const tx = db.transaction("vault", "readwrite");
  try {
    const existing = await tx.store.get("primary");
    if ((existing?.revision ?? null) !== expectedRevision) {
      tx.abort();
      await tx.done.catch(() => {});
      throw new Error(
        "The vault changed in another tab. Lock and unlock here before continuing. Your last change was not saved.",
      );
    }
    await tx.store.put(envelope, "primary");
    await tx.done;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* Transaction may already have completed or aborted. */
    }
    await tx.done.catch(() => {});
    throw error;
  } finally {
    db.close();
  }
}
export async function eraseVault(expectedRevision: number) {
  const db = await database();
  const tx = db.transaction("vault", "readwrite");
  try {
    const current = await tx.store.get("primary");
    if (current?.revision !== expectedRevision) {
      tx.abort();
      await tx.done.catch(() => {});
      throw new Error(
        "The vault changed in another tab. Reload before clearing data.",
      );
    }
    await tx.store.clear();
    await tx.done;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* Transaction may already have completed or aborted. */
    }
    await tx.done.catch(() => {});
    throw error;
  } finally {
    db.close();
  }
}
