import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, ArrowUpRight } from "lucide-react";
import type { Entry } from "../types/vault";
export function PageTitle({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div className="section-marker">
        <span>{number}</span> A SPACE OF YOUR OWN
      </div>
      <div className="page-title-line">
        <h1>{title}</h1>
        {children}
      </div>
      <p>{description}</p>
    </header>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const headingId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
    >
      <div className="dialog-heading">
        <h2 id={headingId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  label = "Delete permanently",
  onCancel,
  onConfirm,
  busy = false,
}: {
  title: string;
  description: string;
  label?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Modal
      title={title}
      onClose={() => {
        if (!busy) onCancel();
      }}
    >
      <p>{description}</p>
      <div className="dialog-actions">
        <button className="button secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button className="button danger" disabled={busy} onClick={onConfirm}>
          {busy ? "Working…" : label}
        </button>
      </div>
    </Modal>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-mark" aria-hidden="true">
        —
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="tags">
      {tags.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}
export function EntryPreview({
  entry,
  onClick,
}: {
  entry: Entry;
  onClick: () => void;
}) {
  return (
    <button className="entry-row" onClick={onClick}>
      <span className="entry-date">
        {formatDate(entry.createdAt)}
        <small>{entry.kind}</small>
      </span>
      <span className="entry-summary">
        <strong>
          {entry.title ||
            (entry.kind === "letter"
              ? "An unsent letter"
              : entry.kind === "reflection"
                ? "A reflection"
                : "An untitled thought")}
        </strong>
        <span>{entry.body.slice(0, 160)}</span>
        <Tags tags={entry.tags} />
      </span>
      <ArrowUpRight size={17} />
    </button>
  );
}
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export function download(
  content: string,
  filename: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const entryTitle = (entry: Entry) =>
  entry.title ||
  (entry.kind === "letter"
    ? "An unsent letter"
    : entry.kind === "reflection"
      ? "A reflection"
      : "An untitled thought");
