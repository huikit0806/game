import Phaser from "phaser";
import { INGREDIENT_MAP } from "../data/ingredients";
import { RECIPE_MAP } from "../data/recipes";
import type { IngredientId, RecipeId, StepKind } from "../state/types";
import { puffSteam } from "../art/draw";
import { C, textStyle } from "../ui/theme";
import { floatText } from "../ui/widgets";

const CHIP: Record<IngredientId, number> = {
  flour: 0xf4efe4,
  yeast: 0xd8c07a,
  sugar: 0xfff8ee,
  butter: 0xf2c14e,
  egg: 0xf6d35b,
  milk: 0xfffaf3,
  fruit: 0xe25b5b,
  chocolate: 0x6b3a2a,
};

interface Chip {
  id: IngredientId;
  x: number;
  y: number;
  tx: number;
  ty: number;
  flying: boolean;
  poured: boolean;
  node: Phaser.GameObjects.Container;
}

/**
 * 做包畫面：材料飛入碗、搓麵綠區、發酵停線、烤箱上色。
 * 手感參考 Cooking Mama 的「看食物變形 + 卡時機」，失敗只扣新鮮度。
 */
export class MamaCraft {
  private readonly steps: StepKind[];
  private step = 0;
  private quality = 100;
  private done = false;
  private gfx: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private blocker: Phaser.GameObjects.Rectangle;
  private chips: Chip[] = [];
  private hits = 0;
  private readonly hitsNeeded = 3;
  private clock = 0;
  private rise = 0;
  private bake = 0;
  private flash = 0;
  private bowlMix = 0;
  private onDown: (p: Phaser.Input.Pointer) => void;
  private onMove: (p: Phaser.Input.Pointer) => void;
  private onUp: (p: Phaser.Input.Pointer) => void;

  constructor(
    private scene: Phaser.Scene,
    private recipeId: RecipeId,
    private mixer: number,
    private baker: number,
    private onFinish: (quality: number) => void,
  ) {
    const w = scene.scale.width;
    const h = scene.scale.height;
    scene.registry.set("scrollLock", true);
    this.steps = RECIPE_MAP[recipeId].steps.map((s) => s.kind);
    this.blocker = scene.add
      .rectangle(w / 2, h / 2, w, h, 0x3a2a22, 0.55)
      .setInteractive()
      .setDepth(40);
    this.gfx = scene.add.graphics().setDepth(41);
    this.title = scene.add.text(w / 2, 232, "", textStyle(20, "#5c3d2e")).setOrigin(0.5).setDepth(43);
    this.hint = scene.add.text(w / 2, 262, "", textStyle(13, "#8a6a55")).setOrigin(0.5).setDepth(43);
    this.layoutChips();
    this.onDown = (p) => this.pointerDown(p);
    this.onMove = (p) => this.pointerMove(p);
    this.onUp = () => this.pointerUp();
    scene.input.on("pointerdown", this.onDown);
    scene.input.on("pointermove", this.onMove);
    scene.input.on("pointerup", this.onUp);
    this.syncCopy();
  }

  update(dt: number): void {
    if (this.done) return;
    this.clock += dt;
    this.flash = Math.max(0, this.flash - dt);
    const kind = this.steps[this.step];
    for (const chip of this.chips) {
      if (!chip.flying) continue;
      chip.x += (chip.tx - chip.x) * Math.min(1, dt * 10);
      chip.y += (chip.ty - chip.y) * Math.min(1, dt * 10);
      chip.node.setPosition(chip.x, chip.y);
      if (Phaser.Math.Distance.Between(chip.x, chip.y, chip.tx, chip.ty) < 6) {
        chip.flying = false;
        chip.poured = true;
        chip.node.setVisible(false);
        this.bowlMix += 1;
        floatText(this.scene, chip.tx, chip.ty - 20, INGREDIENT_MAP[chip.id].name);
        if (this.chips.every((c) => c.poured)) this.advance();
      }
    }
    if (kind === "proof") {
      this.rise += dt / (2.6 * this.mixer);
      if (this.rise >= 1) this.advance(12);
    }
    if (kind === "bake") {
      this.bake += dt / (4.2 * this.baker);
      if (this.bake >= 1) this.advance(12);
    }
    if (kind === "knead" && this.clock > 9) this.advance(10);
    this.draw();
  }

