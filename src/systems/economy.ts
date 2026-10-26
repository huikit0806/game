import { INGREDIENTS } from "../data/ingredients";
import type { IngredientId } from "../state/types";

/** 用日子做種子，每日材料價輕微波動（約 ±15%），同一日重進遊戲結果相同。 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailyPrices(day: number): Record<IngredientId, number> {
  const rng = mulberry32(day * 9973 + 17);
  const prices = {} as Record<IngredientId, number>;
  for (const ing of INGREDIENTS) {
    const wave = 0.85 + rng() * 0.3;
    prices[ing.id] = Math.max(1, Math.round(ing.basePrice * wave));
  }
  return prices;
}

/** 定價相對建議價的購買意願倍率。便宜更好賣，貴會嚇跑人。 */
export function priceFactor(price: number, suggested: number): number {
  if (suggested <= 0) return 1;
  const ratio = price / suggested;
  if (ratio <= 0.7) return 1.35;
  if (ratio <= 0.9) return 1.18;
  if (ratio <= 1.05) return 1;
  if (ratio <= 1.25) return 0.72;
  if (ratio <= 1.5) return 0.42;
  return 0.18;
}

export function xpToNext(level: number): number {
  return 30 + level * 40;
}

export function profit(revenue: number, cost: number): number {
  return revenue - cost;
}
