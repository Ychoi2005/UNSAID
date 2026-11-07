import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Download, Feather } from "lucide-react";
import { useVault } from "../../app/VaultContext";
import { removeEntry } from "../../domain/operations";
import type { Entry } from "../../types/vault";
import {
  Confirm,
  Modal,
  Tags,
  download,
  entryTitle,
  formatDate,
} from "../../components/ui";
export default function EntryDetail({
  entry,
  onClose,
}: {
  entry: Entry;
  onClose: () => void;
}) {
  const { data, mutate, run, pending } = useVault();
  const navigate = useNavigate();
  const [remove, setRemove] = useState(false);
  const [message, setMessage] = useState("");
  const parent = data.entries.find((e) => e.id === entry.parentId);
  return (
    <>
      <Modal title={entryTitle(entry)} onClose={onClose}>
        <div className="reading-meta">
          {entry.kind} · {formatDate(entry.createdAt)}
        </div>
        {entry.prompt && <p className="reading-prompt">{entry.prompt}</p>}
        {parent && (
          <p className="parent-reference">
            In response to “{entryTitle(parent)}”
          </p>
        )}
        <div className="reading-body">{entry.body}</div>
        <Tags tags={entry.tags} />
        <div className="reading-actions">
          <button
            className="text-button"
            onClick={() => navigate(`/write/${entry.id}?kind=${entry.kind}`)}
          >
            <Feather size={15} />
            Edit
          </button>
          <button
            className="text-button"
            onClick={() =>
              navigate(`/perspectives?entry=${entry.parentId ?? entry.id}`)
            }
          >
            Reflect
            <ArrowRight size={14} />
          </button>
          <button
            className="text-button"
            disabled={!!pending}
            onClick={() =>
              void run((s) => s.backupSelection(entry.id))
                .then((value) => {
                  download(value, "unsaid-selected-writing.json");
                  setMessage(
                    "Encrypted copy exported. Unlock it with your current vault passphrase.",
                  );
                })
                .catch(() => {})
            }
          >
            <Download size={14} />
            Export encrypted
          </button>
          <button
            className="text-button danger-text"
            disabled={!!pending}
            onClick={() => setRemove(true)}
          >
            Let it go
          </button>
        </div>
        {message && (
          <p role="status" className="small-note">
            {message}
          </p>
        )}
      </Modal>
      {remove && (
        <Confirm
          title="Let this writing go?"
          description="This deletes the writing, its draft, its reflection responses and graph connections. This cannot be undone."
          busy={!!pending}
          onCancel={() => setRemove(false)}
          onConfirm={() =>
            void mutate((d) => removeEntry(d, entry.id))
              .then(onClose)
              .catch(() => {})
          }
        />
      )}
    </>
  );
}