  destroy(): void {
    this.scene.registry.set("scrollLock", false);
    this.scene.input.off("pointerdown", this.onDown);
    this.scene.input.off("pointermove", this.onMove);
    this.scene.input.off("pointerup", this.onUp);
    this.chips.forEach((c) => c.node.destroy());
    this.gfx.destroy();
    this.title.destroy();
    this.hint.destroy();
    this.blocker.destroy();
  }

  private layoutChips(): void {
    const ids = Object.keys(RECIPE_MAP[this.recipeId].cost) as IngredientId[];
    const w = this.scene.scale.width;
    ids.forEach((id, i) => {
      const x = w / 2 + (i - (ids.length - 1) / 2) * 72;
      const y = 330;
      const g = this.scene.add.graphics();
      g.fillStyle(CHIP[id], 1);
      g.lineStyle(2, C.ink, 0.8);
      g.fillCircle(0, 0, 18);
      g.strokeCircle(0, 0, 18);
      const label = this.scene.add.text(0, 26, INGREDIENT_MAP[id].name, textStyle(11, "#5c3d2e")).setOrigin(0.5, 0);
      const hit = this.scene.add.circle(0, 0, 24, 0x000000, 0.001).setInteractive({ draggable: false, useHandCursor: true });
      const node = this.scene.add.container(x, y, [g, label, hit]).setDepth(44);
      node.setData("home", { x, y });
      const chip: Chip = { id, x, y, tx: x, ty: y, flying: false, poured: false, node };
      hit.on("pointerdown", () => this.pour(chip));
      this.chips.push(chip);
    });
  }

  private pour(chip: Chip): void {
    if (this.steps[this.step] !== "mix" || chip.poured || chip.flying) return;
    const w = this.scene.scale.width;
    chip.tx = w / 2 + Phaser.Math.Between(-12, 12);
    chip.ty = 430;
    chip.flying = true;
  }

  private pointerDown(p: Phaser.Input.Pointer): void {
    const kind = this.steps[this.step];
    if (kind === "knead") {
      const phase = (this.clock % 1.15) / 1.15;
      const inZone = phase > 0.72 && phase < 0.9;
      if (inZone) {
        this.hits += 1;
        floatText(this.scene, p.x, p.y - 10, "好");
        if (this.hits >= this.hitsNeeded) this.advance(0);
      } else {
        this.quality = Math.max(40, this.quality - 6);
        this.flash = 0.18;
      }
    }
    if (kind === "proof") {
      const perfect = this.rise >= 0.74 && this.rise <= 0.9;
      this.advance(perfect ? 0 : 12);
      if (perfect) floatText(this.scene, p.x, p.y - 10, "剛好");
    }
    if (kind === "bake") {
      const perfect = this.bake >= 0.78 && this.bake <= 0.93;
      if (perfect) {
        puffSteam(this.scene, this.scene.scale.width / 2, 400);
        floatText(this.scene, p.x, p.y - 10, "出爐");
      }
      this.advance(perfect ? 0 : 12);
    }
  }

  private pointerMove(p: Phaser.Input.Pointer): void {
    if (!p.isDown || this.steps[this.step] !== "mix") return;
    const chip = this.chips.find((c) => !c.poured && !c.flying && Phaser.Math.Distance.Between(p.x, p.y, c.x, c.y) < 36);
    if (!chip) return;
    chip.x = p.x;
    chip.y = p.y;
    chip.node.setPosition(chip.x, chip.y);
    const bowl = new Phaser.Math.Vector2(this.scene.scale.width / 2, 450);
    if (Phaser.Math.Distance.Between(p.x, p.y, bowl.x, bowl.y) < 54) this.pour(chip);
  }

  private pointerUp(): void {
    for (const chip of this.chips) {
      if (!chip.poured && !chip.flying) {
        const home = chip.node.getData("home") as { x: number; y: number } | undefined;
        if (home) {
          chip.x = home.x;
          chip.y = home.y;
          chip.node.setPosition(home.x, home.y);
        }
      }
    }
  }

  private advance(penalty = 0): void {
    this.quality = Math.max(40, this.quality - penalty);
    this.step += 1;
    this.clock = 0;
    this.hits = 0;
    this.rise = 0;
    this.bake = 0;
    if (this.step >= this.steps.length) {
      this.done = true;
      const q = this.quality;
      this.onFinish(q);
      return;
    }
    if (this.steps[this.step] !== "mix") {
      this.chips.forEach((c) => c.node.setVisible(false));
    }
    this.syncCopy();
  }

