import { beforeEach, describe, expect, it } from "vitest";
import { openDB } from "idb";
import { emptyVault, newEntry } from "../src/types/vault";
import { createEnvelope, openEnvelope, seal } from "../src/lib/crypto/vault";
import { VaultSession } from "../src/lib/storage/session";
import { readVault, writeVault } from "../src/lib/storage/vault";
import {
  keepEntry,
  putDraft,
  removeEntry,
  connectStars,
} from "../src/domain/operations";
import {
  clearLegacy,
  mergeLegacy,
  readLegacy,
} from "../src/lib/storage/legacy";
import { validateData, validateEnvelope } from "../src/lib/validation/vault";
const pass = "fictional sample passphrase";
beforeEach(async () => {
  const db = await openDB("unsaid-encrypted", 1, {
    upgrade(d) {
      d.createObjectStore("vault");
    },
  });
  await db.clear("vault");
  db.close();
  await clearLegacy();
});
describe("authenticated vault cryptography", () => {
  it("round trips writing and metadata without persisting plaintext or keys", async () => {
    const data = emptyVault();
    keepEntry(data, {
      ...newEntry("thought"),
      title: "Fictional test",
      body: "Private sample words",
      tags: ["sample"],
    });
    const session = await VaultSession.create(data, pass);
    const raw = await readVault();
    expect(JSON.stringify(raw)).not.toContain("Private sample words");
    expect(JSON.stringify(raw)).not.toContain("Fictional test");
    expect(JSON.stringify(raw)).not.toContain(pass);
    const reopened = await VaultSession.unlock(pass);
    expect(reopened.data).toEqual(data);
    await session.lock();
    await expect(session.backup()).rejects.toThrow("locked");
  });
  it("uses random salts and fresh nonces with a non-extractable key", async () => {
    const first = await createEnvelope(emptyVault(), pass);
    const second = await createEnvelope(emptyVault(), pass);
    expect(first.envelope.salt).not.toBe(second.envelope.salt);
    expect(first.key.extractable).toBe(false);
    const rewritten = await seal(
      emptyVault(),
      first.key,
      first.envelope.salt,
      2,
    );
    expect(first.envelope.iv).not.toBe(rewritten.iv);
    expect(first.envelope.ciphertext).not.toBe(rewritten.ciphertext);
  });
  it("rejects wrong passphrases and tampered ciphertext", async () => {
    const { envelope } = await createEnvelope(emptyVault(), pass);
    await expect(openEnvelope(envelope, "wrong passphrase")).rejects.toThrow(
      "Could not unlock",
    );
    const bytes = Uint8Array.from(atob(envelope.ciphertext), (c) =>
      c.charCodeAt(0),
    );
    bytes[5] ^= 1;
    const damaged = {
      ...envelope,
      ciphertext: btoa(String.fromCharCode(...bytes)),
    };
    await expect(openEnvelope(damaged, pass)).rejects.toThrow(
      "Could not unlock",
    );
  });
  it("rejects weak passphrases and unsupported backup parameters", async () => {
    await expect(createEnvelope(emptyVault(), "short")).rejects.toThrow(
      "12 characters",
    );
    expect(() =>
      validateEnvelope({ format: "unsaid-vault", iterations: 999999999 }),
    ).toThrow("compatible");
  });
});
describe("vault persistence and lifecycle", () => {
  it("recovers encrypted drafts after opening a fresh session", async () => {
    const session = await VaultSession.create(emptyVault(), pass);
    const draft = { ...newEntry("letter"), body: "A fictional unsent letter" };
    await session.mutate((d) => putDraft(d, draft));
    await session.lock();
    const reopened = await VaultSession.unlock(pass);
    expect(reopened.data.drafts[0].body).toBe(draft.body);
    expect(reopened.data.entries).toHaveLength(0);
  });
  it("serializes rapid writes and saves a letter without duplicating stars", async () => {
    const session = await VaultSession.create(emptyVault(), pass);
    const letter = { ...newEntry("letter"), body: "Fictional letter" };
    await Promise.all([
      session.mutate((d) => putDraft(d, { ...letter, body: "First" })),
      session.mutate((d) => putDraft(d, letter)),
    ]);
    await session.mutate((d) => keepEntry(d, letter));
    await session.mutate((d) =>
      keepEntry(d, { ...letter, body: "Edited fictional letter" }),
    );
    expect(session.data.entries).toHaveLength(1);
    expect(session.data.nodes).toHaveLength(1);
    expect(session.data.drafts).toHaveLength(0);
    expect((await VaultSession.unlock(pass)).data.entries[0].body).toBe(
      "Edited fictional letter",
    );
  });
  it("exports and imports an encrypted backup, rejecting invalid imports without replacement", async () => {
    const session = await VaultSession.create(emptyVault(), pass);
    const entry = { ...newEntry("thought"), body: "Fictional export" };
    await session.mutate((d) => keepEntry(d, entry));
    const text = await session.backup();
    expect(text).not.toContain("Fictional export");
    await session.mutate((d) => removeEntry(d, entry.id));
    await expect(
      session.importBackup(JSON.parse(text), "incorrect"),
    ).rejects.toThrow();
    expect(session.data.entries).toHaveLength(0);
    await session.importBackup(JSON.parse(text), pass);
    expect(session.data.entries[0].body).toBe(entry.body);
  });
  it("changes passphrase with a fresh salt while older backups keep their original passphrase", async () => {
    const session = await VaultSession.create(emptyVault(), pass);
    const backup = JSON.parse(await session.backup());
    await expect(
      session.changePassphrase("wrong", "new fictional passphrase"),
    ).rejects.toThrow();
    await session.changePassphrase(pass, "new fictional passphrase");
    await expect(VaultSession.unlock(pass)).rejects.toThrow();
    expect(
      (await VaultSession.unlock("new fictional passphrase")).data,
    ).toEqual(emptyVault());
    expect((await readVault())?.salt).not.toBe(backup.salt);
    expect((await openEnvelope(backup, pass)).data).toEqual(emptyVault());
  });
  it("prevents stale tabs from overwriting newer changes", async () => {
    const one = await VaultSession.create(emptyVault(), pass);
    const two = await VaultSession.unlock(pass);
    await one.mutate((d) =>
      keepEntry(d, { ...newEntry("thought"), body: "Newer version" }),
    );
    await expect(
      two.mutate((d) =>
        keepEntry(d, { ...newEntry("thought"), body: "Stale version" }),
      ),
    ).rejects.toThrow("another tab");
    expect((await VaultSession.unlock(pass)).data.entries[0].body).toBe(
      "Newer version",
    );
    await expect(two.lock()).rejects.toThrow("not been saved");
    await two.lock(true);
    expect(two.data.entries).toHaveLength(0);
  });
  it("refuses a second creation and can explicitly erase all vault data", async () => {
    const session = await VaultSession.create(emptyVault(), pass);
    const value = await readVault();
    await expect(writeVault(value!, null)).rejects.toThrow("another tab");
    await session.erase();
    expect(await readVault()).toBeUndefined();
    await expect(session.backup()).rejects.toThrow("locked");
  });
});
describe("integrated domain graph and reflections", () => {
  it("creates stars, moves them, names themes, connects and disconnects", () => {
    const data = emptyVault();
    const a = { ...newEntry("thought"), body: "Fictional first" };
    const b = { ...newEntry("letter"), body: "Fictional second" };
    keepEntry(data, a);
    keepEntry(data, b);
    data.nodes[0].x = 250;
    data.nodes[0].theme = "Fictional theme";
    connectStars(data, {
      id: "edge",
      source: a.id,
      target: b.id,
      label: "My link",
    });
    expect(validateData(data).nodes[0].x).toBe(250);
    expect(() =>
      connectStars(data, {
        id: "duplicate",
        source: b.id,
        target: a.id,
        label: "",
      }),
    ).toThrow("already");
    expect(() =>
      connectStars(data, { id: "self", source: a.id, target: a.id, label: "" }),
    ).toThrow("different");
    data.edges = [];
    expect(validateData(data).edges).toHaveLength(0);
  });
  it("removes associated drafts, reflection responses, stars and edges on deletion", () => {
    const data = emptyVault();
    const a = { ...newEntry("thought"), body: "Parent" };
    const b = { ...newEntry("letter"), body: "Retained" };
    const reflection = {
      ...newEntry("reflection", undefined, a.id, "Static question"),
      body: "Fictional response",
    };
    keepEntry(data, a);
    keepEntry(data, b);
    keepEntry(data, reflection);
    putDraft(data, a);
    connectStars(data, { id: "edge", source: a.id, target: b.id, label: "" });
    removeEntry(data, a.id);
    expect(data.entries.map((e) => e.id)).toEqual([b.id]);
    expect(data.drafts).toHaveLength(0);
    expect(data.edges).toHaveLength(0);
    expect(data.nodes).toHaveLength(1);
    expect(validateData(data)).toBe(data);
  });
  it("rejects empty writing, dangling graph edges, and orphan reflections", () => {
    const data = emptyVault();
    expect(() => keepEntry(data, newEntry("thought"))).toThrow(
      "Write a little",
    );
    data.edges = [{ id: "bad", source: "missing", target: "other", label: "" }];
    expect(() => validateData(data)).toThrow("connections");
    data.edges = [];
    data.entries = [
      { ...newEntry("reflection", undefined, "missing"), body: "Fictional" },
    ];
    expect(() => validateData(data)).toThrow("missing writing");
  });
});
describe("explicit legacy migration", () => {
  it("reads legacy plaintext without modifying it, encrypts it, then clears only after confirmation flow", async () => {
    const db = await openDB("unsaid-writing", 1, {
      upgrade(d) {
        d.createObjectStore("thoughts", { keyPath: "id" });
        d.createObjectStore("drafts");
      },
    });
    const now = new Date().toISOString();
    await db.put("thoughts", {
      id: "old",
      title: "Fictional legacy",
      body: "Legacy sample",
      tags: ["old"],
      createdAt: now,
      updatedAt: now,
    });
    await db.put(
      "drafts",
      {
        entryId: "old",
        title: "Draft",
        body: "Unfinished legacy sample",
        tags: "sample",
        updatedAt: now,
      },
      "current",
    );
    db.close();
    const old = await readLegacy();
    expect(old.thoughts).toHaveLength(1);
    expect((await readLegacy()).draft).toBeDefined();
    const data = emptyVault();
    mergeLegacy(data, old);
    mergeLegacy(data, old);
    expect(data.entries).toHaveLength(1);
    expect(data.drafts).toHaveLength(1);
    expect(data.entries[0].updatedAt).toBe(now);
    expect(data.drafts[0].updatedAt).toBe(now);
    const session = await VaultSession.create(data, pass);
    expect((await VaultSession.unlock(pass)).data.drafts[0].body).toBe(
      "Unfinished legacy sample",
    );
    expect((await readLegacy()).thoughts).toHaveLength(1);
    await clearLegacy();
    expect((await readLegacy()).thoughts).toHaveLength(0);
    expect(session.data.nodes).toHaveLength(1);
  });
});

it("refuses to clear legacy records changed after a migration snapshot", async () => {
  const db = await openDB("unsaid-writing", 1, {
    upgrade(d) {
      d.createObjectStore("thoughts", { keyPath: "id" });
      d.createObjectStore("drafts");
    },
  });
  const now = new Date().toISOString();
  const entry = {
    id: "changed-legacy",
    title: "Fictional",
    body: "Before",
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.put("thoughts", entry);
  const snapshot = await readLegacy();
  await db.put("thoughts", {
    ...entry,
    body: "Changed fictional source",
    updatedAt: new Date(Date.now() + 1000).toISOString(),
  });
  db.close();
  await expect(clearLegacy(snapshot)).rejects.toThrow("changed in another tab");
  expect((await readLegacy()).thoughts[0].body).toBe(
    "Changed fictional source",
  );
});
