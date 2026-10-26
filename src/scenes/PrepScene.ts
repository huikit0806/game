import Phaser from "phaser";
import { INGREDIENTS } from "../data/ingredients";
import { RECIPES } from "../data/recipes";
import { game } from "../state/GameState";
import { C, textStyle } from "../ui/theme";
import { button, toast, topBar } from "../ui/widgets";
import { scrollPane } from "../ui/scroll";

export class PrepScene extends Phaser.Scene {
  constructor() {
    super("prep");
  }

  create(): void {
    const g = game();
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor(C.paper);
    topBar(this, "開舖前準備", g.cash, g.day, g.level);

    const pane = scrollPane(this, 0, 78, w, h - 150);
    const box = pane.content;
    let y = 8;

    const goal = this.add.text(20, y, `今日目標：${g.goal.title}`, textStyle(13, "#c45c28"));
    const hint = this.add.text(20, y + 22, "訂原材料（即時到貨）· 揀今日主推", textStyle(12, "#8a6a55"));
    box.add([goal, hint]);
    y += 48;

    const total = this.add.text(24, 0, `應付 $${g.cartTotal()}`, textStyle(16, "#c45c28"));

    INGREDIENTS.forEach((ing) => {
      const locked = !g.unlockedIngredients.includes(ing.id);
      const card = this.add.container(0, y);
      const bg = this.add.graphics();
      bg.fillStyle(locked ? 0xf0e4d4 : C.white, 1);
      bg.lineStyle(2, C.line, 1);
      bg.fillRoundedRect(16, 0, w - 32, 52, 12);
      bg.strokeRoundedRect(16, 0, w - 32, 52, 12);
      const price = g.todayPrices[ing.id];
      const delta = price - ing.basePrice;
      const wave = locked ? "未解鎖" : `$${price}  ${delta > 0 ? "↑" : delta < 0 ? "↓" : "—"}`;
      const name = this.add.text(28, 8, ing.name, textStyle(15, locked ? "#b8a08c" : "#5c3d2e"));
      const meta = this.add.text(28, 28, wave, textStyle(12, "#8a6a55"));
      const stock = this.add.text(w - 150, 18, `庫存 ${g.inventory[ing.id]}`, textStyle(12, "#8a6a55")).setOrigin(0.5, 0);
      card.add([bg, name, meta, stock]);
      if (!locked) {
        const qty = () => g.cart[ing.id] ?? 0;
        const qtyText = this.add.text(w - 58, 14, `${qty()}`, textStyle(18, "#c45c28")).setOrigin(0.5, 0);
        const minus = button(this, w - 96, 26, 28, 28, "−", () => {
          g.setCart(ing.id, qty() - 1);
          qtyText.setText(`${qty()}`);
          total.setText(`應付 $${g.cartTotal()}`);
        }, C.inkSoft);
        const plus = button(this, w - 28, 26, 28, 28, "+", () => {
          g.setCart(ing.id, qty() + 1);
          qtyText.setText(`${qty()}`);
          total.setText(`應付 $${g.cartTotal()}`);
        }, C.sage);
        card.add([qtyText, minus.container, plus.container]);
      }
      box.add(card);
      y += 58;
    });

    total.setPosition(24, y + 4);
    const buy = button(this, w - 88, y + 16, 120, 36, "確認訂貨", () => {
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
    box.add([total, buy.container]);
    y += 56;

    const featTitle = this.add.text(20, y, "今日主推（最多 2 款）", textStyle(13, "#5c3d2e"));
    box.add(featTitle);
    y += 28;
    const unlocked = RECIPES.filter((r) => g.unlockedRecipes.includes(r.id));
    unlocked.forEach((r, i) => {
      const bx = 70 + (i % 3) * 118;
      const by = y + Math.floor(i / 3) * 44 + 16;
      const on = g.featured.includes(r.id);
      const b = button(this, bx, by, 108, 34, r.name, () => {
        g.toggleFeatured(r.id);
        this.scene.restart();
      }, on ? C.accent : C.inkSoft);
      box.add(b.container);
    });

    const footer = this.add.container(0, 0).setDepth(8);
    const fade = this.add.graphics();
    fade.fillStyle(C.paper, 1);
    fade.fillRect(0, h - 72, w, 72);
    footer.add(fade);
    const go = button(this, w / 2, h - 40, 220, 48, "去廚房做包", () => {
      g.phase = "kitchen";
      this.scene.start("kitchen");
    });
    footer.add(go.container);
  }
}
