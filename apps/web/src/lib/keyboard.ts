/**
 * True when a keydown should be treated as normal typing (into an input,
 * textarea, select, or contenteditable region) rather than a global
 * single-key shortcut like "n" or "/".
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** True when a keydown carries a modifier that should defer to the browser/OS. */
export function hasModifier(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey || e.altKey;
}
