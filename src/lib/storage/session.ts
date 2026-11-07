import { emptyVault, type Envelope, type VaultData } from "../../types/vault";
import { createEnvelope, openEnvelope, seal } from "../crypto/vault";
import { eraseVault, readVault, writeVault } from "./vault";
import { validateEnvelope } from "../validation/vault";
export class VaultSession {
  private tail: Promise<void> = Promise.resolve();
  private closed = false;
  private failedWrite = false;
  get unsaved() {
    return this.failedWrite;
  }
  constructor(
    private key: CryptoKey | null,
    public data: VaultData,
    private envelope: Envelope,
  ) {}
  static async create(data: VaultData, passphrase: string) {
    const { key, envelope } = await createEnvelope(data, passphrase);
    await writeVault(envelope, null);
    return new VaultSession(key, data, envelope);
  }
  static async unlock(passphrase: string) {
    const envelope = await readVault();
    if (!envelope) throw new Error("No local vault was found.");
    const result = await openEnvelope(envelope, passphrase);
    return new VaultSession(result.key, result.data, envelope);
  }
  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(() => {
      if (this.closed || !this.key) throw new Error("Your vault is locked.");
      return work();
    });
    this.tail = result.then(
      () => {},
      () => {},
    );
    return result;
  }
  mutate(change: (data: VaultData) => void) {
    return this.enqueue(async () => {
      const next = structuredClone(this.data);
      change(next);
      try {
        const envelope = await seal(
          next,
          this.key!,
          this.envelope.salt,
          this.envelope.revision + 1,
        );
        await writeVault(envelope, this.envelope.revision);
        this.envelope = envelope;
        this.data = next;
        this.failedWrite = false;
      } catch (error) {
        this.failedWrite = true;
        throw error;
      }
      return next;
    });
  }
  backup() {
    return this.enqueue(async () => JSON.stringify(this.envelope, null, 2));
  }
  backupSelection(id: string) {
    return this.enqueue(async () => {
      const data = emptyVault();
      const ids = new Set([id]);
      const selected = this.data.entries.find((e) => e.id === id);
      if (!selected) throw new Error("Writing not found.");
      if (selected.parentId) ids.add(selected.parentId);
      data.entries = this.data.entries.filter((e) => ids.has(e.id));
      data.nodes = this.data.nodes.filter((n) => ids.has(n.entryId));
      return JSON.stringify(
        await seal(data, this.key!, this.envelope.salt, 1),
        null,
        2,
      );
    });
  }
  changePassphrase(current: string, next: string) {
    return this.enqueue(async () => {
      await openEnvelope(this.envelope, current);
      const result = await createEnvelope(this.data, next);
      const envelope = {
        ...result.envelope,
        revision: this.envelope.revision + 1,
      };
      await writeVault(envelope, this.envelope.revision);
      this.envelope = envelope;
      this.key = result.key;
    });
  }
  importBackup(input: unknown, passphrase: string) {
    return this.enqueue(async () => {
      const backup = validateEnvelope(input);
      const result = await openEnvelope(backup, passphrase);
      const envelope = await seal(
        result.data,
        this.key!,
        this.envelope.salt,
        this.envelope.revision + 1,
      );
      await writeVault(envelope, this.envelope.revision);
      this.envelope = envelope;
      this.data = result.data;
      return this.data;
    });
  }
  erase() {
    return this.enqueue(async () => {
      await eraseVault(this.envelope.revision);
      this.closed = true;
      this.key = null;
      this.data = emptyVault();
      this.failedWrite = false;
    });
  }
  async lock(discard = false) {
    await this.tail;
    if (this.failedWrite && !discard)
      throw new Error(
        "A change has not been saved. Copy or save it before locking, or explicitly discard it.",
      );
    this.closed = true;
    this.key = null;
    this.data = {
      version: 1,
      entries: [],
      drafts: [],
      nodes: [],
      edges: [],
      migratedIds: [],
    };
  }
}
