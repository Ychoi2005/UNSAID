import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteThought,
  discardDraft,
  getDraft,
  listThoughts,
  preserveDraft,
  saveThought,
} from "../src/lib/storage/writing";
import { emptyDraft } from "../src/types/writing";
beforeEach(async () => {
  for (const item of await listThoughts()) await deleteThought(item.id);
  await discardDraft();
});
describe("local writing lifecycle", () => {
  it("preserves drafts and atomically saves them as thoughts", async () => {
    const draft = {
      ...emptyDraft(),
      title: "Quiet",
      body: "A sample thought",
      tags: "home, home, change",
    };
    await preserveDraft(draft);
    expect((await getDraft())?.body).toBe(draft.body);
    const saved = await saveThought(draft);
    expect(saved.tags).toEqual(["home", "change"]);
    expect(await getDraft()).toBeUndefined();
    expect(await listThoughts()).toEqual([saved]);
  });
  it("edits without duplicating or losing the creation date", async () => {
    const first = await saveThought({ ...emptyDraft(), body: "Before" });
    const edited = await saveThought({
      ...emptyDraft(),
      entryId: first.id,
      body: "After",
    });
    expect(edited.id).toBe(first.id);
    expect(edited.createdAt).toBe(first.createdAt);
    expect(await listThoughts()).toHaveLength(1);
    expect((await listThoughts())[0].body).toBe("After");
  });
  it("deletes a thought and its matching draft", async () => {
    const saved = await saveThought({ ...emptyDraft(), body: "Sample" });
    await preserveDraft({ ...emptyDraft(), entryId: saved.id, body: "Edited" });
    await deleteThought(saved.id);
    expect(await listThoughts()).toEqual([]);
    expect(await getDraft()).toBeUndefined();
  });
  it("does not delete an unrelated draft", async () => {
    const saved = await saveThought({ ...emptyDraft(), body: "Sample" });
    await preserveDraft({ ...emptyDraft(), body: "Another draft" });
    await deleteThought(saved.id);
    expect((await getDraft())?.body).toBe("Another draft");
  });
  it("rejects empty writing without destroying a draft", async () => {
    await preserveDraft({ ...emptyDraft(), body: "Draft" });
    await expect(saveThought({ ...emptyDraft(), body: "  " })).rejects.toThrow(
      "Write a little",
    );
    expect((await getDraft())?.body).toBe("Draft");
  });
  it("can explicitly discard a draft", async () => {
    await preserveDraft({ ...emptyDraft(), body: "Sample" });
    await discardDraft();
    expect(await getDraft()).toBeUndefined();
  });
});
