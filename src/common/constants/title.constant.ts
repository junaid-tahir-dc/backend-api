export const Title = {
  PRACTICE_MANAGER: "PRACTICE_MANAGER",
  SCHEDULING_MANAGER: "SCHEDULING_MANAGER",
  BILLING_MANAGER: "BILLING_MANAGER",
  PHYSICIAN: "PHYSICIAN",
} as const;

export type Title = (typeof Title)[keyof typeof Title];