// Pinned categories sort first, keeping the existing (creation) order within
// each group — Array#sort is stable, so this only ever reorders across the
// pinned/unpinned boundary.
export function sortCategories<T extends { pinned?: boolean }>(
  categories: T[],
): T[] {
  return [...categories].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
}
