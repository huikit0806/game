import type { DailyGoal } from "../state/types";

/** 輪播每日目標。完成會記入 completedGoals，用來解鎖蛋撻／肉鬆包等。 */
export const GOAL_POOL: DailyGoal[] = [
  { id: "first-five", title: "賣出 5 個麵包", kind: "sellAny", target: 5, rewardXp: 20, rewardCash: 15 },
  { id: "profit-80", title: "今日利潤達 $80", kind: "profit", target: 80, rewardXp: 25, rewardCash: 20 },
  { id: "sell-white-6", title: "賣出 6 個白麵包", kind: "sellRecipe", target: 6, recipeId: "white", rewardXp: 18, rewardCash: 12 },
  { id: "no-waste", title: "今日零浪費", kind: "noWaste", target: 0, rewardXp: 22, rewardCash: 18 },
];

export function goalForDay(day: number): DailyGoal {
  return GOAL_POOL[(day - 1) % GOAL_POOL.length];
}
