import Phaser from "phaser";
import { C, textStyle } from "./theme";

export function roundRect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number,
  stroke = C.line,
  radius = 14,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(fill, 1);
  g.lineStyle(2, stroke, 1);
  g.fillRoundedRect(x, y, w, h, radius);
  g.strokeRoundedRect(x, y, w, h, radius);
  return g;
}

export interface Btn {
  container: Phaser.GameObjects.Container;
  setLabel: (t: string) => void;
  setEnabled: (on: boolean) => void;
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  fill = C.accent,
): Btn {
  const bg = scene.add.graphics();
  const paint = (color: number) => {
    bg.clear();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, C.ink, 0.18);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
  };
  paint(fill);
  const text = scene.add
    .text(0, 0, label, textStyle(16, "#fffdf8", { fontStyle: "bold", align: "center" }))
    .setOrigin(0.5);
  const hit = scene.add.rectangle(0, 0, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
  const container = scene.add.container(x, y, [bg, text, hit]);
  let enabled = true;
  hit.on("pointerdown", () => {
    if (!enabled) return;
    scene.tweens.add({
      targets: container,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 70,
      yoyo: true,
      ease: "Back.easeOut",
    });
    onClick();
  });
  return {
    container,
    setLabel: (t) => text.setText(t),
    setEnabled: (on) => {
      enabled = on;
      paint(on ? fill : C.line);
      text.setAlpha(on ? 1 : 0.7);
    },
  };
}

export function progressBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  depth = 0,
): { set: (t: number) => void; destroy: () => void } {
  const g = scene.add.graphics().setDepth(depth);
  const set = (t: number) => {
    const p = Phaser.Math.Clamp(t, 0, 1);
    g.clear();
    g.fillStyle(C.cream, 1);
    g.lineStyle(2, C.line, 1);
    g.fillRoundedRect(x, y, w, h, 8);
    g.strokeRoundedRect(x, y, w, h, 8);
    if (p > 0) {
      g.fillStyle(C.accent, 1);
      g.fillRoundedRect(x + 2, y + 2, Math.max(4, (w - 4) * p), h - 4, 6);
    }
  };
  set(0);
  return { set, destroy: () => g.destroy() };
}

export function topBar(scene: Phaser.Scene, title: string, cash: number, day: number, level: number): void {
  const { width } = scene.scale;
  roundRect(scene, 12, 16, width - 24, 54, C.white, C.line, 16);
  scene.add.text(26, 24, title, textStyle(16, "#5c3d2e", { fontStyle: "bold" }));
  scene.add.text(26, 44, `第 ${day} 日 · Lv.${level}`, textStyle(12, "#8a6a55"));
  scene.add
    .text(width - 28, 34, `$${cash}`, textStyle(20, "#c45c28", { fontStyle: "bold" }))
    .setOrigin(1, 0.5)
    .setName("cashLabel");
}

/** 賣出／出爐的數字上浮。 */
export function floatText(scene: Phaser.Scene, x: number, y: number, msg: string, color = "#c45c28"): void {
  const t = scene.add.text(x, y, msg, textStyle(18, color)).setOrigin(0.5).setDepth(30);
  scene.tweens.add({
    targets: t,
    y: y - 36,
    alpha: 0,
    scale: 1.15,
    duration: 520,
    ease: "Cubic.easeOut",
    onComplete: () => t.destroy(),
  });
}

export function toast(scene: Phaser.Scene, msg: string): void {
  const { width } = scene.scale;
  const t = scene.add
    .text(width / 2, 90, msg, textStyle(15, "#fffdf8", { fontStyle: "bold" }))
    .setOrigin(0.5)
    .setDepth(20);
  const bg = scene.add.graphics().setDepth(19);
  const b = t.getBounds();
  bg.fillStyle(C.ink, 0.86);
  bg.fillRoundedRect(b.x - 12, b.y - 8, b.width + 24, b.height + 16, 10);
  scene.tweens.add({
    targets: [t, bg],
    y: "+=8",
    alpha: 0,
    delay: 900,
    duration: 320,
    onComplete: () => {
      t.destroy();
      bg.destroy();
    },
  });
}