  private syncCopy(): void {
    const name = RECIPE_MAP[this.recipeId].name;
    const kind = this.steps[this.step];
    const title = { mix: "落材料", knead: "搓麵", proof: "發酵", bake: "烘烤" }[kind];
    this.title.setText(`${name} · ${title}`);
    this.hint.setText(
      {
        mix: "點材料，睇住佢落入碗",
        knead: "圓圈縮入綠區先按",
        proof: "麵團碰到線先按停",
        bake: "上色到金黃先出爐",
      }[kind],
    );
  }

  private draw(): void {
    const w = this.scene.scale.width;
    const cx = w / 2;
    const kind = this.steps[this.step];
    const g = this.gfx;
    g.clear();
    g.fillStyle(C.white, 1);
    g.lineStyle(2, C.line, 1);
    g.fillRoundedRect(24, 210, w - 48, 420, 18);
    g.strokeRoundedRect(24, 210, w - 48, 420, 18);

    if (kind === "mix") this.drawBowl(g, cx, 460, this.bowlMix / Math.max(1, this.chips.length));
    if (kind === "knead") this.drawKnead(g, cx, 430);
    if (kind === "proof") this.drawProof(g, cx, 470);
    if (kind === "bake") this.drawBake(g, cx, 430);
  }

  private drawBowl(g: Phaser.GameObjects.Graphics, x: number, y: number, fill: number): void {
    g.lineStyle(3, C.ink, 0.85);
    g.fillStyle(0xd7e7ea, 1);
    g.fillEllipse(x, y, 150, 46);
    g.strokeEllipse(x, y, 150, 46);
    const recipe = RECIPE_MAP[this.recipeId];
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(0xf4efe4),
      Phaser.Display.Color.IntegerToColor(recipe.tint),
      100,
      Math.round(fill * 100),
    );
    g.fillStyle(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b), 1);
    g.fillEllipse(x, y - 6, 110, 28 + fill * 10);
  }

  private drawKnead(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const phase = (this.clock % 1.15) / 1.15;
    const inZone = phase > 0.72 && phase < 0.9;
    const radius = Phaser.Math.Linear(78, 26, phase);
    g.lineStyle(3, inZone ? 0x6f9b6a : C.line, 1);
    g.strokeCircle(x, y, radius);
    g.lineStyle(2, 0x6f9b6a, 0.9);
    g.strokeCircle(x, y, 34);
    const squash = 1 - Math.min(0.35, this.hits * 0.08);
    this.dough(g, x, y, 70 * (this.flash ? 1.08 : 1), 46 * squash, 0xf0d7a2);
  }

  private drawProof(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    const h = Phaser.Math.Linear(40, 92, Math.min(1, this.rise));
    g.lineStyle(2, C.accent, 0.9);
    g.lineBetween(x - 70, y - 78, x + 70, y - 78);
    this.dough(g, x, y - h / 2, 64, h, 0xfff1d6);
  }

  private drawBake(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x5c3d2e, 1);
    g.fillRoundedRect(x - 90, y - 70, 180, 150, 12);
    g.fillStyle(0x2c2118, 1);
    g.fillRoundedRect(x - 70, y - 48, 140, 100, 8);
    const recipe = RECIPE_MAP[this.recipeId];
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(0xf6e7c1),
      Phaser.Display.Color.IntegerToColor(recipe.tint),
      100,
      Math.round(Math.min(1, this.bake) * 100),
    );
    const color = Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b);
    this.dough(g, x, y + 10, 78, 36, color);
    const marker = Phaser.Math.Linear(x - 60, x + 60, Math.min(1, this.bake));
    g.fillStyle(this.bake >= 0.78 && this.bake <= 0.93 ? 0x6f9b6a : C.accent, 1);
    g.fillCircle(marker, y + 78, 6);
    g.lineStyle(2, 0x6f9b6a, 1);
    g.lineBetween(x + 28, y + 70, x + 48, y + 70);
  }

  private dough(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number): void {
    g.fillStyle(color, 1);
    g.lineStyle(2.4, C.ink, 0.9);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, h / 2);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, h / 2);
  }
}
