export interface Thought {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
export interface Draft {
  entryId?: string;
  title: string;
  body: string;
  tags: string;
  updatedAt: string;
}
export const emptyDraft = (): Draft => ({
  title: "",
  body: "",
  tags: "",
  updatedAt: new Date().toISOString(),
});
