import { describe, expect, it } from "vitest";
import { STARTING_INGREDIENTS } from "../data/ingredients";
import type { IngredientId } from "../state/types";
import { ruleMet, unlockedIngredients, unlockedRecipes } from "./unlock";
import type { UnlockContext } from "./unlock";

const base = (): UnlockContext => ({
  level: 1,
  day: 1,
  lifetimeSold: {},
  completedGoals: [],
  unlockedIngredients: [...STARTING_INGREDIENTS],
});

describe("unlocks", () => {
  it("starts with white bread and pantry staples only", () => {
    const ctx = base();
    expect(unlockedRecipes(ctx)).toEqual(["white"]);
    expect(unlockedIngredients(ctx)).toEqual(["flour", "yeast", "sugar"]);
  });

  it("milk unlocks at level 2 once milk ingredient is open", () => {
    const ctx = { ...base(), level: 2 };
    ctx.unlockedIngredients = unlockedIngredients(ctx);
    expect(ctx.unlockedIngredients).toContain("milk");
    expect(unlockedRecipes(ctx)).toContain("milk");
  });

  it("egg tart can unlock via the first daily goal", () => {
    const ctx = {
      ...base(),
      completedGoals: ["first-five"],
      unlockedIngredients: [...STARTING_INGREDIENTS, "egg", "butter", "milk"] as IngredientId[],
    };
    expect(unlockedRecipes(ctx)).toContain("eggTart");
  });

  it("seasonal needs day 7 plus fruit and chocolate", () => {
    const extra: IngredientId[] = [...STARTING_INGREDIENTS, "fruit", "chocolate"];
    const early = { ...base(), day: 6, level: 8, unlockedIngredients: extra };
    expect(unlockedRecipes(early)).not.toContain("seasonal");
    const late = { ...early, day: 7 };
    expect(unlockedRecipes(late)).toContain("seasonal");
  });

  it("all/any compose", () => {
    expect(
      ruleMet(
        { type: "any", of: [{ type: "level", level: 9 }, { type: "sold", recipeId: "white", count: 2 }] },
        { ...base(), lifetimeSold: { white: 2 } },
      ),
    ).toBe(true);
  });
});
