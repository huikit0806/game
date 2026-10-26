import {
  STARTING_CASH,
  STARTING_OVEN_SLOTS,
  STARTING_SHELVES,
  SHOP_SECONDS,
} from "../config";
import { RECIPE_MAP } from "../data/recipes";
import { UPGRADE_MAP } from "../data/upgrades";
import { dailyPrices, xpToNext } from "../systems/economy";
import { goalForDay } from "../systems/goals";
import { pickPurchase, spawnInterval, type Offer } from "../systems/shop";
import { unlockedIngredients, unlockedRecipes, type UnlockContext } from "../systems/unlock";
import { defaultSave, persistSave } from "../systems/save";
import type {
  Customer,
  DailyGoal,
  DayLog,
  IngredientId,
  Loaf,
  OvenSlot,
  Phase,
  RecipeId,
  SaveData,
  UpgradeId,
} from "./types";

let loafSeq = 0;
let custSeq = 0;

/**
 * 權威遊戲狀態。場景只讀寫這裡，不各自記進度。
 * 日循環：prep（訂料／主推）→ kitchen（做包／烘烤）→ shop（上架／賣）→ settle。
 */
export class GameState {
  day = 1;
  cash = STARTING_CASH;
  xp = 0;
  level = 1;
  phase: Phase = "prep";

  inventory: Record<IngredientId, number> = defaultSave().inventory;
  unlockedRecipes: RecipeId[] = ["white"];
  unlockedIngredients: IngredientId[] = defaultSave().unlockedIngredients;
  completedGoals: string[] = [];
  lifetimeSold: Partial<Record<RecipeId, number>> = {};
  upgrades: Record<UpgradeId, number> = { ...defaultSave().upgrades };

  prices: Partial<Record<RecipeId, number>> = { white: 14 };
  sales: Partial<Record<RecipeId, boolean>> = {};
  featured: RecipeId[] = ["white"];
  todayPrices: Record<IngredientId, number> = dailyPrices(1);

  loaves: Loaf[] = [];
  ovens: OvenSlot[] = Array.from({ length: STARTING_OVEN_SLOTS }, () => ({
    loafId: null,
    recipeId: null,
    remaining: 0,
    total: 1,
  }));
  customers: Customer[] = [];
  cart: Partial<Record<IngredientId, number>> = {};

  shopTime = SHOP_SECONDS;
  spawnTimer = 0;
  thinkTimer = 0;
  log: DayLog = emptyLog();
  goal: DailyGoal = goalForDay(1);
  goalJustDone = false;
  lastUnlocks: string[] = [];

  /** 當日已付材料費（訂貨當下扣錢，結算再展示）。 */
  paidMaterials = 0;

  applySave(data: SaveData): void {
    this.day = data.day;
    this.cash = data.cash;
    this.xp = data.xp;
    this.level = data.level;
    this.inventory = { ...data.inventory };
    this.unlockedRecipes = [...data.unlockedRecipes];
    this.unlockedIngredients = [...data.unlockedIngredients];
    this.completedGoals = [...data.completedGoals];
    this.lifetimeSold = { ...data.lifetimeSold };
    this.upgrades = { ...data.upgrades };
    this.prices = { ...data.prices };
    this.phase = "prep";
    this.beginDay(false);
  }

  toSave(): SaveData {
    return {
      version: 1,
      day: this.day,
      cash: this.cash,
      xp: this.xp,
      level: this.level,
      inventory: { ...this.inventory },
      unlockedRecipes: [...this.unlockedRecipes],
      unlockedIngredients: [...this.unlockedIngredients],
      completedGoals: [...this.completedGoals],
      lifetimeSold: { ...this.lifetimeSold },
      upgrades: { ...this.upgrades },
      prices: { ...this.prices },
      phaseHint: "prep",
    };
  }

  persist(): void {
    persistSave(this.toSave());
  }

  beginDay(advanceDay: boolean): void {
    if (advanceDay) this.day += 1;
    this.phase = "prep";
    this.todayPrices = dailyPrices(this.day);
    this.cart = {};
    this.loaves = [];
    this.customers = [];
    this.paidMaterials = 0;
    this.shopTime = SHOP_SECONDS;
    this.spawnTimer = 0.6;
    this.thinkTimer = 0.8;
    this.log = emptyLog();
    this.goal = goalForDay(this.day);
    this.goalJustDone = false;
    this.lastUnlocks = [];
    this.sales = {};
    this.featured = this.featured.filter((id) => this.unlockedRecipes.includes(id));
    if (this.featured.length === 0 && this.unlockedRecipes[0]) {
      this.featured = [this.unlockedRecipes[0]];
    }
    this.rebuildOvens();
    this.refreshUnlocks();
    this.persist();
  }

