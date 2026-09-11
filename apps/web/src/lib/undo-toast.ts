import { toast } from "sonner";

const UNDO_WINDOW_MS = 5000;

/**
 * Shows a success toast with an "Undo" action for an action whose local
 * (optimistic) effect has already been applied. The server-side `commit`
 * only runs once the undo window elapses without the user undoing — click
 * "Undo" within that window and `rollback` runs instead, and `commit` never
 * fires.
 *
 * `commit` must reject/throw (e.g. by checking `res.ok` and throwing) to
 * report a failed request — a resolved `fetch()` is not itself success, it
 * only means the network round-trip completed. Any rejection is caught here
 * so it can never be silently swallowed; pass `errorMessage` to also surface
 * it to the user (omit it when `commit` already reports its own failures,
 * e.g. a partial-failure toast over several requests). Pass
 * `rollbackOnError: true` for an all-or-nothing `commit` (a single request)
 * so a failure also reverts the optimistic UI change; leave it off for a
 * batched `commit` that may partially succeed, since a full `rollback()`
 * there would also discard the items that *did* commit.
 */
export function undoableAction({
  message,
  undoLabel,
  duration = UNDO_WINDOW_MS,
  commit,
  rollback,
  errorMessage,
  rollbackOnError = false,
}: {
  message: string;
  undoLabel: string;
  duration?: number;
  commit: () => unknown;
  rollback: () => void;
  errorMessage?: string;
  rollbackOnError?: boolean;
}) {
  let undone = false;
  const timer = setTimeout(() => {
    if (!undone) {
      Promise.resolve()
        .then(commit)
        .catch((err) => {
          console.error("undoableAction: commit failed", err);
          if (errorMessage) toast.error(errorMessage);
          if (rollbackOnError && !undone) {
            undone = true;
            rollback();
          }
        });
    }
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
