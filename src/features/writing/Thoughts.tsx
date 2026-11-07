import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Check, Feather, Plus, Search, X } from "lucide-react";
import {
  deleteThought,
  getDraft,
  listThoughts,
  preserveDraft,
} from "../../lib/storage/writing";
import type { Thought } from "../../types/writing";
import {
  PageHeader,
  PrivacyBanner,
  Confirm,
  DialogKeyboard,
} from "../../components/common";
export default function Thoughts() {
  const [items, setItems] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Thought | null>(null);
  const [remove, setRemove] = useState<Thought | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftWarning, setDraftWarning] = useState<Thought | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    listThoughts()
      .then(setItems)
      .catch(() =>
        setError("Your thoughts could not be opened. Please try reloading."),
      )
      .finally(() => setLoading(false));
  }, []);
  async function edit(item: Thought, replace = false) {
    setBusy(true);
    try {
      const current = await getDraft();
      if (
        !replace &&
        current &&
        (current.body || current.title || current.tags) &&
        current.entryId !== item.id
      ) {
        setDraftWarning(item);
        return;
      }
      await preserveDraft({
        entryId: item.id,
        title: item.title,
        body: item.body,
        tags: item.tags.join(", "),
        updatedAt: item.updatedAt,
      });
      navigate("/write");
    } catch {
      setError("This thought could not be opened for editing.");
    } finally {
      setBusy(false);
    }
  }
  async function destroy() {
    if (!remove) return;
    setBusy(true);
    try {
      await deleteThought(remove.id);
      setItems(items.filter((i) => i.id !== remove.id));
      setRemove(null);
      setSelected(null);
    } catch {
      setError("Unable to delete. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const filtered = items.filter((i) =>
    `${i.title} ${i.body} ${i.tags.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="page">
      <div className="page-heading">
        <PageHeader
          eyebrow="HERE WHEN YOU WANT THEM"
          title="The things you’ve kept."
          description="A place to return to, whenever you choose."
        />
        <Link className="button primary" to="/write">
          <Plus size={16} />
          Let it out
        </Link>
      </div>
      <PrivacyBanner />
      {location.state?.saved && (
        <p role="status" className="saved-message">
          <Check size={15} />
          Kept on this browser.
        </p>
      )}
      <label className="search">
        <Search size={18} />
        <span className="sr-only">Search thoughts</span>
        <input
          placeholder="Find a thought, a word, a tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Opening your space…</p>
      ) : filtered.length ? (
        <div className="thought-grid">
          {filtered.map((item) => (
            <button
              className="thought-card"
              key={item.id}
              onClick={() => setSelected(item)}
            >
              <span className="thought-date">
                {new Date(item.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <h2>{item.title || "An untitled thought"}</h2>
              <p>{item.body}</p>
              <div className="tag-list">
                {item.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <span className="card-link">
                Revisit this thought <ArrowRight size={13} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Feather size={32} />
          <h2>{query ? "No thoughts found." : "Nothing you need to fill."}</h2>
          <p>
            {query
              ? "Try another word or tag."
              : "When you have something to leave here, this space will be waiting."}
          </p>
          {!query && (
            <Link className="text-button" to="/write">
              Write your first thought <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}
      {selected && (
        <div className="modal-backdrop">
          <dialog
            open
            aria-modal="true"
            aria-labelledby="thought-heading"
            className="modal reading"
          >
            <button
              className="close-button"
              aria-label="Close thought"
              autoFocus
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <span className="eyebrow">A THOUGHT YOU KEPT</span>
            <h2 id="thought-heading">
              {selected.title || "An untitled thought"}
            </h2>
            <div className="reading-body">{selected.body}</div>
            <div className="tag-list">
              {selected.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="editor-actions">
              <button
                className="text-button danger"
                onClick={() => setRemove(selected)}
              >
                Let it go
              </button>
              <button
                className="button"
                disabled={busy}
                onClick={() => void edit(selected)}
              >
                Edit thought
                <Feather size={15} />
              </button>
            </div>
            <DialogKeyboard onClose={() => setSelected(null)} />
          </dialog>
        </div>
      )}
      {remove && (
        <Confirm
          title="Let this thought go?"
          body="This permanently removes the thought and any draft of it from this browser. It cannot be undone."
          busy={busy}
          onCancel={() => setRemove(null)}
          onConfirm={() => void destroy()}
        />
      )}
      {draftWarning && (
        <Confirm
          title="You have an unfinished draft."
          body="Opening this thought for editing will replace your current draft. You can cancel and return to writing to keep it first."
          busy={busy}
          confirmLabel="Replace draft"
          onCancel={() => setDraftWarning(null)}
          onConfirm={() => void edit(draftWarning, true)}
        />
      )}
    </section>
  );
}
