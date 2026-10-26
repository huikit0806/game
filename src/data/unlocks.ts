import type { IngredientId, RecipeId, UnlockRule } from "../state/types";

/** 材料解鎖：起始只有粉／酵母／糖，其餘用等級或目標打開。 */
export const INGREDIENT_UNLOCKS: Record<IngredientId, UnlockRule> = {
  flour: { type: "start" },
  yeast: { type: "start" },
  sugar: { type: "start" },
  milk: { type: "level", level: 2 },
  butter: { type: "any", of: [{ type: "sold", recipeId: "white", count: 10 }, { type: "level", level: 3 }] },
  egg: { type: "any", of: [{ type: "goal", goalId: "first-five" }, { type: "level", level: 3 }] },
  chocolate: { type: "level", level: 4 },
  fruit: { type: "level", level: 5 },
};

/** 麵包解鎖：等級、銷量、每日目標、材料，可混合。 */
export const RECIPE_UNLOCKS: Record<RecipeId, UnlockRule> = {
  white: { type: "start" },
  milk: {
    type: "all",
    of: [
      { type: "ingredient", ingredientId: "milk" },
      { type: "any", of: [{ type: "sold", recipeId: "white", count: 8 }, { type: "level", level: 2 }] },
    ],
  },
  pineapple: {
    type: "all",
    of: [
      { type: "level", level: 3 },
      { type: "sold", recipeId: "milk", count: 8 },
      { type: "ingredient", ingredientId: "butter" },
      { type: "ingredient", ingredientId: "egg" },
    ],
  },
  eggTart: {
    type: "all",
    of: [
      { type: "ingredient", ingredientId: "egg" },
      { type: "any", of: [{ type: "goal", goalId: "first-five" }, { type: "sold", recipeId: "white", count: 15 }] },
    ],
  },
  croissant: {
    type: "all",
    of: [
      { type: "level", level: 5 },
      { type: "ingredient", ingredientId: "butter" },
    ],
  },
  danish: {
    type: "all",
    of: [
      { type: "sold", recipeId: "croissant", count: 8 },
      { type: "ingredient", ingredientId: "fruit" },
    ],
  },
  porkFloss: {
    type: "all",
    of: [
      { type: "level", level: 4 },
      { type: "goal", goalId: "profit-80" },
    ],
  },
  chocolate: {
    type: "all",
    of: [
      { type: "ingredient", ingredientId: "chocolate" },
      { type: "sold", recipeId: "milk", count: 12 },
    ],
  },
  seasonal: {
    type: "all",
    of: [
      { type: "day", day: 7 },
      { type: "ingredient", ingredientId: "fruit" },
      { type: "ingredient", ingredientId: "chocolate" },
    ],
  },
};
