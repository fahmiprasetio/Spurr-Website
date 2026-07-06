export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeEmailInput(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeStringInput(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateEmail(email: string): ValidationResult<string> {
  const normalized = normalizeEmailInput(email);

  if (!EMAIL_PATTERN.test(normalized)) {
    return { ok: false, error: "Invalid email address.", status: 400 };
  }

  return { ok: true, data: normalized };
}

export function validatePassword(password: string): ValidationResult<string> {
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters.", status: 400 };
  }

  if (password.length > 128) {
    return { ok: false, error: "Password is too long. Maximum 128 characters.", status: 400 };
  }

  return { ok: true, data: password };
}

export function validateName(name: string): ValidationResult<string | null> {
  const normalized = name.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return { ok: true, data: null };
  }

  if (normalized.length > 80) {
    return { ok: false, error: "Name is too long. Maximum 80 characters.", status: 400 };
  }

  return { ok: true, data: normalized };
}

export function validateEntityId(value: unknown, label: string): ValidationResult<string> {
  const id = normalizeStringInput(value);

  if (!id) {
    return { ok: false, error: `${label} is required.`, status: 400 };
  }

  if (!/^[a-zA-Z0-9_-]{2,80}$/.test(id)) {
    return { ok: false, error: `Invalid ${label}.`, status: 400 };
  }

  return { ok: true, data: id };
}

export function validateReviewComment(value: unknown): ValidationResult<string> {
  const comment = normalizeStringInput(value).replace(/\s+/g, " ");

  if (!comment) {
    return { ok: false, error: "Please write a comment before submitting.", status: 400 };
  }

  if (comment.length < 8) {
    return { ok: false, error: "Comment is too short. Minimum 8 characters.", status: 400 };
  }

  if (comment.length > 600) {
    return { ok: false, error: "Comment is too long. Maximum 600 characters.", status: 400 };
  }

  return { ok: true, data: comment };
}

export function parseDateOnly(value: string | null): Date | null {
  if (!value || !DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toDateOnlyIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
