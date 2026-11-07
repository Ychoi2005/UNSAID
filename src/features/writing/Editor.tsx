import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Check, Feather, Mail, MoreHorizontal } from "lucide-react";
import { useVault } from "../../app/VaultContext";
import { keepEntry, putDraft, removeEntry } from "../../domain/operations";
import { newEntry, type Entry, type EntryKind } from "../../types/vault";
import { Confirm } from "../../components/ui";
const openings = [
  "Dear someone I never told…",
  "To the person I miss…",
  "To my younger self…",
  "To someone I wish understood…",
];
export default function Editor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data, mutate, pending, error, motion } = useVault();
  const navigate = useNavigate();
  const kind: EntryKind =
    params.get("kind") === "letter" ? "letter" : "thought";
  const [entry, setEntry] = useState<Entry>(
    () =>
      data.drafts.find((e) => e.id === id) ??
      data.entries.find((e) => e.id === id) ??
      newEntry(kind, id),
  );
  const [tags, setTags] = useState(entry.tags.join(", "));
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [menu, setMenu] = useState(false);
  const [dirty, setDirty] = useState(false);
  const savedRef = useRef(false);
  const letter = entry.kind === "letter";
  const update = useCallback(
    (next: Entry) => {
      setEntry(next);
      setDirty(true);
      setSaved(false);
      void mutate((d) => putDraft(d, next))
        .then(() => setDirty(false))
        .catch(() => {});
    },
    [mutate],
  );
  const save = useCallback(async () => {
    if (savedRef.current) return;
    savedRef.current = true;
    try {
      await mutate((d) => keepEntry(d, entry));
      setSaved(true);
      setDirty(false);
    } catch {
      /* Global save error remains visible. */
    } finally {
      savedRef.current = false;
    }
  }, [entry, mutate]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (entry.body.trim()) void save();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [save, entry.body]);
  const base = letter ? "/letters" : "/archive";
  return (
    <section className={`writing-room ${letter ? "letter-room" : ""}`}>
      <div className="writing-top">
        <Link to={base} className="text-button">
          <ArrowLeft size={15} />
          {letter ? "Letter collection" : "Your collection"}
        </Link>
        <span>
          <span className="live-dot" />
          LOCAL VAULT
        </span>
        <button
          className="icon-button"
          aria-label="Writing options"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <MoreHorizontal size={21} />
        </button>
      </div>
      {menu && (
        <div className="writing-options">
          <p>⌘ / Ctrl + S to save. Drafts are encrypted as you type.</p>
          <button className="text-button" onClick={() => navigate("/settings")}>
            Privacy & Settings
          </button>
        </div>
      )}
      <div className="paper">
        <div className="paper-heading">
          <span>{letter ? <Mail size={18} /> : <Feather size={18} />}</span>
          <span>
            {letter ? "A LETTER, NEVER SENT" : "A THOUGHT, IN YOUR OWN WORDS"}
          </span>
          <span className="paper-number">
            {new Date(entry.createdAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        {letter && !entry.body && (
          <div className="letter-openings">
            <span>A place to start, if you’d like</span>
            {openings.map((o) => (
              <button
                key={o}
                onClick={() => update({ ...entry, body: o + "\n\n" })}
              >
                {o}
              </button>
            ))}
          </div>
        )}
        <label className="sr-only" htmlFor="entry-title">
          Optional title
        </label>
        <input
          id="entry-title"
          className="paper-title"
          placeholder={
            letter
              ? "A name for this letter, if you’d like"
              : "A title, if you’d like"
          }
          value={entry.title}
          onChange={(e) => update({ ...entry, title: e.target.value })}
        />
        {entry.prompt && <p className="saved-prompt">{entry.prompt}</p>}
        <label className="sr-only" htmlFor="entry-body">
          {letter ? "Your letter" : "Your thought"}
        </label>
        <textarea
          id="entry-body"
          className="paper-body"
          placeholder={
            letter
              ? "Some words are meant to be written, not delivered."
              : "What’s something you’ve been carrying?"
          }
          value={entry.body}
          onChange={(e) => update({ ...entry, body: e.target.value })}
        />
        <div className="paper-tags">
          <label htmlFor="entry-tags">Optional tags</label>
          <input
            id="entry-tags"
            placeholder="Separate with commas"
            value={tags}
            onChange={(e) => {
              setTags(e.target.value);
              update({
                ...entry,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              });
            }}
          />
        </div>
        <div className="paper-bottom">
          <span role="status">
            {pending
              ? "Saving encrypted draft…"
              : error
                ? "Draft not saved"
                : saved
                  ? "Kept, just for you."
                  : data.drafts.some((d) => d.id === entry.id)
                    ? "Encrypted draft preserved"
                    : "Take your time. This space is yours."}
          </span>
          <span>{letter ? "NEVER DELIVERED" : "NO AUDIENCE REQUIRED"}</span>
        </div>
      </div>
      <div className="writing-actions">
        <button
          className="text-button danger-text"
          disabled={!!pending}
          onClick={() => setConfirm(true)}
        >
          Let it go
        </button>
        <div>
          <button
            className="text-button"
            title="Keep this writing and open optional reflection"
            onClick={() => {
              if (!entry.body.trim()) return;
              void mutate((d) => keepEntry(d, entry))
                .then(() =>
                  navigate(`/perspectives?entry=${entry.parentId ?? entry.id}`),
                )
                .catch(() => {});
            }}
            disabled={!entry.body.trim() || !!pending}
          >
            Reflect
          </button>
          <button
            className="button"
            disabled={!entry.body.trim() || !!pending}
            onClick={() => void save()}
          >
            {saved ? <Check size={16} /> : letter ? <Mail size={16} /> : null}
            {letter ? "Keep this letter" : "Keep this thought"}
          </button>
        </div>
      </div>
      {saved && letter && (
        <div
          className={`sealed-letter ${motion ? "seal-motion" : ""}`}
          role="status"
        >
          <Mail size={23} />
          <span>Sealed for you. Never sent.</span>
        </div>
      )}
      {dirty && error && (
        <p role="alert">
          Your changes are still on this screen. Try saving again before
          leaving.
        </p>
      )}
      {confirm && (
        <Confirm
          title={letter ? "Let this letter go?" : "Let this thought go?"}
          description="This removes this writing, its draft, any reflection responses, and its constellation connections. It cannot be undone."
          busy={!!pending}
          onCancel={() => setConfirm(false)}
          onConfirm={() =>
            void mutate((d) => removeEntry(d, entry.id))
              .then(() => navigate(base))
              .catch(() => {})
          }
        />
      )}
    </section>
  );
}
