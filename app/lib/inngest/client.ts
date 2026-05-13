import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "BudgetX", // Unique app ID
  name: "BudgeTX",
  retryFunction: async (attempt: number) => ({
    delay: Math.pow(2, attempt) * 1000, // Exponential backoff
    maxAttempts: 2,
  }),
});