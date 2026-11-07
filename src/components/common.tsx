import { useRef, useEffect } from "react";
import { Shield } from "lucide-react";
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </>
  );
}
export function PrivacyBanner() {
  return (
    <div className="privacy-banner">
      <Shield size={16} />
      <p>
        Early prototype. Writing is saved only in this browser,{" "}
        <strong>without encryption</strong>. Please use non-sensitive sample
        text. Clearing browser data will remove your writing.
      </p>
    </div>
  );
}
export function DialogKeyboard({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current?.closest("dialog");
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a, input, textarea",
        ) ?? [],
      );
    focusable()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const nodes = focusable();
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    dialog?.addEventListener("keydown", key);
    return () => {
      dialog?.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return <span ref={ref} />;
}
export function Confirm({
  title,
  body,
  onCancel,
  onConfirm,
  busy,
  confirmLabel = "Let it go",
}: {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
  confirmLabel?: string;
}) {
  return (
    <div className="modal-backdrop">
      <dialog
        open
        aria-modal="true"
        aria-labelledby="confirm-heading"
        className="modal"
      >
        <h2 id="confirm-heading">{title}</h2>
        <p>{body}</p>
        <div className="editor-actions">
          <button className="button" disabled={busy} onClick={onCancel}>
            Keep it here
          </button>
          <button
            className="button destructive"
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
        <DialogKeyboard
          onClose={() => {
            if (!busy) onCancel();
          }}
        />
      </dialog>
    </div>
  );
}
