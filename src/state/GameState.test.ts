import { describe, expect, it } from "vitest";
import { GameState } from "./GameState";

describe("GameState day loop", () => {
  it("lets the player order flour and bake a white loaf", () => {
    const g = new GameState();
    g.setCart("flour", 2);
    expect(g.checkoutCart()).toBe(true);
    expect(g.inventory.flour).toBeGreaterThanOrEqual(12);
    expect(g.canCraft("white")).toBe(true);
    expect(g.consumeCraft("white")).toBe(true);
    expect(g.startOven("white", 96)).toBe(true);
    g.tickKitchen(20);
    expect(g.trayLoaves()).toHaveLength(1);
    expect(g.trayLoaves()[0].recipeId).toBe("white");
  });

  it("does not run the shop clock until a loaf is shelved", () => {
    const g = new GameState();
    g.consumeCraft("white");
    g.startOven("white", 100);
    g.tickKitchen(20);
    g.startShop();
    const before = g.shopTime;
    g.tickShop(2);
    expect(g.shopTime).toBe(before);
    expect(g.customers).toHaveLength(0);
    expect(g.stockShelves()).toBe(1);
    expect(g.shelfLoaves(0)).toHaveLength(1);
    g.tickShop(1);
    expect(g.shopTime).toBeLessThan(before);
  });

  it("sells a shelved loaf and records the day", () => {
    const g = new GameState();
    g.consumeCraft("white");
    g.startOven("white", 100);
    g.tickKitchen(20);
    const loaf = g.trayLoaves()[0];
    expect(g.placeOnShelf(loaf.id, 0)).toBe(true);
    g.startShop();
    // 多 tick 直到有客人買或時間結束。
    for (let i = 0; i < 200 && g.trayLoaves().length + g.shelfLoaves(0).length > 0; i++) {
      g.tickShop(0.25);
    }
    const log = g.settle();
    expect(log.revenue + log.wasted).toBeGreaterThan(0);
  });

  it("refunds ingredients when a bake cannot start", () => {
    const g = new GameState();
    const flour = g.inventory.flour;
    expect(g.consumeCraft("white")).toBe(true);
    g.refundCraft("white");
    expect(g.inventory.flour).toBe(flour);
  });

  it("refuses an upgrade the player cannot afford", () => {
    const g = new GameState();
    g.cash = 10;
    expect(g.buyUpgrade("ovenSlots")).toBe(false);
    g.cash = 200;
    expect(g.buyUpgrade("ovenSlots")).toBe(true);
    expect(g.ovens.length).toBe(3);
  });
});
