import { authClient } from "@/utils/auth-client";

// Keyboard shortcut support: Cmd/Ctrl + 1..9 (and Numpad1..9)
const DIGIT_KEY_RE = /^[1-9]$/;
const NUMPAD_CODE_RE = /^Numpad[1-9]$/i;
const NON_DIGIT_RE = /\D+/g;

function isEditableTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) {
    return false;
  }
  if (node.isContentEditable) {
    return true;
  }
  const tag = node.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

function getIndexFromDigitKey(key: string): number | null {
  if (!DIGIT_KEY_RE.test(key)) {
    return null;
  }
  const n = Number.parseInt(key, 10);
  return n - 1; // 1..9 => 0..8
}

function getIndexFromNumpadCode(code: string): number | null {
  if (!NUMPAD_CODE_RE.test(code)) {
    return null;
  }
  const n = Number.parseInt(code.replace(NON_DIGIT_RE, ""), 10);
  if (Number.isNaN(n)) {
    return null;
  }
  return n - 1;
}

function indexFromEvent(e: KeyboardEvent): number | null {
  if (!(e.metaKey || e.ctrlKey)) {
    return null;
  }
  if (isEditableTarget(e.target)) {
    return null;
  }
  const fromKey = getIndexFromDigitKey(e.key);
  if (fromKey !== null) {
    return fromKey;
  }
  const fromCode = getIndexFromNumpadCode(e.code);
  if (fromCode !== null) {
    return fromCode;
  }
  return null;
}

/**
 * Registers a global keydown listener that activates an organization using
 * Cmd/Ctrl + [1..9] based on the provided teams list.
 * Returns a cleanup function to remove the listener.
 */
export function setupOrganizationShortcuts(
  teams: Array<{ id: string }> | null | undefined
): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    const idx = indexFromEvent(e);
    if (idx === null) {
      return;
    }

    const list = teams ?? [];
    const org = list[idx];
    if (!org) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    authClient.organization
      .setActive({ organizationId: org.id })
      .catch(() => null);
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}
