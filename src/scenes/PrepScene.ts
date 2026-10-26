import Phaser from "phaser";
import { INGREDIENTS } from "../data/ingredients";
import { RECIPES } from "../data/recipes";
import { game } from "../state/GameState";
import { C, textStyle } from "../ui/theme";
import { button, roundRect, toast, topBar } from "../ui/widgets";

export class PrepScene extends Phaser.Scene {
  constructor() {
    super("prep");
  }

  create(): void {
    const g = game();
    const w = this.scale.width;
    this.cameras.main.setBackgroundColor(C.paper);
    topBar(this, "開舖前準備", g.cash, g.day, g.level);

    this.add.text(20, 84, `今日目標：${g.goal.title}`, textStyle(13, "#c45c28"));
    this.add
      .text(20, 106, "訂原材料（即時到貨）· 揀今日主推", textStyle(12, "#8a6a55"))
      .setOrigin(0, 0);

    const listY = 128;
    const rowH = 58;
    INGREDIENTS.forEach((ing, i) => {
      const locked = !g.unlockedIngredients.includes(ing.id);
      const y = listY + i * rowH;
      roundRect(this, 16, y, w - 32, 52, locked ? 0xf0e4d4 : C.white, C.line, 12);
      const price = g.todayPrices[ing.id];
      const delta = price - ing.basePrice;
      const wave = locked ? "未解鎖" : `$${price}  ${delta > 0 ? "↑" : delta < 0 ? "↓" : "—"}`;
      this.add.text(28, y + 8, ing.name, textStyle(15, locked ? "#b8a08c" : "#5c3d2e", { fontStyle: "bold" }));
      this.add.text(28, y + 28, wave, textStyle(12, "#8a6a55"));
      this.add
        .text(w - 150, y + 18, `庫存 ${g.inventory[ing.id]}`, textStyle(12, "#8a6a55"))
        .setOrigin(0.5, 0);
      if (locked) return;
      const qty = () => g.cart[ing.id] ?? 0;
      const qtyText = this.add.text(w - 58, y + 14, `${qty()}`, textStyle(18, "#c45c28", { fontStyle: "bold" })).setOrigin(0.5, 0);
      button(this, w - 96, y + 26, 28, 28, "−", () => {
        g.setCart(ing.id, qty() - 1);
        qtyText.setText(`${qty()}`);
        total.setText(`應付 $${g.cartTotal()}`);
      }, C.inkSoft);
      button(this, w - 28, y + 26, 28, 28, "+", () => {
        g.setCart(ing.id, qty() + 1);
        qtyText.setText(`${qty()}`);
        total.setText(`應付 $${g.cartTotal()}`);
      }, C.sage);
    });

    const afterList = listY + INGREDIENTS.length * rowH + 8;
    const total = this.add.text(24, afterList, `應付 $${g.cartTotal()}`, textStyle(16, "#c45c28", { fontStyle: "bold" }));
    button(this, w - 88, afterList + 12, 120, 36, "確認訂貨", () => {
      if (g.cartTotal() === 0) {
        toast(this, "先揀要訂幾多");
        return;
      }
      if (!g.checkoutCart()) {
        toast(this, "現金不夠");
        return;
      }
      toast(this, "材料已到貨");
      this.time.delayedCall(280, () => this.scene.restart());
    }, C.sage);

    this.add.text(20, afterList + 44, "今日主推（最多 2 款，客人更想買）", textStyle(13, "#5c3d2e", { fontStyle: "bold" }));
    const unlocked = RECIPES.filter((r) => g.unlockedRecipes.includes(r.id));
    unlocked.forEach((r, i) => {
      const x = 20 + (i % 3) * 118;
      const y = afterList + 72 + Math.floor(i / 3) * 44;
      const on = g.featured.includes(r.id);
      button(this, x + 50, y + 16, 108, 34, r.name, () => {
        g.toggleFeatured(r.id);
        this.scene.restart();
      }, on ? C.accent : C.inkSoft);
    });

    button(this, w / 2, this.scale.height - 48, 220, 48, "去廚房做包", () => {
      g.phase = "kitchen";
      this.scene.start("kitchen");
    });
  }
}
