import { SAVE_KEY, SAVE_VERSION } from "../config";
import { emptyInventory, STARTING_INGREDIENTS } from "../data/ingredients";
import type { SaveData, UpgradeId } from "../state/types";

const EMPTY_UPGRADES: Record<UpgradeId, number> = {
  ovenSlots: 0,
  ovenSpeed: 0,
  mixerSpeed: 0,
  shelves: 0,
  decor: 0,
  staff: 0,
};

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    day: 1,
    cash: 180,
    xp: 0,
    level: 1,
    inventory: emptyInventory(),
    unlockedRecipes: ["white"],
    unlockedIngredients: [...STARTING_INGREDIENTS],
    completedGoals: [],
    lifetimeSold: {},
    upgrades: { ...EMPTY_UPGRADES },
    prices: { white: 14 },
    pendingOrders: [],
    phaseHint: "prep",
  };
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** localStorage 不能真正 rename；成功寫入後同步備份，讀取失敗就回退。 */
export function persistSave(data: SaveData, storage: Storage | null = browserStorage()): void {
  if (!storage) return;
  const json = JSON.stringify({ ...data, version: SAVE_VERSION });
  const prev = storage.getItem(SAVE_KEY);
  if (prev) storage.setItem(`${SAVE_KEY}.bak`, prev);
  storage.setItem(SAVE_KEY, json);
  storage.setItem(`${SAVE_KEY}.bak`, json);
}

export function readSave(storage: Storage | null = browserStorage()): SaveData | null {
  if (!storage) return null;
  for (const key of [SAVE_KEY, `${SAVE_KEY}.bak`]) {
    const raw = storage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as SaveData;
      if (typeof parsed !== "object" || parsed == null) continue;
      return migrate(parsed);
    } catch {
      continue;
    }
  }
  return null;
}

export function clearSave(storage: Storage | null = browserStorage()): void {
  if (!storage) return;
  storage.removeItem(SAVE_KEY);
  storage.removeItem(`${SAVE_KEY}.bak`);
}

function migrate(data: SaveData): SaveData {
  const base = defaultSave();
  const version = Number(data.version ?? 1);
  if (version > SAVE_VERSION) {
    throw new Error("存檔版本較新，請更新遊戲");
  }
  return {
    ...base,
    ...data,
    version: SAVE_VERSION,
    inventory: { ...base.inventory, ...data.inventory },
    upgrades: { ...base.upgrades, ...data.upgrades },
    prices: { ...base.prices, ...data.prices },
    unlockedRecipes: data.unlockedRecipes?.length ? data.unlockedRecipes : base.unlockedRecipes,
    unlockedIngredients: data.unlockedIngredients?.length
      ? data.unlockedIngredients
      : base.unlockedIngredients,
    completedGoals: data.completedGoals ?? [],
    lifetimeSold: data.lifetimeSold ?? {},
    pendingOrders: Array.isArray(data.pendingOrders) ? data.pendingOrders : [],
  };
}
