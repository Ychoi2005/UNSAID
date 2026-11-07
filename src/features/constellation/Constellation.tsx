import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  useNodesState,
  type Node,
  type NodeProps,
  type Connection as FlowConnection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { List, Search, Stars } from "lucide-react";
import { useVault } from "../../app/VaultContext";
import { connectStars } from "../../domain/operations";
import {
  PageTitle,
  Empty,
  EntryPreview,
  entryTitle,
} from "../../components/ui";
import type { Entry } from "../../types/vault";
import EntryDetail from "../archive/EntryDetail";
type StarNode = Node<{ title: string; kind: string; theme: string }, "star">;
function StarView({ data }: NodeProps<StarNode>) {
  return (
    <div className={`sky-star ${data.kind === "letter" ? "letter-star" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <span className="star-glyph" aria-hidden="true">
        {data.kind === "letter" ? "◇" : "✦"}
      </span>
      <span className="star-title">{data.title}</span>
      {data.theme && <span className="star-theme">{data.theme}</span>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { star: StarView };
export default function Constellation() {
  const { data, mutate, pending } = useVault();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [theme, setTheme] = useState("");
  const [list, setList] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [themeStar, setThemeStar] = useState("");
  const [themeName, setThemeName] = useState("");
  const [error, setError] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<StarNode>([]);
  const visibleEntries = useMemo(
    () =>
      data.entries.filter(
        (e) =>
          (!tag || e.tags.includes(tag)) &&
          (!theme ||
            data.nodes.some((n) => n.entryId === e.id && n.theme === theme)) &&
          `${e.title} ${e.body} ${e.tags.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [data, query, tag, theme],
  );
  const ids = useMemo(
    () => new Set(visibleEntries.map((e) => e.id)),
    [visibleEntries],
  );
  useEffect(() => {
    setNodes(
      data.nodes
        .filter((n) => ids.has(n.entryId))
        .map((n) => {
          const entry = data.entries.find((e) => e.id === n.entryId)!;
          return {
            id: n.id,
            type: "star",
            position: { x: n.x, y: n.y },
            data: {
              title: entryTitle(entry),
              kind: entry.kind,
              theme: n.theme,
            },
            ariaLabel: `${entry.kind}: ${entryTitle(entry)}`,
            style: { width: 160 },
          };
        }),
    );
  }, [data, ids, setNodes]);
  async function connect(edge: FlowConnection) {
    if (!edge.source || !edge.target) return;
    setError("");
    try {
      await mutate((d) =>
        connectStars(d, {
          id: crypto.randomUUID(),
          source: edge.source!,
          target: edge.target!,
          label,
        }),
      );
      setLabel("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not connect these stars.",
      );
    }
  }
  const choices = data.nodes.map((n) => ({
    id: n.id,
    title: entryTitle(data.entries.find((e) => e.id === n.entryId)!),
  }));
  return (
    <section className="constellation-page">
      <PageTitle
        number="03"
        title="Every thought has its place."
        description="Your words, in a sky of your own. The connections are yours to make."
      >
        <button className="text-button" onClick={() => setList(!list)}>
          {list ? <Stars size={16} /> : <List size={16} />}{" "}
          {list ? "Sky view" : "List view"}
        </button>
      </PageTitle>
      <div className="sky-filters">
        <label className="search">
          <Search size={16} />
          <span className="sr-only">Search constellation</span>
          <input
            placeholder="Find a thought…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Constellation tag filter</span>
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">All tags</option>
            {[...new Set(data.entries.flatMap((e) => e.tags))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Theme filter</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="">All themes</option>
            {[...new Set(data.nodes.map((n) => n.theme).filter(Boolean))].map(
              (t) => (
                <option key={t}>{t}</option>
              ),
            )}
          </select>
        </label>
      </div>
      {!data.nodes.length ? (
        <Empty title="Your sky begins with a page.">
          Keep a thought or a letter. Its star will be waiting here.
        </Empty>
      ) : !visibleEntries.length ? (
        <Empty title="No stars in this view.">
          Try another word, tag or theme.
        </Empty>
      ) : list ? (
        <div className="sky-list">
          {visibleEntries.map((entry) => (
            <EntryPreview
              key={entry.id}
              entry={entry}
              onClick={() => setSelected(entry)}
            />
          ))}
        </div>
      ) : (
        <div
          className="sky-canvas"
          aria-label="Interactive thought constellation"
        >
          <ReactFlow<StarNode>
            nodes={nodes}
            edges={data.edges
              .filter((e) => ids.has(e.source) && ids.has(e.target))
              .map((e) => ({
                ...e,
                style: { stroke: "#8f91a3", strokeWidth: 1 },
                labelStyle: { fill: "#d4c8b1", fontSize: 10 },
                labelBgStyle: { fill: "#101522" },
              }))}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStop={(_e, node) =>
              void mutate((d) => {
                const n = d.nodes.find((n) => n.id === node.id);
                if (n) {
                  n.x = node.position.x;
                  n.y = node.position.y;
                }
              }).catch(() => {})
            }
            onConnect={(edge) => void connect(edge)}
            onEdgesDelete={(edges) =>
              void mutate((d) => {
                d.edges = d.edges.filter(
                  (e) => !edges.some((edge) => edge.id === e.id),
                );
              }).catch(() => {})
            }
            onNodeClick={(_e, node) => {
              const entry = data.entries.find((e) => e.id === node.id);
              if (entry) setSelected(entry);
            }}
            fitView
            minZoom={0.15}
            maxZoom={3}
            defaultEdgeOptions={{ type: "straight" }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={80}
              size={1}
              color="#596074"
            />
            <Controls showInteractive={false} />
          </ReactFlow>
          <div className="sky-caption">
            DRAG A STAR TO MOVE IT · CONNECT THE SMALL HANDLES · CLICK TO READ
          </div>
        </div>
      )}
      <details className="graph-tools">
        <summary>Arrange your connections & themes</summary>
        <p>
          All connections are made by you. This view makes no interpretation of
          your writing. The same controls work with the list view.
        </p>
        <form
          className="graph-form"
          onSubmit={(e) => {
            e.preventDefault();
            void connect({
              source,
              target,
              sourceHandle: null,
              targetHandle: null,
            });
          }}
        >
          <label>
            First star
            <select
              aria-label="First star"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            >
              <option value="">Choose a star</option>
              {choices.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Second star
            <select
              aria-label="Second star"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            >
              <option value="">Choose a star</option>
              {choices.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Relationship (optional)
            <input
              aria-label="Relationship (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="A connection, in your words"
            />
          </label>
          <button className="button" disabled={!!pending || choices.length < 2}>
            Connect stars
          </button>
        </form>
        {data.edges.length > 0 && (
          <ul className="connection-list">
            {data.edges.map((edge) => (
              <li key={edge.id}>
                <span>
                  {choices.find((c) => c.id === edge.source)?.title} —{" "}
                  {choices.find((c) => c.id === edge.target)?.title}
                  {edge.label ? ` · ${edge.label}` : ""}
                </span>
                <button
                  className="text-button"
                  onClick={() =>
                    void mutate((d) => {
                      d.edges = d.edges.filter((e) => e.id !== edge.id);
                    }).catch(() => {})
                  }
                >
                  Remove connection
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="graph-form"
          onSubmit={(e) => {
            e.preventDefault();
            void mutate((d) => {
              const node = d.nodes.find((n) => n.id === themeStar);
              if (node) node.theme = themeName.trim();
            })
              .then(() => setError(""))
              .catch(() => {});
          }}
        >
          <label>
            Star to arrange
            <select
              aria-label="Star to arrange"
              value={themeStar}
              onChange={(e) => {
                setThemeStar(e.target.value);
                setThemeName(
                  data.nodes.find((n) => n.id === e.target.value)?.theme ?? "",
                );
              }}
              required
            >
              <option value="">Choose a star</option>
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Theme name
            <input
              aria-label="Theme name"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="Blank removes the theme"
            />
          </label>
          <button
            className="button secondary"
            disabled={!!pending || !themeStar}
          >
            Save theme
          </button>
        </form>
        <form
          className="graph-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void mutate((d) => {
              const node = d.nodes.find((n) => n.id === themeStar);
              if (node) {
                node.x = Number(form.get("x"));
                node.y = Number(form.get("y"));
              }
            }).catch(() => {});
          }}
        >
          <label>
            Horizontal position
            <input
              name="x"
              type="number"
              defaultValue="0"
              min="-100000"
              max="100000"
              required
            />
          </label>
          <label>
            Vertical position
            <input
              name="y"
              type="number"
              defaultValue="0"
              min="-100000"
              max="100000"
              required
            />
          </label>
          <button
            className="button secondary"
            disabled={!themeStar || !!pending}
          >
            Move selected star
          </button>
        </form>
      </details>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {selected && (
        <EntryDetail entry={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
