import Phaser from "phaser";
import { ORDER_LEAD_DAYS, RUSH_RATE } from "../config";
import { INGREDIENTS, INGREDIENT_MAP } from "../data/ingredients";
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
    const hint = this.add.text(
      20,
      y + 22,
      `預約 ${ORDER_LEAD_DAYS} 日後到貨 · 即日急單 +${Math.round((RUSH_RATE - 1) * 100)}%`,
      textStyle(12, "#8a6a55"),
    );
    box.add([goal, hint]);
    y += 48;
    if (g.deliveryNote) {
      const note = this.add.text(20, y, g.deliveryNote, textStyle(13, "#6f9b6a", { wordWrap: { width: w - 40 } }));
      box.add(note);
      y += 36;
    }

    const total = this.add.text(24, 0, "", textStyle(16, "#c45c28"));
    let rushLabel: Phaser.GameObjects.Text | null = null;
    let rushBtn: { setLabel: (t: string) => void } | null = null;
    const refreshPay = () => {
      const base = g.cartTotal();
      total.setText(`預約 $${base}`);
      const rushPay = Math.ceil(base * RUSH_RATE);
      rushLabel?.setText(`急單 $${rushPay}（+${Math.round((RUSH_RATE - 1) * 100)}%）`);
      rushBtn?.setLabel(`即日 $${rushPay}`);
    };

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
          refreshPay();
        }, C.inkSoft);
        const plus = button(this, w - 28, 26, 28, 28, "+", () => {
          g.setCart(ing.id, qty() + 1);
          qtyText.setText(`${qty()}`);
          refreshPay();
        }, C.sage);
        card.add([qtyText, minus.container, plus.container]);
      }
      box.add(card);
      y += 58;
    });

    total.setPosition(24, y + 2);
    rushLabel = this.add.text(24, y + 24, "", textStyle(12, "#c45c28"));
    const book = button(this, w / 2 - 78, y + 68, 140, 40, `${ORDER_LEAD_DAYS}日後到`, () => {
      this.submitOrder(false);
    }, C.sage);
    const rush = button(this, w / 2 + 78, y + 68, 140, 40, "即日", () => {
      this.submitOrder(true);
    }, C.accent);
    rushBtn = rush;
    refreshPay();
    box.add([total, rushLabel, book.container, rush.container]);
    y += 100;

    const pendingTitle = this.add.text(20, y, "未到貨", textStyle(13, "#5c3d2e"));
    box.add(pendingTitle);
    y += 22;
    if (g.pendingOrders.length === 0) {
      const empty = this.add.text(20, y, "未有預約", textStyle(12, "#8a6a55"));
      box.add(empty);
      y += 24;
    } else {
      for (const order of g.pendingOrders) {
        const bits = Object.entries(order.items)
          .map(([id, qty]) => `${INGREDIENT_MAP[id as keyof typeof INGREDIENT_MAP].name}×${qty}`)
          .join("、");
        const line = this.add.text(20, y, `第 ${order.arriveDay} 日　${bits}`, textStyle(12, "#8a6a55"));
        box.add(line);
        y += 20;
      }
      y += 8;
    }

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

  private submitOrder(rush: boolean): void {
    const g = game();
    if (g.cartTotal() === 0) {
      toast(this, "先揀要訂幾多");
      return;
    }
    if (!g.placeOrder(rush)) {
      toast(this, "現金不夠");
      return;
    }
    toast(this, rush ? "急單已入倉" : `已預約，第 ${g.day + ORDER_LEAD_DAYS} 日到`);
    this.time.delayedCall(280, () => this.scene.restart());
  }
}
