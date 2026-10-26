import { describe, expect, it } from "vitest";
import { BUY_THRESHOLD, pickPurchase, scoreOffer, type Offer } from "./shop";

function offer(over: Partial<Offer> = {}): Offer {
  return {
    loaf: { id: "a", recipeId: "white", freshness: 95, shelf: 0 },
    price: 14,
    sale: false,
    featured: false,
    ...over,
  };
}

const tuning = { shopLevel: 1, decorLevel: 0 };

describe("shop scoring", () => {
  it("stale bread scores zero", () => {
    expect(scoreOffer(offer({ loaf: { id: "b", recipeId: "white", freshness: 10, shelf: 0 } }), tuning)).toBe(0);
  });

  it("featured sale outranks a plain loaf", () => {
    const plain = scoreOffer(offer(), tuning);
    const boosted = scoreOffer(offer({ featured: true, sale: true }), tuning);
    expect(boosted).toBeGreaterThan(plain);
  });

  it("picks nothing when every offer is below the threshold", () => {
    const bad = offer({
      loaf: { id: "c", recipeId: "white", freshness: 20, shelf: 0 },
      price: 40,
    });
    expect(scoreOffer(bad, tuning)).toBeLessThan(BUY_THRESHOLD);
    expect(pickPurchase([bad], tuning)).toBeNull();
  });

  it("picks the higher scoring loaf", () => {
    const cheap = offer({ price: 10, loaf: { id: "d", recipeId: "white", freshness: 90, shelf: 0 } });
    const pricey = offer({ price: 22, loaf: { id: "e", recipeId: "white", freshness: 90, shelf: 1 } });
    expect(pickPurchase([pricey, cheap], tuning)?.loaf.id).toBe("d");
  });
});
