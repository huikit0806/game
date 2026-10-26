import Phaser from "phaser";
import { RECIPES, RECIPE_MAP } from "../data/recipes";
import { game } from "../state/GameState";
import type { RecipeId } from "../state/types";
import { drawLoaf, pop, puffSteam } from "../art/draw";
import { MamaCraft } from "../kitchen/MamaCraft";
import { C, textStyle } from "../ui/theme";
import { button, floatText, toast, topBar } from "../ui/widgets";
import { scrollPane } from "../ui/scroll";

export class KitchenScene extends Phaser.Scene {
  private mama: MamaCraft | null = null;
  private hint!: Phaser.GameObjects.Text;
  private ovenGfx!: Phaser.GameObjects.Graphics;
  private ovenLabels: Phaser.GameObjects.Text[] = [];
  private trayGfx!: Phaser.GameObjects.Graphics;
  private dockY = 0;

  constructor() {
    super("kitchen");
  }

  init(): void {
    this.mama = null;
    this.ovenLabels = [];
  }

  create(): void {
    const g = game();
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor(C.paper);
    topBar(this, "生產廚房", g.cash, g.day, g.level);
    this.add.text(20, 78, "揀一款包 → 完成步驟 → 推進烤箱", textStyle(13, "#8a6a55"));

    this.dockY = h - 250;
    const pane = scrollPane(this, 0, 100, w, this.dockY - 108);
    const unlocked = RECIPES.filter((r) => g.unlockedRecipes.includes(r.id));
    unlocked.forEach((r, i) => {
      const y = i * 58;
      const can = g.canCraft(r.id);
      const row = this.add.container(0, y);
      const bg = this.add.graphics();
      bg.fillStyle(C.white, 1);
      bg.lineStyle(2, C.line, 1);
      bg.fillRoundedRect(16, 0, w - 32, 52, 12);
      bg.strokeRoundedRect(16, 0, w - 32, 52, 12);
      const icon = this.add.graphics();
      drawLoaf(icon, 46, 26, r.id, 0.9);
      const name = this.add.text(72, 8, r.name, textStyle(15, "#5c3d2e"));
      const meta = this.add.text(72, 28, `建議 $${r.suggestedPrice} · 烘 ${Math.round(r.bakeSeconds * g.bakeFactor())}s`, textStyle(11, "#8a6a55"));
      const btn = button(this, w - 58, 26, 72, 32, can ? "製作" : "缺料", () => this.startCraft(r.id), can ? C.accent : C.line);
      row.add([bg, icon, name, meta, btn.container]);
      pane.content.add(row);
    });

    const dock = this.add.graphics();
    dock.fillStyle(C.paper, 1);
    dock.fillRect(0, this.dockY - 8, w, h - this.dockY + 8);
    this.add.text(20, this.dockY, "烤箱（可邊賣邊烘）", textStyle(13, "#5c3d2e"));
    this.ovenGfx = this.add.graphics();
    this.trayGfx = this.add.graphics();
    this.hint = this.add.text(20, this.dockY + 88, "", textStyle(13, "#c45c28"));
    this.drawOvens();
    this.drawTray();

    button(this, 100, h - 40, 150, 42, "返回訂料", () => {
      g.phase = "prep";
      this.scene.start("prep");
    }, C.inkSoft);
    button(this, w - 120, h - 40, 170, 42, "開舖營業", () => {
      g.startShop();
      this.scene.start("shop");
    });

    this.events.once("shutdown", () => this.mama?.destroy());
  }

  private startCraft(id: RecipeId): void {
    const g = game();
    if (this.mama) return;
    if (!g.canCraft(id)) {
      toast(this, "材料不夠，回準備訂貨");
      return;
    }
    if (!g.ovens.some((o) => o.loafId == null)) {
      toast(this, "烤箱滿了，等一盤出爐再做");
      return;
    }
    g.consumeCraft(id);
    this.mama = new MamaCraft(this, id, g.mixerFactor(), g.bakeFactor(), (quality) => {
      const ok = game().startOven(id, quality);
      this.mama?.destroy();
      this.mama = null;
      if (!ok) {
        game().refundCraft(id);
        toast(this, "烤箱滿了，材料已退回");
        return;
      }
      toast(this, `${RECIPE_MAP[id].name} 入爐`);
    });
  }

  update(_t: number, delta: number): void {
    const dt = delta / 1000;
    const done = game().tickKitchen(dt);
    for (const loaf of done) {
      toast(this, `${RECIPE_MAP[loaf.recipeId].name} 出爐！`);
      this.playBakeOut(loaf.recipeId);
    }
    this.drawOvens();
    this.drawTray();
    this.mama?.update(dt);
  }

  private playBakeOut(recipeId: RecipeId): void {
    const x = 56;
    const fromY = this.dockY + 36;
    const g = this.add.graphics().setDepth(14);
    drawLoaf(g, x, fromY, recipeId, 1.1);
    puffSteam(this, x, fromY - 8);
    pop(this, g);
    this.tweens.add({
      targets: g,
      x: 40,
      y: 28,
      duration: 380,
      ease: "Back.easeOut",
      onComplete: () => g.destroy(),
    });
    floatText(this, x + 48, fromY, "香！");
  }

  private drawOvens(): void {
    this.ovenGfx.clear();
    this.ovenLabels.forEach((t) => t.destroy());
    this.ovenLabels = [];
    const g = game();
    g.ovens.forEach((slot, i) => {
      const x = 24 + i * 72;
      const y = this.dockY + 22;
      this.ovenGfx.fillStyle(C.white, 1);
      this.ovenGfx.lineStyle(2, C.line, 1);
      this.ovenGfx.fillRoundedRect(x, y, 64, 52, 10);
      this.ovenGfx.strokeRoundedRect(x, y, 64, 52, 10);
      if (slot.recipeId) {
        drawLoaf(this.ovenGfx, x + 32, y + 20, slot.recipeId, 0.7);
        const p = 1 - slot.remaining / slot.total;
        this.ovenGfx.fillStyle(C.accent, 1);
        this.ovenGfx.fillRect(x + 8, y + 40, 48 * p, 6);
      }
      const label = this.add.text(x + 32, y + 54, slot.recipeId ? "烘緊" : "空", textStyle(11, "#8a6a55")).setOrigin(0.5, 0);
      this.ovenLabels.push(label);
    });
  }

  private drawTray(): void {
    this.trayGfx.clear();
    const tray = game().trayLoaves();
    this.hint.setText(tray.length ? `托盤 ${tray.length} 個 · 開舖後可繼續出爐` : "托盤還沒有包");
    tray.slice(0, 6).forEach((loaf, i) => {
      drawLoaf(this.trayGfx, 36 + i * 52, this.dockY + 148, loaf.recipeId, 0.95);
    });
  }
}
