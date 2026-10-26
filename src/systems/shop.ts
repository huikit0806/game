import { RECIPE_MAP } from "../data/recipes";
import type { Customer, Loaf, RecipeId } from "../state/types";
import { priceFactor } from "./economy";

export interface Offer {
  loaf: Loaf;
  price: number;
  sale: boolean;
  featured: boolean;
}

export interface ShopTuning {
  shopLevel: number;
  decorLevel: number;
}

/** 客人對單個麵包的購買分數。低於門檻會空手離開。 */
export function scoreOffer(offer: Offer, tuning: ShopTuning): number {
  const recipe = RECIPE_MAP[offer.loaf.recipeId];
  const fresh = offer.loaf.freshness / 100;
  if (fresh <= 0.15) return 0;
  const saleBonus = offer.sale ? 1.22 : 1;
  const feat = offer.featured ? 1.18 : 1;
  const shop = 1 + tuning.shopLevel * 0.06 + tuning.decorLevel * 0.08;
  return (
    recipe.popularity *
    (0.35 + fresh * 0.65) *
    priceFactor(offer.price, recipe.suggestedPrice) *
    saleBonus *
    feat *
    shop
  );
}

export const BUY_THRESHOLD = 0.72;

export function pickPurchase(offers: Offer[], tuning: ShopTuning): Offer | null {
  let best: Offer | null = null;
  let bestScore = BUY_THRESHOLD;
  for (const offer of offers) {
    const s = scoreOffer(offer, tuning);
    if (s > bestScore) {
      best = offer;
      bestScore = s;
    }
  }
  return best;
}

export function spawnInterval(decorLevel: number): number {
  return Math.max(1.8, 3.6 - decorLevel * 0.45);
}

export function newCustomer(id: string, preferred: RecipeId | null): Customer {
  return {
    id,
    patience: 8,
    mood: "ok",
    wanted: preferred,
  };
}
