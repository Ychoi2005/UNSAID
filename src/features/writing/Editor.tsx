import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Trash2 } from "lucide-react";
import {
  deleteThought,
  discardDraft,
  getDraft,
  preserveDraft,
  saveThought,
} from "../../lib/storage/writing";
import { emptyDraft, type Draft } from "../../types/writing";
import { PageHeader, PrivacyBanner, Confirm } from "../../components/common";
export default function Editor() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let live = true;
    getDraft()
      .then((d) => {
        if (live) {
          if (d) setDraft(d);
          setReady(true);
        }
      })
      .catch(() => {
        if (live)
          setError(
            "Your draft could not be opened. Please reload before writing.",
          );
      });
    return () => {
      live = false;
    };
  }, []);
  function update(field: "body" | "title" | "tags", value: string) {
    const next = {
      ...draft,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };
    setDraft(next);
    setStatus("Preserving draft…");
    queue.current = queue.current
      .catch(() => {})
      .then(() => preserveDraft(next));
    void queue.current
      .then(() => setStatus("Draft kept on this browser"))
      .catch(() => {
        setStatus("");
        setError(
          "Your draft could not be saved. Keep a copy before leaving this page.",
        );
      });
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await queue.current;
      await saveThought(draft);
      setDraft(emptyDraft());
      navigate("/thoughts", { state: { saved: true } });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await queue.current;
      if (draft.entryId) await deleteThought(draft.entryId);
      await discardDraft();
      setDraft(emptyDraft());
      setConfirm(false);
      setStatus("Let go. This page is yours again.");
    } catch {
      setError("Unable to delete. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page editor-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} />
        Your quiet room
      </Link>
      <PageHeader
        eyebrow="A LITTLE SPACE TO EXHALE"
        title={draft.entryId ? "A thought, revisited." : "What’s on your mind?"}
        description="Take your time. This space is yours."
      />
      <PrivacyBanner />
      <div className="editor-surface">
        <label className="sr-only" htmlFor="title">
          Optional title
        </label>
        <input
          id="title"
          className="title-input"
          placeholder="A title, if you’d like"
          value={draft.title}
          disabled={!ready || busy}
          onChange={(e) => update("title", e.target.value)}
        />
        <label className="sr-only" htmlFor="body">
          Your thought
        </label>
        <textarea
          id="body"
          autoFocus
          placeholder="What’s something you’ve been carrying?"
          value={draft.body}
          disabled={!ready || busy}
          onChange={(e) => update("body", e.target.value)}
        />
        <div className="tags-row">
          <label htmlFor="tags">Tags, if you’d like</label>
          <input
            id="tags"
            placeholder="home, change, little things"
            value={draft.tags}
            disabled={!ready || busy}
            onChange={(e) => update("tags", e.target.value)}
          />
          <span>Separate with commas</span>
        </div>
      </div>
      <div role="status" className="save-status">
        {status && (
          <>
            <Check size={14} />
            {status}
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="editor-actions">
        <button
          className="text-button danger"
          disabled={
            !ready ||
            busy ||
            (!draft.body && !draft.title && !draft.tags && !draft.entryId)
          }
          onClick={() => setConfirm(true)}
        >
          <Trash2 size={16} />
          Let it go
        </button>
        <button
          className="button primary"
          disabled={!ready || busy || !draft.body.trim()}
          onClick={() => void save()}
        >
          Keep this thought
          <ArrowRight size={16} />
        </button>
      </div>
      <p className="small-note">
        You can leave at any time. Your draft is preserved as you write.
      </p>
      {confirm && (
        <Confirm
          title="Let this thought go?"
          body="This removes this thought and its draft from this browser. It cannot be undone."
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={() => void remove()}
        />
      )}
    </section>
  );
}
