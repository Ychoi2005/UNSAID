import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { useVault } from "../../app/VaultContext";
import { PageTitle, Empty, entryTitle } from "../../components/ui";
import { perspectives } from "./prompts";
import { newEntry, type Entry } from "../../types/vault";
import { keepEntry, putDraft } from "../../domain/operations";
export default function Perspective() {
  const { data, mutate, pending } = useVault();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [entryId, setEntryId] = useState(params.get("entry") ?? "");
  const [mode, setMode] = useState<number | null>(null);
  const [question, setQuestion] = useState(0);
  const [response, setResponse] = useState<Entry | null>(null);
  const [saved, setSaved] = useState(false);
  const parent = data.entries.find((e) => e.id === entryId);
  const group = mode === null ? null : perspectives[mode];
  const prompt = group?.prompts[question];
  function chooseMode(i: number) {
    setMode(i);
    setQuestion(0);
    setResponse(
      data.drafts.find(
        (d) =>
          d.kind === "reflection" &&
          d.parentId === entryId &&
          d.prompt === perspectives[i].prompts[0],
      ) ?? null,
    );
    setSaved(false);
  }
  function update(value: string) {
    if (!parent || !prompt) return;
    const next = {
      ...(response ??
        newEntry("reflection", crypto.randomUUID(), parent.id, prompt)),
      body: value,
      title: `Reflection on ${entryTitle(parent)}`,
    };
    setResponse(next);
    setSaved(false);
    void mutate((d) => putDraft(d, next)).catch(() => {});
  }
  return (
    <section className="page perspective">
      <PageTitle
        number="05"
        title="Another way to look."
        description="Sometimes, another question opens another door. No answer is required."
      />
      {data.entries.length === 0 ? (
        <Empty title="Start with a thought.">
          Keep a thought or a letter first, then choose whether to reflect on
          it.
        </Empty>
      ) : (
        <>
          <label className="field-label" htmlFor="reflection-entry">
            A page to sit with
          </label>
          <select
            id="reflection-entry"
            className="wide-select"
            value={entryId}
            onChange={(e) => {
              setEntryId(e.target.value);
              setMode(null);
              setResponse(null);
              setSaved(false);
            }}
          >
            <option value="">Choose saved writing</option>
            {data.entries
              .filter((e) => e.kind !== "reflection")
              .map((e) => (
                <option value={e.id} key={e.id}>
                  {entryTitle(e)}
                </option>
              ))}
          </select>
          {parent && (
            <blockquote className="reflection-excerpt">
              {parent.body.slice(0, 420)}
              {parent.body.length > 420 ? "…" : ""}
            </blockquote>
          )}
          <div className="perspective-choices">
            {perspectives.map((p, i) => (
              <button
                key={p.id}
                className={mode === i ? "selected" : ""}
                disabled={!parent}
                onClick={() => chooseMode(i)}
              >
                <span>0{i + 1}</span>
                <h2>{p.name}</h2>
                <p>{p.note}</p>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
          {group && parent && (
            <div className="reflection-sheet">
              <div className="reflection-sheet-top">
                <span>{group.name}</span>
                <button
                  className="icon-button"
                  aria-label="Dismiss reflection prompt"
                  onClick={() => {
                    setMode(null);
                    setResponse(null);
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <h2>{prompt}</h2>
              <label className="sr-only" htmlFor="reflection-response">
                Optional reflection response
              </label>
              <textarea
                id="reflection-response"
                value={response?.body ?? ""}
                onChange={(e) => update(e.target.value)}
                placeholder="Only if you’d like to respond…"
              />
              <div className="reflection-sheet-bottom">
                <button
                  className="text-button"
                  disabled={!!pending}
                  onClick={() => {
                    const nextQuestion = (question + 1) % group.prompts.length;
                    setQuestion(nextQuestion);
                    setResponse(
                      data.drafts.find(
                        (d) =>
                          d.kind === "reflection" &&
                          d.parentId === entryId &&
                          d.prompt === group.prompts[nextQuestion],
                      ) ?? null,
                    );
                    setSaved(false);
                  }}
                >
                  Try another question
                </button>
                <button
                  className="button"
                  disabled={!response?.body.trim() || !!pending}
                  onClick={() => {
                    if (response)
                      void mutate((d) => keepEntry(d, response))
                        .then(() => setSaved(true))
                        .catch(() => {});
                  }}
                >
                  Keep reflection
                  <ArrowRight size={15} />
                </button>
              </div>
              <p role="status">
                {saved
                  ? "Reflection kept in your archive."
                  : pending
                    ? "Saving encrypted response…"
                    : response
                      ? "Your unfinished response is kept as an encrypted draft."
                      : "You can dismiss this without answering."}
              </p>
              {saved && (
                <button
                  className="text-button"
                  onClick={() => navigate("/archive")}
                >
                  Open the archive
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </>
      )}
      <p className="perspective-note">
        These are static writing prompts, not psychological advice. Nothing is
        inferred from your writing.
      </p>
    </section>
  );
}
