import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Mail, Plus, Search } from "lucide-react";
import { useVault } from "../../app/VaultContext";
import {
  PageTitle,
  Empty,
  EntryPreview,
  download,
  entryTitle,
  formatDate,
} from "../../components/ui";
import type { Entry } from "../../types/vault";
import EntryDetail from "./EntryDetail";
export default function Collection({
  mode,
}: {
  mode: "archive" | "letters" | "timeline";
}) {
  const { data, run } = useVault();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("newest");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState<Entry | null>(null);
  const [exported, setExported] = useState(false);
  const months = [...new Set(data.entries.map((e) => e.createdAt.slice(0, 7)))]
    .sort()
    .reverse();
  const tags = [
    ...new Set([...data.entries, ...data.drafts].flatMap((e) => e.tags)),
  ].sort();
  const entries = useMemo(() => {
    const source = kind === "draft" ? data.drafts : data.entries;
    return source
      .filter(
        (e) =>
          (mode !== "letters" || e.kind === "letter") &&
          (kind === "all" || kind === "draft" || e.kind === kind) &&
          (!tag || e.tags.includes(tag)) &&
          (!month || e.createdAt.startsWith(month)) &&
          `${e.title} ${e.body} ${e.tags.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      )
      .sort((a, b) =>
        sort === "oldest"
          ? a.createdAt.localeCompare(b.createdAt)
          : sort === "title"
            ? entryTitle(a).localeCompare(entryTitle(b))
            : b.createdAt.localeCompare(a.createdAt),
      );
  }, [data, kind, mode, tag, month, query, sort]);
  const open = (entry: Entry) => {
    if (kind === "draft") navigate(`/write/${entry.id}?kind=${entry.kind}`);
    else setSelected(entry);
  };
  return (
    <section className={`page collection ${mode}`}>
      <PageTitle
        number={mode === "letters" ? "02" : mode === "timeline" ? "04" : "06"}
        title={
          mode === "letters"
            ? "Letters Never Sent"
            : mode === "timeline"
              ? "The things you once carried."
              : "The Archive"
        }
        description={
          mode === "letters"
            ? "Some words are meant to be written, not delivered."
            : mode === "timeline"
              ? "Return to a page when you choose. Nothing here needs to measure progress."
              : "A private library of thoughts, letters, and unfinished things."
        }
      >
        {mode !== "timeline" && (
          <button
            className="text-button"
            onClick={() =>
              navigate(
                `/write/${crypto.randomUUID()}${mode === "letters" ? "?kind=letter" : ""}`,
              )
            }
          >
            <Plus size={16} />
            {mode === "letters" ? "Write a letter" : "New thought"}
          </button>
        )}
      </PageTitle>
      {mode === "letters" && (
        <div className="letters-intro">
          <Mail strokeWidth={1} size={38} />
          <p>
            For someone. For yourself.
            <br />
            <em>For no one but the page.</em>
          </p>
          <span>ALWAYS PRIVATE. NEVER DELIVERED.</span>
        </div>
      )}
      <div className="collection-tools">
        <label className="search">
          <Search size={17} />
          <span className="sr-only">Search {mode}</span>
          <input
            placeholder={
              mode === "letters" ? "Find a letter…" : "A word, a title, a tag…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filter writing type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">
              {mode === "letters" ? "Saved letters" : "All writing"}
            </option>
            {mode !== "letters" && (
              <>
                <option value="thought">Thoughts</option>
                <option value="letter">Letters</option>
                <option value="reflection">Reflections</option>
              </>
            )}
            <option value="draft">Drafts</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by tag</span>
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {mode === "timeline" ? (
          <label>
            <span className="sr-only">Month and year</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(m + "-01T12:00:00").toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            <span className="sr-only">Sort writing</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">By title</option>
            </select>
          </label>
        )}
      </div>
      {entries.length === 0 ? (
        <Empty
          title={
            query || tag || month
              ? "No pages found."
              : mode === "letters"
                ? "A letter doesn’t need a destination."
                : "Nothing you need to fill."
          }
        >
          {query || tag || month
            ? "Try another word or filter."
            : mode === "letters"
              ? "Start with a blank page, or an opening that feels right."
              : "Your writing will be here when you choose to keep it."}
        </Empty>
      ) : mode === "letters" ? (
        <div className="envelope-collection">
          {entries.map((entry) => (
            <button
              key={entry.id}
              className="envelope"
              onClick={() => open(entry)}
            >
              <span className="envelope-flap" aria-hidden="true" />
              <span className="envelope-label">
                {kind === "draft" ? "UNFINISHED LETTER" : "NEVER SENT"}
              </span>
              <h2>{entryTitle(entry)}</h2>
              <p>{entry.body.slice(0, 100)}</p>
              <span className="envelope-date">
                {formatDate(entry.createdAt)}
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="entry-list">
          {entries.map((entry, i) => (
            <div key={entry.id}>
              {mode === "timeline" &&
                (i === 0 ||
                  entries[i - 1].createdAt.slice(0, 7) !==
                    entry.createdAt.slice(0, 7)) && (
                  <h2 className="month-heading">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                )}
              <EntryPreview entry={entry} onClick={() => open(entry)} />
            </div>
          ))}
        </div>
      )}
      {mode === "archive" && (
        <footer className="collection-footer">
          <span>
            {data.drafts.length
              ? "Unfinished drafts have a place here, too. Choose Drafts above."
              : "Only you choose what stays."}
          </span>
          <button
            className="text-button"
            onClick={() =>
              void run((s) => s.backup())
                .then((value) => {
                  download(value, "unsaid-vault-backup.json");
                  setExported(true);
                })
                .catch(() => {})
            }
          >
            <Download size={14} />
            Export encrypted vault
          </button>
          {exported && (
            <p role="status">
              Encrypted backup exported. Keep its passphrase separately.
            </p>
          )}
        </footer>
      )}
      {selected && (
        <EntryDetail entry={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
