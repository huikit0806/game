import { describe, expect, it } from "vitest";
import { dailyPrices, priceFactor, profit, xpToNext } from "./economy";

describe("economy", () => {
  it("same day yields the same ingredient prices", () => {
    expect(dailyPrices(3)).toEqual(dailyPrices(3));
  });

  it("different days usually shift at least one price", () => {
    expect(dailyPrices(1)).not.toEqual(dailyPrices(8));
  });

  it("cheap prices sell better than overpriced ones", () => {
    expect(priceFactor(10, 14)).toBeGreaterThan(priceFactor(20, 14));
    expect(priceFactor(30, 14)).toBeLessThan(0.3);
  });

  it("profit and xp curve are simple and monotonic", () => {
    expect(profit(100, 40)).toBe(60);
    expect(xpToNext(2)).toBeGreaterThan(xpToNext(1));
  });
});
