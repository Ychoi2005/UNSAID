import type { Connection, Entry, VaultData } from "../types/vault";
export function putDraft(data: VaultData, entry: Entry) {
  data.drafts = data.drafts.filter((d) => d.id !== entry.id);
  data.drafts.push({ ...entry, updatedAt: new Date().toISOString() });
}
export function keepEntry(data: VaultData, entry: Entry) {
  if (!entry.body.trim())
    throw new Error("Write a little before keeping this.");
  const existing = data.entries.find((e) => e.id === entry.id);
  const saved = {
    ...entry,
    title: entry.title.trim(),
    tags: [...new Set(entry.tags.map((t) => t.trim()).filter(Boolean))],
    createdAt: existing?.createdAt ?? entry.createdAt,
    updatedAt: new Date().toISOString(),
  };
  data.entries = data.entries.filter((e) => e.id !== entry.id);
  data.entries.push(saved);
  data.drafts = data.drafts.filter((d) => d.id !== entry.id);
  if (!data.nodes.some((n) => n.entryId === entry.id)) {
    const i = data.nodes.length;
    const angle = i * 2.39996;
    const radius = 80 + Math.sqrt(i) * 85;
    data.nodes.push({
      id: entry.id,
      entryId: entry.id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      theme: "",
      createdAt: saved.createdAt,
    });
  }
}
export function removeEntry(data: VaultData, id: string) {
  const ids = new Set([id]);
  let size = 0;
  while (size !== ids.size) {
    size = ids.size;
    for (const e of [...data.entries, ...data.drafts])
      if (e.parentId && ids.has(e.parentId)) ids.add(e.id);
  }
  const nodeIds = new Set(
    data.nodes.filter((n) => ids.has(n.entryId)).map((n) => n.id),
  );
  data.entries = data.entries.filter((e) => !ids.has(e.id));
  data.drafts = data.drafts.filter((e) => !ids.has(e.id));
  data.nodes = data.nodes.filter((n) => !nodeIds.has(n.id));
  data.edges = data.edges.filter(
    (e) => !nodeIds.has(e.source) && !nodeIds.has(e.target),
  );
}
export function connectStars(data: VaultData, edge: Connection) {
  if (edge.source === edge.target)
    throw new Error("Choose two different stars.");
  if (
    !data.nodes.some((n) => n.id === edge.source) ||
    !data.nodes.some((n) => n.id === edge.target)
  )
    throw new Error("Both stars must exist.");
  if (
    data.edges.some(
      (e) =>
        (e.source === edge.source && e.target === edge.target) ||
        (e.source === edge.target && e.target === edge.source),
    )
  )
    throw new Error("These stars are already connected.");
  data.edges.push(edge);
}
