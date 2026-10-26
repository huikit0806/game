import type { RecipeDef, RecipeId } from "../state/types";

/**
 * 麵包目錄。新增麵包：在這裡加一筆 + unlocks.ts 寫解鎖條件即可。
 * 步驟固定 3～4 個，對應廚房小互動。
 */
export const RECIPES: RecipeDef[] = [
  {
    id: "white",
    name: "白麵包",
    blurb: "老實軟熟，新手第一款。",
    cost: { flour: 2, yeast: 1, sugar: 1 },
    steps: [
      { kind: "mix", effort: 6 },
      { kind: "knead", effort: 4 },
      { kind: "proof", effort: 1.4 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 14,
    freshnessDecayPerMin: 8,
    popularity: 1.05,
    bakeSeconds: 7,
    tint: 0xf3d7a8,
  },
  {
    id: "milk",
    name: "牛奶包",
    blurb: "香甜柔軟，午後好賣。",
    cost: { flour: 2, yeast: 1, milk: 1, sugar: 1 },
    steps: [
      { kind: "mix", effort: 6 },
      { kind: "knead", effort: 4 },
      { kind: "proof", effort: 1.5 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 18,
    freshnessDecayPerMin: 9,
    popularity: 1.15,
    bakeSeconds: 8,
    tint: 0xfff1d0,
  },
  {
    id: "pineapple",
    name: "菠蘿包",
    blurb: "脆頂軟芯，主推神器。",
    cost: { flour: 2, butter: 1, sugar: 2, egg: 1 },
    steps: [
      { kind: "mix", effort: 7 },
      { kind: "knead", effort: 5 },
      { kind: "proof", effort: 1.6 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 24,
    freshnessDecayPerMin: 11,
    popularity: 1.35,
    bakeSeconds: 9,
    tint: 0xe8b86d,
  },
  {
    id: "eggTart",
    name: "蛋撻",
    blurb: "出爐即空，新鮮度掉得快。",
    cost: { flour: 1, butter: 1, egg: 2, milk: 1, sugar: 1 },
    steps: [
      { kind: "mix", effort: 5 },
      { kind: "knead", effort: 3 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 20,
    freshnessDecayPerMin: 18,
    popularity: 1.28,
    bakeSeconds: 6,
    tint: 0xf6c85c,
  },
  {
    id: "croissant",
    name: "可頌",
    blurb: "層次多，烘得耐，售價高。",
    cost: { flour: 2, butter: 2, yeast: 1, milk: 1 },
    steps: [
      { kind: "mix", effort: 6 },
      { kind: "knead", effort: 6 },
      { kind: "proof", effort: 1.8 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 30,
    freshnessDecayPerMin: 7,
    popularity: 1.12,
    bakeSeconds: 11,
    tint: 0xd9a066,
  },
  {
    id: "danish",
    name: "丹麥酥",
    blurb: "水果點綴，週末客最愛。",
    cost: { flour: 2, butter: 2, egg: 1, fruit: 1 },
    steps: [
      { kind: "mix", effort: 6 },
      { kind: "knead", effort: 5 },
      { kind: "proof", effort: 1.5 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 34,
    freshnessDecayPerMin: 10,
    popularity: 1.22,
    bakeSeconds: 10,
    tint: 0xef9f8a,
  },
  {
    id: "porkFloss",
    name: "肉鬆包",
    blurb: "鹹香一款，補齊菜單。",
    cost: { flour: 2, egg: 1, sugar: 1, milk: 1 },
    steps: [
      { kind: "mix", effort: 6 },
      { kind: "knead", effort: 4 },
      { kind: "proof", effort: 1.4 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 26,
    freshnessDecayPerMin: 9,
    popularity: 1.1,
    bakeSeconds: 8,
    tint: 0xc9894a,
  },
  {
    id: "chocolate",
    name: "巧克力包",
    blurb: "甜食客會專程來。",
    cost: { flour: 2, chocolate: 1, butter: 1, sugar: 1 },
    steps: [
      { kind: "mix", effort: 6 },
      { kind: "knead", effort: 4 },
      { kind: "proof", effort: 1.5 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 28,
    freshnessDecayPerMin: 10,
    popularity: 1.32,
    bakeSeconds: 8,
    tint: 0x7a4a2a,
  },
  {
    id: "seasonal",
    name: "季節限定",
    blurb: "水果＋巧克力，賣完就沒。",
    cost: { flour: 2, fruit: 1, chocolate: 1, butter: 1, sugar: 1 },
    steps: [
      { kind: "mix", effort: 7 },
      { kind: "knead", effort: 5 },
      { kind: "proof", effort: 1.6 },
      { kind: "bake", effort: 1 },
    ],
    suggestedPrice: 38,
    freshnessDecayPerMin: 14,
    popularity: 1.5,
    bakeSeconds: 9,
    tint: 0xd45d79,
  },
];

export const RECIPE_MAP = Object.fromEntries(RECIPES.map((r) => [r.id, r])) as Record<
  RecipeId,
  RecipeDef
>;

export function recipeCostSum(
  recipeId: RecipeId,
  unitPrices: Record<string, number>,
): number {
  const recipe = RECIPE_MAP[recipeId];
  let sum = 0;
  for (const [id, qty] of Object.entries(recipe.cost)) {
    sum += (unitPrices[id] ?? 0) * (qty ?? 0);
  }
  return sum;
}
