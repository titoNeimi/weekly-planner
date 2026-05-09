export const CATEGORY_COLORS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export function isValidCategoryColor(color: unknown): color is CategoryColor {
  return CATEGORY_COLORS.includes(color as CategoryColor);
}

export const COLOR_CLASSES: Record<CategoryColor, string> = {
  red:     "bg-red-100 text-red-600",
  orange:  "bg-orange-100 text-orange-600",
  amber:   "bg-amber-100 text-amber-600",
  yellow:  "bg-yellow-100 text-yellow-600",
  lime:    "bg-lime-100 text-lime-600",
  green:   "bg-green-100 text-green-600",
  emerald: "bg-emerald-100 text-emerald-600",
  teal:    "bg-teal-100 text-teal-600",
  cyan:    "bg-cyan-100 text-cyan-600",
  sky:     "bg-sky-100 text-sky-600",
  blue:    "bg-blue-100 text-blue-600",
  indigo:  "bg-indigo-100 text-indigo-600",
  violet:  "bg-violet-100 text-violet-600",
  purple:  "bg-purple-100 text-purple-600",
  fuchsia: "bg-fuchsia-100 text-fuchsia-600",
  pink:    "bg-pink-100 text-pink-600",
  rose:    "bg-rose-100 text-rose-600",
};

export const SWATCH_CLASSES: Record<CategoryColor, string> = {
  red:     "bg-red-400",
  orange:  "bg-orange-400",
  amber:   "bg-amber-400",
  yellow:  "bg-yellow-400",
  lime:    "bg-lime-400",
  green:   "bg-green-400",
  emerald: "bg-emerald-400",
  teal:    "bg-teal-400",
  cyan:    "bg-cyan-400",
  sky:     "bg-sky-400",
  blue:    "bg-blue-400",
  indigo:  "bg-indigo-400",
  violet:  "bg-violet-400",
  purple:  "bg-purple-400",
  fuchsia: "bg-fuchsia-400",
  pink:    "bg-pink-400",
  rose:    "bg-rose-400",
};