  rebuildOvens(): void {
    const slots = STARTING_OVEN_SLOTS + this.upgrades.ovenSlots;
    this.ovens = Array.from({ length: slots }, () => ({
      loafId: null,
      recipeId: null,
      remaining: 0,
      total: 1,
    }));
  }

  shelfCount(): number {
    return STARTING_SHELVES + this.upgrades.shelves;
  }

  mixerFactor(): number {
    return 1 / (1 + this.upgrades.mixerSpeed * 0.22);
  }

  bakeFactor(): number {
    return 1 / (1 + this.upgrades.ovenSpeed * 0.18);
  }

  ctx(): UnlockContext {
    return {
      level: this.level,
      day: this.day,
      lifetimeSold: this.lifetimeSold,
      completedGoals: this.completedGoals,
      unlockedIngredients: this.unlockedIngredients,
    };
  }

  refreshUnlocks(): string[] {
    const beforeR = new Set(this.unlockedRecipes);
    const beforeI = new Set(this.unlockedIngredients);
    this.unlockedIngredients = unlockedIngredients(this.ctx());
    this.unlockedRecipes = unlockedRecipes({
      ...this.ctx(),
      unlockedIngredients: this.unlockedIngredients,
    });
    const news: string[] = [];
    for (const id of this.unlockedIngredients) {
      if (!beforeI.has(id)) news.push(`材料：${id}`);
    }
    for (const id of this.unlockedRecipes) {
      if (!beforeR.has(id)) {
        news.push(`麵包：${RECIPE_MAP[id].name}`);
        if (this.prices[id] == null) this.prices[id] = RECIPE_MAP[id].suggestedPrice;
      }
    }
    this.lastUnlocks = news;
    return news;
  }

  setCart(id: IngredientId, qty: number): void {
    if (!this.unlockedIngredients.includes(id)) return;
    this.cart[id] = Math.max(0, Math.floor(qty));
  }

  cartTotal(): number {
    let sum = 0;
    for (const [id, qty] of Object.entries(this.cart)) {
      sum += (this.todayPrices[id as IngredientId] ?? 0) * (qty ?? 0);
    }
    return sum;
  }

  checkoutCart(): boolean {
    const total = this.cartTotal();
    if (total > this.cash) return false;
    this.cash -= total;
    this.paidMaterials += total;
    this.log.materialCost += total;
    for (const [id, qty] of Object.entries(this.cart)) {
      const key = id as IngredientId;
      this.inventory[key] = (this.inventory[key] ?? 0) + (qty ?? 0);
    }
    this.cart = {};
    this.persist();
    return true;
  }

  toggleFeatured(id: RecipeId): void {
    if (!this.unlockedRecipes.includes(id)) return;
    const i = this.featured.indexOf(id);
    if (i >= 0) this.featured.splice(i, 1);
    else if (this.featured.length < 2) this.featured.push(id);
  }

  canCraft(id: RecipeId): boolean {
    if (!this.unlockedRecipes.includes(id)) return false;
    const recipe = RECIPE_MAP[id];
    return Object.entries(recipe.cost).every(
      ([ing, qty]) => (this.inventory[ing as IngredientId] ?? 0) >= (qty ?? 0),
    );
  }

  consumeCraft(id: RecipeId): boolean {
    if (!this.canCraft(id)) return false;
    for (const [ing, qty] of Object.entries(RECIPE_MAP[id].cost)) {
      this.inventory[ing as IngredientId] -= qty ?? 0;
    }
    return true;
  }

  refundCraft(id: RecipeId): void {
    for (const [ing, qty] of Object.entries(RECIPE_MAP[id].cost)) {
      this.inventory[ing as IngredientId] += qty ?? 0;
    }
  }

  /** 小遊戲失敗只扣一點新鮮度，不做報廢。 */
  finishBake(recipeId: RecipeId, freshness: number): Loaf {
    const loaf: Loaf = {
      id: `loaf-${++loafSeq}`,
      recipeId,
      freshness: Math.max(55, Math.min(100, freshness)),
      shelf: null,
    };
    this.loaves.push(loaf);
    return loaf;
  }

  startOven(recipeId: RecipeId, freshness: number): boolean {
    const slot = this.ovens.find((o) => o.loafId == null);
    if (!slot) return false;
    const id = `loaf-${++loafSeq}`;
    const bake = RECIPE_MAP[recipeId].bakeSeconds * this.bakeFactor();
    slot.loafId = id;
    slot.recipeId = recipeId;
    slot.remaining = bake;
    slot.total = bake;
    this.pendingFresh.set(id, Math.max(55, Math.min(100, freshness)));
    return true;
  }

