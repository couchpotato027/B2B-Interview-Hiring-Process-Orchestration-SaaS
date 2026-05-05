export type Result<T> =
  | { success: true; data: T; error?: never; code?: never }
  | { success: false; data?: never; error: string; code: string };
