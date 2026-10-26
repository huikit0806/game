import type { IngredientDef, IngredientId } from "../state/types";

export const INGREDIENTS: IngredientDef[] = [
  { id: "flour", name: "麵粉", basePrice: 4 },
  { id: "yeast", name: "酵母", basePrice: 3 },
  { id: "sugar", name: "糖", basePrice: 3 },
  { id: "butter", name: "牛油", basePrice: 6 },
  { id: "egg", name: "雞蛋", basePrice: 5 },
  { id: "milk", name: "牛奶", basePrice: 5 },
  { id: "fruit", name: "水果", basePrice: 7 },
  { id: "chocolate", name: "巧克力", basePrice: 8 },
];

export const INGREDIENT_MAP = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
) as Record<IngredientId, IngredientDef>;

export const STARTING_INGREDIENTS: IngredientId[] = ["flour", "yeast", "sugar"];

export function emptyInventory(): Record<IngredientId, number> {
  return {
    flour: 12,
    yeast: 6,
    sugar: 6,
    butter: 0,
    egg: 0,
    milk: 0,
    fruit: 0,
    chocolate: 0,
  };
}
