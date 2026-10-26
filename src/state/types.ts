/** 遊戲純資料型別。存檔只序列化這些，不序列化 Phaser 物件。 */

export type IngredientId =
  | "flour"
  | "yeast"
  | "sugar"
  | "butter"
  | "egg"
  | "milk"
  | "fruit"
  | "chocolate";

export type RecipeId =
  | "white"
  | "milk"
  | "pineapple"
  | "eggTart"
  | "croissant"
  | "danish"
  | "porkFloss"
  | "chocolate"
  | "seasonal";

export type Phase = "title" | "prep" | "kitchen" | "shop" | "settle";

export type StepKind = "mix" | "knead" | "proof" | "bake";

export interface RecipeStep {
  kind: StepKind;
  /** 基礎互動次數 / 持續秒數，會被攪拌機升級縮短。 */
  effort: number;
}

export interface RecipeDef {
  id: RecipeId;
  name: string;
  blurb: string;
  /** 每份消耗的材料。 */
  cost: Partial<Record<IngredientId, number>>;
  steps: RecipeStep[];
  /** 建議售價（玩家可即時調整）。 */
  suggestedPrice: number;
  /** 每分鐘新鮮度衰減（營業中）。 */
  freshnessDecayPerMin: number;
  /** 受歡迎程度，影響客人選擇權重。 */
  popularity: number;
  /** 烘烤秒數（未升級）。 */
  bakeSeconds: number;
  tint: number;
}

export interface IngredientDef {
  id: IngredientId;
  name: string;
  /** 基準進貨價，每日會輕微波動。 */
  basePrice: number;
}

export type UnlockRule =
  | { type: "start" }
  | { type: "level"; level: number }
  | { type: "sold"; recipeId: RecipeId; count: number }
  | { type: "goal"; goalId: string }
  | { type: "ingredient"; ingredientId: IngredientId }
  | { type: "day"; day: number }
  | { type: "all"; of: UnlockRule[] }
  | { type: "any"; of: UnlockRule[] };

export type UpgradeId =
  | "ovenSlots"
  | "ovenSpeed"
  | "mixerSpeed"
  | "shelves"
  | "decor"
  | "staff";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  blurb: string;
  maxLevel: number;
  costs: number[];
}

export interface Loaf {
  id: string;
  recipeId: RecipeId;
  freshness: number;
  /** 0 = 櫃檯托盤，>=0 = 展示架格。 */
  shelf: number | null;
}

export interface OvenSlot {
  loafId: string | null;
  recipeId: RecipeId | null;
  remaining: number;
  total: number;
}

export interface Customer {
  id: string;
  patience: number;
  mood: "happy" | "ok" | "sad";
  wanted: RecipeId | null;
}

export interface DayLog {
  revenue: number;
  materialCost: number;
  sold: Partial<Record<RecipeId, number>>;
  wasted: number;
  customersServed: number;
  customersLeft: number;
  xpEarned: number;
}

export interface DailyGoal {
  id: string;
  title: string;
  /** 完成條件由 GameState 檢查。 */
  kind: "sellAny" | "profit" | "sellRecipe" | "noWaste";
  target: number;
  recipeId?: RecipeId;
  rewardXp: number;
  rewardCash: number;
}

export interface SaveData {
  version: number;
  day: number;
  cash: number;
  xp: number;
  level: number;
  inventory: Record<IngredientId, number>;
  unlockedRecipes: RecipeId[];
  unlockedIngredients: IngredientId[];
  completedGoals: string[];
  lifetimeSold: Partial<Record<RecipeId, number>>;
  upgrades: Record<UpgradeId, number>;
  prices: Partial<Record<RecipeId, number>>;
  /** 下一日開始時套用。營業中不存即時麵包，避免卡在半日。 */
  phaseHint: Phase;
}