  private pendingFresh = new Map<string, number>();

  tickKitchen(dt: number): Loaf[] {
    const done: Loaf[] = [];
    for (const slot of this.ovens) {
      if (!slot.loafId || !slot.recipeId) continue;
      slot.remaining -= dt;
      if (slot.remaining <= 0) {
        const loaf: Loaf = {
          id: slot.loafId,
          recipeId: slot.recipeId,
          freshness: this.pendingFresh.get(slot.loafId) ?? 92,
          shelf: null,
        };
        this.pendingFresh.delete(slot.loafId);
        slot.loafId = null;
        slot.recipeId = null;
        slot.remaining = 0;
        this.loaves.push(loaf);
        done.push(loaf);
      }
    }
    return done;
  }

  trayLoaves(): Loaf[] {
    return this.loaves.filter((l) => l.shelf == null && l.freshness > 0);
  }

  shelfLoaves(index: number): Loaf[] {
    return this.loaves.filter((l) => l.shelf === index && l.freshness > 0);
  }

  /** 把托盤上的包依序補到空位，回傳成功上架數量。 */
  stockShelves(): number {
    let n = 0;
    for (const loaf of this.trayLoaves()) {
      for (let s = 0; s < this.shelfCount(); s++) {
        if (this.placeOnShelf(loaf.id, s)) {
          n += 1;
          break;
        }
      }
    }
    return n;
  }

  placeOnShelf(loafId: string, shelf: number): boolean {
    if (shelf < 0 || shelf >= this.shelfCount()) return false;
    const loaf = this.loaves.find((l) => l.id === loafId);
    if (!loaf) return false;
    const occupied = this.loaves.filter((l) => l.shelf === shelf && l.freshness > 0);
    if (occupied.length >= 2) return false;
    loaf.shelf = shelf;
    return true;
  }

  setPrice(id: RecipeId, price: number): void {
    this.prices[id] = Math.max(4, Math.round(price));
  }

  toggleSale(id: RecipeId): void {
    this.sales[id] = !this.sales[id];
  }

  startShop(): void {
    this.phase = "shop";
    this.shopTime = SHOP_SECONDS;
    this.spawnTimer = 0.4;
    this.thinkTimer = 0.7;
    this.customers = [];
  }

  tickShop(dt: number): {
    bought: Loaf | null;
    left: boolean;
    spawned: boolean;
    baked: Loaf[];
    staffed: Loaf[];
  } {
    const result = {
      bought: null as Loaf | null,
      left: false,
      spawned: false,
      baked: [] as Loaf[],
      staffed: [] as Loaf[],
    };
    if (!this.isArranging()) this.shopTime -= dt;
    result.baked = this.tickKitchen(dt);
    this.decayFreshness(dt);
    result.staffed = this.autoStaff();

    for (const c of this.customers) c.patience -= dt;
    const leaving = this.customers.filter((c) => c.patience <= 0);
    if (leaving.length) {
      this.customers = this.customers.filter((c) => c.patience > 0);
      this.log.customersLeft += leaving.length;
      result.left = true;
    }

    this.spawnTimer -= dt;
    const onShelf = this.loaves.some((l) => l.shelf != null && l.freshness > 0);
    if (onShelf && this.spawnTimer <= 0 && this.customers.length < 4 && this.shopTime > 3) {
      this.spawnTimer = spawnInterval(this.upgrades.decor);
      const preferred = this.featured[Math.floor(Math.random() * this.featured.length)] ?? null;
      this.customers.push({
        id: `c-${++custSeq}`,
        patience: 7 + Math.random() * 3,
        mood: "ok",
        wanted: preferred,
      });
      result.spawned = true;
    }

    const buyer = this.customers[0];
    if (buyer) {
      this.thinkTimer -= dt;
      const offers = this.currentOffers();
      if (this.thinkTimer <= 0) {
        this.thinkTimer = 0.85;
        const picked = pickPurchase(offers, {
          shopLevel: this.level,
          decorLevel: this.upgrades.decor,
        });
        if (picked) {
          result.bought = this.sell(picked.loaf, picked.price);
          buyer.mood = "happy";
          this.customers.shift();
        } else if (offers.length === 0) {
          buyer.mood = "sad";
          buyer.patience -= 2;
        } else {
          buyer.mood = "sad";
        }
      }
    }

    return result;
  }

  private currentOffers(): Offer[] {
    return this.loaves
      .filter((l) => l.shelf != null && l.freshness > 0)
      .map((loaf) => ({
        loaf,
        price: this.effectivePrice(loaf.recipeId),
        sale: !!this.sales[loaf.recipeId],
        featured: this.featured.includes(loaf.recipeId),
      }));
  }

