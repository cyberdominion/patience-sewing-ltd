export type CategoryFilter =
  | "DRESSES"
  | "TWO_PIECE"
  | "THREE_PIECE"
  | "CAPSULES"
  | "OUTERWEAR"
  | "ACCESSORIES"
  | "CUSTOM_BESPOKE";

export const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  DRESSES: "Dresses",
  TWO_PIECE: "Two-piece sets",
  THREE_PIECE: "Three-piece sets",
  CAPSULES: "Capsules",
  OUTERWEAR: "Outerwear & capes",
  ACCESSORIES: "Accessories",
  CUSTOM_BESPOKE: "Bespoke commission",
};

export const CATEGORY_DESCRIPTIONS: Record<CategoryFilter, string> = {
  DRESSES: "Gowns, midi and shirt dresses, cut for weddings, engagements and naming ceremonies.",
  TWO_PIECE: "Matched blouse and skirt or trouser sets, the workhorses of a Nigerian wardrobe.",
  THREE_PIECE: "Complete senator and traditional sets, ready to wear on the day.",
  CAPSULES: "Small-batch bouye and structured pieces that come back every season.",
  OUTERWEAR: "Capes and layers that turn a simple outfit into an entrance piece.",
  ACCESSORIES: "Hand-pleated gele, shawls and finishing pieces that complete the look.",
  CUSTOM_BESPOKE: "Cut and stitched to your measurements. From NGN 180,000.",
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryFilter[];

export const SIZE_ORDER = [
  "UK 6",
  "UK 8",
  "UK 10",
  "UK 12",
  "UK 14",
  "UK 16",
  "UK 18",
  "UK 20",
  "S/M",
  "L/XL",
  "XXL",
  "One size",
  "Made to measure",
  "Custom",
];

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}