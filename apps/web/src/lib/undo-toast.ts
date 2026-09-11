import { toast } from "sonner";

const UNDO_WINDOW_MS = 5000;

/**
 * Shows a success toast with an "Undo" action for an action whose local
 * (optimistic) effect has already been applied. The server-side `commit`
 * only runs once the undo window elapses without the user undoing — click
 * "Undo" within that window and `rollback` runs instead, and `commit` never
 * fires.
 */
export function undoableAction({
  message,
  undoLabel,
  duration = UNDO_WINDOW_MS,
  commit,
  rollback,
}: {
  message: string;
  undoLabel: string;
  duration?: number;
  commit: () => unknown;
  rollback: () => void;
}) {
  let undone = false;
  const timer = setTimeout(() => {
    if (!undone) void commit();
  }, duration);

  toast.success(message, {
    duration,
    action: {
      label: undoLabel,
      onClick: () => {
        if (undone) return;
        undone = true;
        clearTimeout(timer);
        rollback();
      },
    },
  });
}
