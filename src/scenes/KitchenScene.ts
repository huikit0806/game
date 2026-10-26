import Phaser from "phaser";
import { RECIPES, RECIPE_MAP } from "../data/recipes";
import { game } from "../state/GameState";
import type { RecipeId, RecipeStep } from "../state/types";
import { drawLoaf, pop } from "../art/draw";
import { C, textStyle } from "../ui/theme";
import { button, progressBar, roundRect, toast, topBar } from "../ui/widgets";

export class KitchenScene extends Phaser.Scene {
  private craft: { recipeId: RecipeId; step: number; quality: number } | null = null;
  private stepProgress = 0;
  private hold = false;
  private swipeArmed = false;
  private lastX = 0;
  private bar: { set: (t: number) => void; destroy: () => void } | null = null;
  private hint!: Phaser.GameObjects.Text;
  private ovenGfx!: Phaser.GameObjects.Graphics;
  private ovenLabels: Phaser.GameObjects.Text[] = [];

  constructor() {
    super("kitchen");
  }

  init(): void {
    this.craft = null;
    this.stepProgress = 0;
    this.hold = false;
    this.swipeArmed = false;
    this.bar = null;
    this.ovenLabels = [];
  }

  create(): void {
    const g = game();
    const w = this.scale.width;
    this.cameras.main.setBackgroundColor(C.paper);
    topBar(this, "生產廚房", g.cash, g.day, g.level);
    this.add.text(20, 80, "揀一款包 → 完成步驟 → 推進烤箱", textStyle(13, "#8a6a55"));

    const unlocked = RECIPES.filter((r) => g.unlockedRecipes.includes(r.id));
    unlocked.forEach((r, i) => {
      const y = 108 + i * 58;
      const can = g.canCraft(r.id);
      roundRect(this, 16, y, w - 32, 52, C.white);
      const icon = this.add.graphics();
      drawLoaf(icon, 46, y + 26, r.id, 0.9);
      this.add.text(72, y + 8, r.name, textStyle(15, "#5c3d2e", { fontStyle: "bold" }));
      this.add.text(72, y + 28, `建議 $${r.suggestedPrice} · 烘 ${r.bakeSeconds}s`, textStyle(11, "#8a6a55"));
      button(this, w - 58, y + 26, 72, 32, can ? "製作" : "缺料", () => {
        if (this.craft) return;
        if (!g.canCraft(r.id)) {
          toast(this, "材料不夠，回準備訂貨");
          return;
        }
        if (!g.ovens.some((o) => o.loafId == null)) {
          toast(this, "烤箱滿了，等一盤出爐再做");
          return;
        }
        g.consumeCraft(r.id);
        this.craft = { recipeId: r.id, step: 0, quality: 100 };
        this.openStep();
      }, can ? C.accent : C.line);
    });

    const ovenY = Math.min(108 + unlocked.length * 58 + 12, 560);
    this.add.text(20, ovenY, "烤箱（有空位先可烘）", textStyle(13, "#5c3d2e", { fontStyle: "bold" }));
    this.ovenGfx = this.add.graphics();
    this.drawOvens();

    this.hint = this.add
      .text(w / 2, ovenY + 118, "托盤：" + trayText(), textStyle(14, "#c45c28", { align: "center" }))
      .setOrigin(0.5);

    button(this, w / 2, this.scale.height - 48, 240, 48, "開舖營業（可邊賣邊烘）", () => {
      g.startShop();
      this.scene.start("shop");
    });

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on("pointerup", () => this.onUp());
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onMove(p));
  }

  update(_t: number, delta: number): void {
    const dt = delta / 1000;
    const done = game().tickKitchen(dt);
    if (done.length) {
      toast(this, `${RECIPE_MAP[done[0].recipeId].name} 出爐！`);
      pop(this, this.ovenGfx);
    }
    this.drawOvens();
    const tray = game().trayLoaves();
    this.hint.setText(tray.length ? `已出爐 ${tray.length} 個，可以開舖` : "托盤：還沒有出爐的包");

    if (!this.craft) return;
    const step = currentStep(this.craft);
    if (step.kind === "proof" && this.hold) {
      this.stepProgress += dt / (step.effort * game().mixerFactor());
      this.bar?.set(this.stepProgress);
      if (this.stepProgress >= 1) this.advanceStep();
    }
  }

  private openStep(): void {
    this.stepProgress = 0;
    this.hold = false;
    this.swipeArmed = false;
    this.bar?.destroy();
    if (!this.craft) return;
    const recipe = RECIPE_MAP[this.craft.recipeId];
    const step = currentStep(this.craft);
    if (step.kind === "bake") {
      const ok = game().startOven(this.craft.recipeId, this.craft.quality);
      if (!ok) {
        toast(this, "烤箱滿了，等一盤出爐");
        game().inventory.flour += recipe.cost.flour ?? 0;
        // 退回材料太複雜；改為把半成品暫存：還原 consume 不划算。提示即可，保持 craft。
        return;
      }
      toast(this, `${recipe.name} 入爐`);
      this.craft = null;
      this.bar = null;
      return;
    }

    const w = this.scale.width;
    const overlay = this.add.rectangle(w / 2, 430, w - 32, 210, C.white, 1).setStrokeStyle(2, C.line).setDepth(5);
    overlay.setName("stepCard");
    const title = stepTitle(step.kind);
    this.add.text(w / 2, 360, `${recipe.name} · ${title}`, textStyle(18, "#5c3d2e", { fontStyle: "bold" })).setOrigin(0.5).setDepth(6).setName("stepTitle");
    this.add.text(w / 2, 390, stepHint(step.kind), textStyle(13, "#8a6a55", { align: "center" })).setOrigin(0.5).setDepth(6).setName("stepHint");
    this.bar = progressBar(this, 40, 430, w - 80, 18);
    this.add.text(w / 2, 470, "失敗最多新鮮度 -12，不會報廢", textStyle(11, "#c4a484")).setOrigin(0.5).setDepth(6).setName("stepNote");
  }

  private clearStepUi(): void {
    ["stepCard", "stepTitle", "stepHint", "stepNote"].forEach((n) => {
      this.children.getByName(n)?.destroy();
    });
    this.bar?.destroy();
    this.bar = null;
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.craft) return;
    const step = currentStep(this.craft);
    if (step.kind === "mix") {
      const need = step.effort * game().mixerFactor();
      this.stepProgress += 1 / need;
      this.bar?.set(this.stepProgress);
      if (this.stepProgress >= 1) this.advanceStep();
    }
    if (step.kind === "proof") this.hold = true;
    if (step.kind === "knead") {
      this.swipeArmed = true;
      this.lastX = p.x;
    }
  }

  private onUp(): void {
    this.hold = false;
    this.swipeArmed = false;
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.craft || !this.swipeArmed) return;
    const step = currentStep(this.craft);
    if (step.kind !== "knead") return;
    if (Math.abs(p.x - this.lastX) > 28) {
      this.lastX = p.x;
      const need = step.effort * game().mixerFactor();
      this.stepProgress += 1 / need;
      this.bar?.set(this.stepProgress);
      if (this.stepProgress >= 1) this.advanceStep();
    }
  }

  private advanceStep(): void {
    if (!this.craft) return;
    if (this.stepProgress < 1) this.craft.quality -= 12;
    this.clearStepUi();
    this.craft.step += 1;
    this.openStep();
  }

  private drawOvens(): void {
    this.ovenGfx.clear();
    this.ovenLabels.forEach((t) => t.destroy());
    this.ovenLabels = [];
    const g = game();
    const w = this.scale.width;
    const unlocked = RECIPES.filter((r) => g.unlockedRecipes.includes(r.id)).length;
    const y = Math.min(108 + unlocked * 58 + 36, 584);
    g.ovens.forEach((slot, i) => {
      const x = 24 + i * 72;
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
      const label = this.add
        .text(x + 32, y + 58, slot.recipeId ? "烘緊" : "空", textStyle(11, "#8a6a55"))
        .setOrigin(0.5, 0);
      this.ovenLabels.push(label);
    });
    void w;
  }
}

function currentStep(craft: { recipeId: RecipeId; step: number }): RecipeStep {
  return RECIPE_MAP[craft.recipeId].steps[craft.step];
}

function stepTitle(kind: RecipeStep["kind"]): string {
  return { mix: "配料攪拌", knead: "揉麵整形", proof: "發酵", bake: "入爐" }[kind];
}

function stepHint(kind: RecipeStep["kind"]): string {
  return {
    mix: "連點畫面，把進度條填滿",
    knead: "左右短滑動揉麵",
    proof: "按住不放，等麵團醒發",
    bake: "自動尋找空烤箱",
  }[kind];
}

function trayText(): string {
  const tray = game().trayLoaves();
  if (!tray.length) return "還沒有出爐的包";
  return tray.map((l) => RECIPE_MAP[l.recipeId].name).join("、");
}