  effectivePrice(id: RecipeId): number {
    const base = this.prices[id] ?? RECIPE_MAP[id].suggestedPrice;
    return this.sales[id] ? Math.round(base * 0.85) : base;
  }

  private sell(loaf: Loaf, price: number): Loaf {
    loaf.freshness = 0;
    loaf.shelf = null;
    this.cash += price;
    this.log.revenue += price;
    this.log.sold[loaf.recipeId] = (this.log.sold[loaf.recipeId] ?? 0) + 1;
    this.log.customersServed += 1;
    this.lifetimeSold[loaf.recipeId] = (this.lifetimeSold[loaf.recipeId] ?? 0) + 1;
    return loaf;
  }

  private decayFreshness(dt: number): void {
    for (const loaf of this.loaves) {
      if (loaf.freshness <= 0) continue;
      const decay = RECIPE_MAP[loaf.recipeId].freshnessDecayPerMin * (dt / 60);
      loaf.freshness -= decay;
      if (loaf.freshness <= 0) {
        loaf.freshness = 0;
        this.log.wasted += 1;
      }
    }
  }

  /** 員工：把托盤上的包自動補到空架。 */
  private autoStaff(): Loaf[] {
    const moved: Loaf[] = [];
    if (this.upgrades.staff <= 0) return moved;
    for (const loaf of this.trayLoaves()) {
      for (let s = 0; s < this.shelfCount(); s++) {
        if (this.placeOnShelf(loaf.id, s)) {
          moved.push(loaf);
          break;
        }
      }
    }
    return moved;
  }

  isArranging(): boolean {
    return (
      this.trayLoaves().length > 0 &&
      !this.loaves.some((l) => l.shelf != null && l.freshness > 0)
    );
  }

  isShopOver(): boolean {
    return this.shopTime <= 0;
  }

  settle(): DayLog {
    for (const loaf of this.loaves) {
      if (loaf.freshness > 0) {
        this.log.wasted += 1;
        loaf.freshness = 0;
      }
    }
    this.loaves = [];
    this.customers = [];
    const salesCount = Object.values(this.log.sold).reduce((a, b) => a + (b ?? 0), 0);
    const profit = this.log.revenue - this.log.materialCost;
    this.log.xpEarned = 12 + salesCount * 3 + Math.max(0, Math.floor(profit / 8));
    this.checkGoal();
    this.addXp(this.log.xpEarned);
    this.phase = "settle";
    this.refreshUnlocks();
    this.persist();
    return this.log;
  }

  private checkGoal(): void {
    if (this.completedGoals.includes(this.goal.id)) return;
    const soldAny = Object.values(this.log.sold).reduce((a, b) => a + (b ?? 0), 0);
    const profit = this.log.revenue - this.log.materialCost;
    let ok = false;
    if (this.goal.kind === "sellAny") ok = soldAny >= this.goal.target;
    if (this.goal.kind === "profit") ok = profit >= this.goal.target;
    if (this.goal.kind === "sellRecipe") {
      ok = (this.log.sold[this.goal.recipeId!] ?? 0) >= this.goal.target;
    }
    if (this.goal.kind === "noWaste") ok = this.log.wasted === 0 && soldAny > 0;
    if (ok) {
      this.completedGoals.push(this.goal.id);
      this.cash += this.goal.rewardCash;
      this.addXp(this.goal.rewardXp);
      this.goalJustDone = true;
    }
  }

  addXp(amount: number): void {
    this.xp += amount;
    while (this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level += 1;
    }
  }

  buyUpgrade(id: UpgradeId): boolean {
    const def = UPGRADE_MAP[id];
    const lv = this.upgrades[id];
    if (!def || lv >= def.maxLevel) return false;
    const cost = def.costs[lv];
    if (this.cash < cost) return false;
    this.cash -= cost;
    this.upgrades[id] = lv + 1;
    this.rebuildOvens();
    this.persist();
    return true;
  }

  bestSeller(): { id: RecipeId; count: number } | null {
    let best: { id: RecipeId; count: number } | null = null;
    for (const [id, count] of Object.entries(this.log.sold)) {
      if (!best || (count ?? 0) > best.count) best = { id: id as RecipeId, count: count ?? 0 };
    }
    return best;
  }
}

function emptyLog(): DayLog {
  return {
    revenue: 0,
    materialCost: 0,
    sold: {},
    wasted: 0,
    customersServed: 0,
    customersLeft: 0,
    xpEarned: 0,
  };
}

let singleton: GameState | null = null;

export function game(): GameState {
  if (!singleton) singleton = new GameState();
  return singleton;
}

export function resetGame(): GameState {
  singleton = new GameState();
  return singleton;
}
