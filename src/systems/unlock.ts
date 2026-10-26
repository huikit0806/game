import { INGREDIENT_UNLOCKS, RECIPE_UNLOCKS } from "../data/unlocks";
import type { IngredientId, RecipeId, UnlockRule } from "../state/types";

export interface UnlockContext {
  level: number;
  day: number;
  lifetimeSold: Partial<Record<RecipeId, number>>;
  completedGoals: string[];
  unlockedIngredients: IngredientId[];
}

export function ruleMet(rule: UnlockRule, ctx: UnlockContext): boolean {
  switch (rule.type) {
    case "start":
      return true;
    case "level":
      return ctx.level >= rule.level;
    case "sold":
      return (ctx.lifetimeSold[rule.recipeId] ?? 0) >= rule.count;
    case "goal":
      return ctx.completedGoals.includes(rule.goalId);
    case "ingredient":
      return ctx.unlockedIngredients.includes(rule.ingredientId);
    case "day":
      return ctx.day >= rule.day;
    case "all":
      return rule.of.every((r) => ruleMet(r, ctx));
    case "any":
      return rule.of.some((r) => ruleMet(r, ctx));
  }
}

export function unlockedIngredients(ctx: UnlockContext): IngredientId[] {
  return (Object.keys(INGREDIENT_UNLOCKS) as IngredientId[]).filter((id) =>
    ruleMet(INGREDIENT_UNLOCKS[id], ctx),
  );
}

export function unlockedRecipes(ctx: UnlockContext): RecipeId[] {
  return (Object.keys(RECIPE_UNLOCKS) as RecipeId[]).filter((id) =>
    ruleMet(RECIPE_UNLOCKS[id], ctx),
  );
}

export function describeRule(rule: UnlockRule): string {
  switch (rule.type) {
    case "start":
      return "起始解鎖";
    case "level":
      return `達到 ${rule.level} 級`;
    case "sold":
      return `累計賣出指定麵包 ${rule.count} 個`;
    case "goal":
      return "完成指定每日目標";
    case "ingredient":
      return "解鎖對應材料";
    case "day":
      return `經營滿 ${rule.day} 日`;
    case "all":
      return rule.of.map(describeRule).join(" 且 ");
    case "any":
      return rule.of.map(describeRule).join(" 或 ");
  }
}
