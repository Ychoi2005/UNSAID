export const perspectives = [
  {
    id: "gentle",
    name: "A Gentler Perspective",
    note: "Make room for a little kindness.",
    prompts: [
      "What would you say to someone you care about in this situation?",
      "Is there something you might be overlooking about your own efforts?",
      "What would being kinder to yourself look like today?",
    ],
  },
  {
    id: "curious",
    name: "A Curious Perspective",
    note: "Follow a question, without needing an answer.",
    prompts: [
      "What part of this situation feels most difficult?",
      "Is there a particular moment that keeps coming back to you?",
      "What do you wish someone understood?",
    ],
  },
  {
    id: "another",
    name: "Another Perspective",
    note: "Try another angle. Keep what feels useful.",
    prompts: [
      "Is there another possible explanation for what happened?",
      "What might this situation look like from a different point of view?",
      "Which parts of this situation are within your control?",
    ],
  },
] as const;
