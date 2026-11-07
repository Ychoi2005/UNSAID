import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, KeyRound, LockKeyhole } from "lucide-react";
import { readVault } from "../../lib/storage/vault";
import {
  clearLegacy,
  mergeLegacy,
  readLegacy,
  type LegacyData,
} from "../../lib/storage/legacy";
import { VaultSession } from "../../lib/storage/session";
import { emptyVault } from "../../types/vault";
import { openEnvelope } from "../../lib/crypto/vault";
import { validateEnvelope } from "../../lib/validation/vault";
export default function Gate({
  onUnlock,
}: {
  onUnlock: (session: VaultSession) => void;
}) {
  const [exists, setExists] = useState<boolean | null>(null);
  const [legacy, setLegacy] = useState<LegacyData>({ thoughts: [] });
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ack, setAck] = useState(false);
  const [migrate, setMigrate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [backup, setBackup] = useState<unknown>();
  const [fileName, setFileName] = useState("");
  const [support, setSupport] = useState(false);
  useEffect(() => {
    Promise.all([readVault(), readLegacy()])
      .then(([vault, old]) => {
        setExists(!!vault);
        setLegacy(old);
      })
      .catch(() =>
        setError(
          "Local storage could not be opened. Check browser permissions and reload. Existing data has not been removed.",
        ),
      );
  }, []);
  const legacyCount = legacy.thoughts.length + (legacy.draft ? 1 : 0);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!globalThis.crypto?.subtle)
        throw new Error(
          "Encryption needs HTTPS or localhost in a browser with Web Crypto. No writing has been changed.",
        );
      let session: VaultSession;
      if (exists) {
        session = await VaultSession.unlock(pass);
      } else {
        if (!ack)
          throw new Error("Please acknowledge the recovery limitation.");
        if (!backup && pass !== confirm)
          throw new Error("The passphrases do not match.");
        const data = backup
          ? (await openEnvelope(backup, pass)).data
          : emptyVault();
        if (migrate) mergeLegacy(data, legacy);
        session = await VaultSession.create(data, pass);
        if (migrate) {
          await VaultSession.unlock(pass);
          try {
            await clearLegacy(legacy);
          } catch {
            await session.lock();
            throw new Error(
              "Your encrypted vault was created, but old plaintext cleanup failed. Unlock and finish migration in Privacy & Settings.",
            );
          }
        }
      }
      setPass("");
      setConfirm("");
      onUnlock(session);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to open the vault.",
      );
      if (!exists && (await readVault().catch(() => undefined)))
        setExists(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="gate">
      <header className="gate-header">
        <span className="wordmark">
          UNSAID<span className="wordmark-dot">.</span>
        </span>
        <span className="small-caps">A PRIVATE WRITING SPACE</span>
      </header>
      <main className="gate-main">
        <section className="gate-intro">
          <div className="section-marker">A ROOM, WITHOUT AN AUDIENCE</div>
          <h1>
            Some thoughts are
            <br />
            easier to <em>write</em>
            <br />
            than to say.
          </h1>
          <p>
            A private space for everything you’ve
            <br />
            never said out loud.
          </p>
          <div className="ink-illustration" aria-hidden="true">
            <svg viewBox="0 0 360 200">
              <path d="M25 160 Q110 45 181 126 T330 65 M50 181 Q150 100 250 168" />
              <circle cx="181" cy="126" r="3" />
              <circle cx="330" cy="65" r="2" />
              <path d="M270 25a25 25 0 1 0 30 30 27 27 0 0 1-30-30" />
            </svg>
            <span>NOT EVERY THOUGHT NEEDS AN AUDIENCE.</span>
          </div>
        </section>
        <section className="vault-door">
          <LockKeyhole size={23} strokeWidth={1.2} />
          <div className="eyebrow">
            {exists ? "WELCOME BACK" : "BEFORE YOU BEGIN"}
          </div>
          <h2>
            {exists
              ? "Your words, behind a key."
              : backup
                ? "Bring your words home."
                : "Make a little space."}
          </h2>
          <p>
            {exists
              ? "Unlock your local vault. Your passphrase stays with you."
              : backup
                ? "Restore an encrypted UNSAID backup using the passphrase that protected it."
                : "Create a passphrase for your local vault. No account, no email, just a key you keep."}
          </p>
          {exists === null ? (
            <p role="status">Opening local storage…</p>
          ) : (
            <form onSubmit={(e) => void submit(e)}>
              <label htmlFor="vault-pass">
                {exists
                  ? "Passphrase"
                  : backup
                    ? "Backup passphrase"
                    : "Choose a passphrase"}
              </label>
              <input
                id="vault-pass"
                type="password"
                autoComplete={exists ? "current-password" : "new-password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                minLength={exists ? 1 : 12}
                disabled={busy}
              />
              {!exists && !backup && (
                <>
                  <span className="field-note">
                    At least 12 characters. A few unrelated words work well.
                  </span>
                  <label htmlFor="vault-confirm">Repeat passphrase</label>
                  <input
                    id="vault-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={busy}
                  />
                </>
              )}
              {!exists && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                    required
                  />
                  I understand that a lost passphrase cannot be reset, and
                  clearing browser data can erase my writing.
                </label>
              )}
              {!exists && legacyCount > 0 && (
                <div className="migration-notice">
                  <strong>
                    {legacyCount} record{legacyCount === 1 ? "" : "s"} from the
                    earlier prototype found.
                  </strong>
                  <p>
                    These are currently plaintext. Nothing will be deleted
                    unless you choose migration.
                  </p>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={migrate}
                      onChange={(e) => setMigrate(e.target.checked)}
                    />
                    Encrypt my earlier writing, then remove the old plaintext
                    records after the vault is saved.
                  </label>
                </div>
              )}
              <button className="button" type="submit" disabled={busy}>
                {busy
                  ? "Opening your space…"
                  : exists
                    ? "Unlock your space"
                    : backup
                      ? "Restore vault"
                      : "Create your vault"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {!exists && exists !== null && (
            <label className="file-link">
              {fileName || "Or restore an encrypted backup"}
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 28_000_000)
                      throw new Error("Backup is too large.");
                    setBackup(validateEnvelope(JSON.parse(await file.text())));
                    setFileName(file.name);
                    setError("");
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Invalid backup.",
                    );
                  }
                }}
              />
              <ArrowUpRight size={13} />
            </label>
          )}
          <div className="door-footnote">
            <KeyRound size={14} />
            <span>
              On this browser. Encrypted at rest.
              <br />
              No recovery key. No cloud copy.
            </span>
          </div>
        </section>
      </main>
      <footer className="gate-footer">
        <p>
          Local prototype · Not independently security-reviewed.
          <br />
          Use fictional, non-sensitive text until independent review.
        </p>
        <button className="text-button" onClick={() => setSupport(!support)}>
          Privacy & support <ArrowUpRight size={13} />
        </button>
      </footer>
      {support && (
        <section className="gate-support">
          <h2>A note before you write</h2>
          <p>
            Encryption cannot protect writing on an unlocked screen, a
            compromised device, or from malicious extensions. Browser storage
            deletion may erase your vault; keep an encrypted backup. UNSAID is
            for reflection, not therapy or emergency support.
          </p>
          <p>
            Immediate danger: contact local emergency services. Australia:{" "}
            <a href="tel:131114">Lifeline 13 11 14</a>. US/Canada:{" "}
            <a href="tel:988">988</a>. Elsewhere:{" "}
            <a
              href="https://findahelpline.com"
              rel="noreferrer"
              target="_blank"
            >
              Find a Helpline
            </a>
            .
          </p>
        </section>
      )}
    </div>
  );
}
