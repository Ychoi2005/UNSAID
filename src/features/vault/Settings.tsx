import { useEffect, useState } from "react";
import { Download, LockKeyhole, Upload } from "lucide-react";
import { useVault } from "../../app/VaultContext";
import { PageTitle, Confirm, download } from "../../components/ui";
import {
  clearLegacy,
  mergeLegacy,
  readLegacy,
  type LegacyData,
} from "../../lib/storage/legacy";
import { validateEnvelope } from "../../lib/validation/vault";
import type { Envelope } from "../../types/vault";
export default function Settings({ onCleared }: { onCleared: () => void }) {
  const { run, mutate, pending, motion, setMotion, idle, setIdle } = useVault();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [backup, setBackup] = useState<Envelope>();
  const [backupPass, setBackupPass] = useState("");
  const [fileName, setFileName] = useState("");
  const [confirm, setConfirm] = useState<"erase" | "import" | "migrate" | null>(
    null,
  );
  const [legacy, setLegacy] = useState<LegacyData>({ thoughts: [] });
  useEffect(() => {
    readLegacy()
      .then(setLegacy)
      .catch(() =>
        setError(
          "Earlier plaintext storage could not be inspected. No migration has been performed.",
        ),
      );
  }, []);
  async function changePass(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (next !== repeat) throw new Error("The new passphrases do not match.");
      await run((s) => s.changePassphrase(current, next));
      setCurrent("");
      setNext("");
      setRepeat("");
      setMessage(
        "Passphrase changed. Previous backup files still use their original passphrase. Export a fresh backup.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Passphrase could not be changed.",
      );
    }
  }
  async function confirmed() {
    setError("");
    setMessage("");
    try {
      if (confirm === "erase") {
        await run(async (s) => {
          await clearLegacy();
          await s.erase();
          await s.lock();
        });
        try {
          localStorage.removeItem("unsaid-motion");
          localStorage.removeItem("unsaid-idle");
        } catch {
          /* Writing has been cleared even if preference storage is unavailable. */
        }
        onCleared();
        return;
      }
      if (confirm === "import") {
        if (!backup) throw new Error("Choose a backup first.");
        await run((s) => s.importBackup(backup, backupPass));
        setBackup(undefined);
        setBackupPass("");
        setFileName("");
        setMessage(
          "Backup imported. It is now protected by this vault’s current passphrase.",
        );
      }
      if (confirm === "migrate") {
        const old = await readLegacy();
        await mutate((d) => mergeLegacy(d, old));
        await clearLegacy(old);
        setLegacy({ thoughts: [] });
        setMessage(
          "Earlier writing was encrypted. The old plaintext records were removed from browser storage; this does not guarantee forensic erasure.",
        );
      }
      setConfirm(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "This operation could not be completed.",
      );
      setConfirm(null);
    }
  }
  return (
    <section className="page settings">
      <PageTitle
        number="07"
        title="Privacy & Settings"
        description="Your words stay here. Your choices stay yours."
      />
      <div className="review-notice">
        <LockKeyhole size={18} />
        <p>
          Encrypted local prototype.{" "}
          <strong>Not independently security-reviewed.</strong> Use fictional,
          non-sensitive writing until the encryption and data-handling controls
          have had an independent review.
        </p>
      </div>
      <section className="settings-section">
        <div>
          <span className="eyebrow">01 / YOUR SPACE</span>
          <h2>A quieter interface.</h2>
        </div>
        <div className="settings-content">
          <label className="setting-toggle">
            <span>
              Decorative motion
              <small>
                System reduced-motion preferences are always respected.
              </small>
            </span>
            <input
              type="checkbox"
              checked={motion}
              onChange={(e) => setMotion(e.target.checked)}
            />
          </label>
          <label className="setting-toggle">
            <span>
              Lock after inactivity
              <small>Lock manually before leaving a shared device.</small>
            </span>
            <select
              value={idle}
              onChange={(e) => setIdle(Number(e.target.value))}
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={0}>Manual only</option>
            </select>
          </label>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <span className="eyebrow">02 / YOUR KEY</span>
          <h2>Change your passphrase.</h2>
          <p>At least 12 characters. No recovery or reset is available.</p>
        </div>
        <form className="settings-content" onSubmit={(e) => void changePass(e)}>
          <label htmlFor="current-pass">Current passphrase</label>
          <input
            id="current-pass"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <label htmlFor="new-pass">New passphrase</label>
          <input
            id="new-pass"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={12}
          />
          <label htmlFor="repeat-pass">Repeat new passphrase</label>
          <input
            id="repeat-pass"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            required
          />
          <button className="button secondary" disabled={!!pending}>
            Change passphrase
          </button>
        </form>
      </section>
      <section className="settings-section">
        <div>
          <span className="eyebrow">03 / A COPY YOU KEEP</span>
          <h2>Backups, in your hands.</h2>
          <p>
            Browser data can be erased or evicted. Keep an encrypted backup
            somewhere you control. Its passphrase is still required.
          </p>
        </div>
        <div className="settings-content">
          <button
            className="button secondary"
            disabled={!!pending}
            onClick={() =>
              void run((s) => s.backup())
                .then((text) => {
                  download(text, "unsaid-vault-backup.json");
                  setMessage(
                    "Encrypted backup exported. Store its passphrase separately.",
                  );
                })
                .catch(() => {})
            }
          >
            <Download size={16} />
            Export encrypted backup
          </button>
          <label className="backup-file">
            Choose encrypted backup
            <input
              aria-label="Choose encrypted backup"
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setError("");
                try {
                  if (file.size > 28_000_000)
                    throw new Error("Backup exceeds the size limit.");
                  const envelope = validateEnvelope(
                    JSON.parse(await file.text()),
                  );
                  setBackup(envelope);
                  setFileName(file.name);
                } catch (err) {
                  setBackup(undefined);
                  setError(
                    err instanceof Error ? err.message : "Invalid backup file.",
                  );
                }
              }}
            />
          </label>
          {backup && (
            <>
              <p className="small-note">{fileName}</p>
              <label htmlFor="backup-pass">Backup passphrase</label>
              <input
                id="backup-pass"
                type="password"
                autoComplete="off"
                value={backupPass}
                onChange={(e) => setBackupPass(e.target.value)}
              />
              <button
                className="button secondary"
                disabled={!!pending || !backupPass}
                onClick={() => setConfirm("import")}
              >
                <Upload size={16} />
                Import & replace vault
              </button>
            </>
          )}
        </div>
      </section>
      {(legacy.thoughts.length > 0 || legacy.draft) && (
        <section className="settings-section migration-section">
          <div>
            <span className="eyebrow">EARLIER WRITING</span>
            <h2>Finish the move.</h2>
            <p>
              Earlier plaintext writing is still present. Migration saves it in
              the encrypted vault before removing the old records. Repeated
              migration skips records already imported.
            </p>
          </div>
          <button
            className="button secondary"
            disabled={!!pending}
            onClick={() => setConfirm("migrate")}
          >
            Migrate earlier writing
          </button>
        </section>
      )}
      <section className="settings-section">
        <div>
          <span className="eyebrow">04 / LETTING GO</span>
          <h2>Clear this browser.</h2>
          <p>
            Deletes this vault and any earlier plaintext writing. Download a
            backup first if you want to keep a copy.
          </p>
        </div>
        <button
          className="text-button danger-text"
          disabled={!!pending}
          onClick={() => setConfirm("erase")}
        >
          Delete all local writing
        </button>
      </section>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="status-note">
          {message}
        </p>
      )}
      <div className="privacy-details">
        <h2>What encryption can’t promise.</h2>
        <p>
          Writing stays in this browser and device. AES-GCM encrypts content and
          metadata at rest; the passphrase and key are not stored. While
          unlocked, content exists in memory and on screen. Malicious
          extensions, compromised devices, injected code, and people using your
          unlocked browser can still expose it.
        </p>
        <p>
          Lost passphrases may make writing unrecoverable. Browser clearing can
          erase it. Deletion cannot guarantee forensic erasure; old backups may
          retain deleted writing and old passphrases. No AI, analytics, remote
          writing storage, or account is used.
        </p>
      </div>
      {confirm && (
        <Confirm
          title={
            confirm === "erase"
              ? "Delete all local writing?"
              : confirm === "import"
                ? "Replace this vault with a backup?"
                : "Encrypt earlier writing?"
          }
          description={
            confirm === "erase"
              ? "This deletes all entries, drafts, letters, reflections, connections and old plaintext records on this browser. It cannot be undone. External backups are not deleted."
              : confirm === "import"
                ? "This replaces the entire current collection and drafts. Export a backup first. The file is verified and decrypted before any replacement is made."
                : "Your earlier writing will be copied into the encrypted vault. After a successful encrypted save, the old plaintext records will be cleared."
          }
          label={
            confirm === "erase"
              ? "Delete everything"
              : confirm === "import"
                ? "Import & replace"
                : "Migrate writing"
          }
          busy={!!pending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void confirmed()}
        />
      )}
    </section>
  );
}
