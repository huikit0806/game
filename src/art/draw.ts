import Phaser from "phaser";
import { RECIPE_MAP } from "../data/recipes";
import type { RecipeId } from "../state/types";
import { C } from "../ui/theme";

/** 程序化線條麵包：不用位圖，方便之後加新款只改 tint／形狀。 */
export function drawLoaf(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  recipeId: RecipeId,
  scale = 1,
): void {
  const recipe = RECIPE_MAP[recipeId];
  g.lineStyle(2.2 * scale, C.ink, 0.9);
  g.fillStyle(recipe.tint, 1);
  if (recipeId === "croissant") {
    g.fillCircle(x, y, 16 * scale);
    g.strokeCircle(x, y, 16 * scale);
    g.beginPath();
    g.arc(x, y, 10 * scale, 0.4, 2.6);
    g.strokePath();
  } else if (recipeId === "eggTart") {
    g.fillStyle(0xd9a066, 1);
    g.fillEllipse(x, y + 2 * scale, 20 * scale, 14 * scale);
    g.strokeEllipse(x, y + 2 * scale, 20 * scale, 14 * scale);
    g.fillStyle(recipe.tint, 1);
    g.fillEllipse(x, y, 13 * scale, 9 * scale);
    g.strokeEllipse(x, y, 13 * scale, 9 * scale);
  } else if (recipeId === "pineapple") {
    g.fillRoundedRect(x - 16 * scale, y - 12 * scale, 32 * scale, 24 * scale, 8 * scale);
    g.strokeRoundedRect(x - 16 * scale, y - 12 * scale, 32 * scale, 24 * scale, 8 * scale);
    g.lineStyle(1.4 * scale, C.ink, 0.45);
    g.strokeCircle(x - 6 * scale, y - 2 * scale, 4 * scale);
    g.strokeCircle(x + 5 * scale, y + 3 * scale, 4 * scale);
  } else {
    g.fillRoundedRect(x - 18 * scale, y - 10 * scale, 36 * scale, 22 * scale, 10 * scale);
    g.strokeRoundedRect(x - 18 * scale, y - 10 * scale, 36 * scale, 22 * scale, 10 * scale);
    g.lineStyle(1.6 * scale, C.ink, 0.35);
    g.lineBetween(x - 8 * scale, y - 4 * scale, x + 10 * scale, y - 4 * scale);
  }
}

export function drawFace(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  mood: "happy" | "ok" | "sad",
): void {
  g.fillStyle(0xffe0c2, 1);
  g.lineStyle(2, C.ink, 0.9);
  g.fillCircle(x, y, 16);
  g.strokeCircle(x, y, 16);
  g.fillStyle(C.ink, 1);
  g.fillCircle(x - 5, y - 2, 1.6);
  g.fillCircle(x + 5, y - 2, 1.6);
  g.lineStyle(2, C.ink, 0.9);
  g.beginPath();
  if (mood === "happy") g.arc(x, y + 3, 5, 0.2, Math.PI - 0.2);
  else if (mood === "sad") g.arc(x, y + 8, 5, Math.PI + 0.2, -0.2);
  else g.lineBetween(x - 4, y + 5, x + 4, y + 5);
  g.strokePath();
}

export function pop(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): void {
  scene.tweens.add({
    targets: target,
    scaleX: 1.18,
    scaleY: 0.88,
    duration: 80,
    yoyo: true,
    ease: "Back.easeOut",
  });
}

/** 出爐蒸汽：短暫上升後消失，不進模擬。 */
export function puffSteam(scene: Phaser.Scene, x: number, y: number): void {
  for (let i = 0; i < 5; i++) {
    const c = scene.add.circle(x + (i - 2) * 7, y, 5 + i, 0xfffdf8, 0.7).setDepth(12);
    scene.tweens.add({
      targets: c,
      y: y - 28 - i * 4,
      alpha: 0,
      scale: 1.8,
      duration: 420 + i * 40,
      ease: "Sine.easeOut",
      onComplete: () => c.destroy(),
    });
  }
}
