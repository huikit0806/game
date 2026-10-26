import Phaser from "phaser";
import { SHOP_SECONDS } from "../config";
import { RECIPE_MAP } from "../data/recipes";
import { game } from "../state/GameState";
import type { Loaf, RecipeId } from "../state/types";
import { drawFace, drawLoaf, pop, puffSteam } from "../art/draw";
import { C, textStyle } from "../ui/theme";
import { button, floatText, progressBar, toast, topBar } from "../ui/widgets";

export class ShopScene extends Phaser.Scene {
  private timeBar: { set: (t: number) => void } | null = null;
  private clock!: Phaser.GameObjects.Text;
  private cash!: Phaser.GameObjects.Text;
  private faces!: Phaser.GameObjects.Graphics;
  private loafNodes = new Map<string, Phaser.GameObjects.Container>();
  private walkX = new Map<string, number>();
  private priceLabels = new Map<RecipeId, Phaser.GameObjects.Text>();

  constructor() {
    super("shop");
  }

  init(): void {
    this.timeBar = null;
    this.loafNodes = new Map();
    this.walkX = new Map();
    this.priceLabels = new Map();
  }

  create(): void {
    const g = game();
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor(C.paper);
    topBar(this, "營業中", g.cash, g.day, g.level);
    this.cash = this.children.getByName("cashLabel") as Phaser.GameObjects.Text;

    this.clock = this.add.text(20, 78, "", textStyle(13, "#8a6a55"));
    this.timeBar = progressBar(this, 20, 98, w - 40, 12);
    this.add.text(20, 116, "拖到架子上架 · 下面可調價", textStyle(12, "#8a6a55"));
    this.drawShelves();
    this.rebuildLoaves();
    this.drawPriceRow();

    this.faces = this.add.graphics();
    this.add.text(20, 248, "客人排隊", textStyle(13, "#5c3d2e"));

    this.add.graphics()
      .fillStyle(C.white, 1)
      .lineStyle(2, C.line, 1)
      .fillRoundedRect(16, 340, w - 32, 92, 12)
      .strokeRoundedRect(16, 340, w - 32, 92, 12);
    this.add.text(26, 348, "出爐托盤", textStyle(12, "#5c3d2e"));
    button(this, w - 86, 362, 100, 28, "一鍵上架", () => {
      const n = g.stockShelves();
      toast(this, n ? `上架 ${n} 個` : "沒有空位或沒有包");
      this.rebuildLoaves();
    }, C.sage);

    button(this, w / 2, h - 40, 200, 42, "提早收工", () => {
      g.shopTime = 0;
    }, C.inkSoft);
  }

  update(_t: number, delta: number): void {
    const g = game();
    const dt = delta / 1000;
    const ev = g.tickShop(dt);
    this.timeBar?.set(g.shopTime / SHOP_SECONDS);
    this.clock.setText(
      g.isArranging()
        ? "先把包裝上架，然後開始計時"
        : `剩餘 ${Math.max(0, g.shopTime).toFixed(0)} 秒 · 已賣 ${g.log.customersServed}`,
    );

    if (ev.baked.length) {
      toast(this, "剛出爐！拖去上架");
      puffSteam(this, 60, 380);
      this.rebuildLoaves();
    }
    if (ev.staffed.length) {
      toast(this, "員工補好架");
      this.rebuildLoaves();
    }
    if (ev.bought) {
      const pay = g.effectivePrice(ev.bought.recipeId);
      toast(this, `賣出 ${RECIPE_MAP[ev.bought.recipeId].name} +$${pay}`);
      floatText(this, 70, 300, `+$${pay}`, "#6f9b6a");
      this.rebuildLoaves();
      this.refreshCash();
      pop(this, this.faces);
    }
    if (ev.left) toast(this, "有客人等不及走了");
    this.drawCustomers(dt);

    if (g.isShopOver()) {
      g.settle();
      this.scene.start("settle");
    }
  }

  private refreshCash(): void {
    this.cash?.setText(`$${game().cash}`);
  }

  private drawShelves(): void {
    const g = game();
    for (let i = 0; i < g.shelfCount(); i++) {
      const r = this.shelfRect(i);
      this.add.graphics()
        .fillStyle(C.shelf, 1)
        .lineStyle(2, C.line, 1)
        .fillRoundedRect(r.x, r.y, r.width, r.height, 12)
        .strokeRoundedRect(r.x, r.y, r.width, r.height, 12);
      this.add.text(r.x + 8, r.y + 6, `架 ${i + 1}`, textStyle(11, "#8a6a55"));
    }
  }

  private shelfRect(i: number): Phaser.Geom.Rectangle {
    const x = 16 + (i % 3) * 122;
    const y = 134 + Math.floor(i / 3) * 88;
    return new Phaser.Geom.Rectangle(x, y, 112, 80);
  }

  private rebuildLoaves(): void {
    for (const n of this.loafNodes.values()) n.destroy();
    this.loafNodes.clear();
    const g = game();
    g.trayLoaves().forEach((loaf, i) => this.makeLoafNode(loaf, 46 + i * 58, 392));
    for (let s = 0; s < g.shelfCount(); s++) {
      g.shelfLoaves(s).forEach((loaf, i) => {
        const r = this.shelfRect(s);
        this.makeLoafNode(loaf, r.x + 36 + i * 40, r.y + 28);
      });
    }
  }

  private makeLoafNode(loaf: Loaf, x: number, y: number): void {
    const g = this.add.graphics();
    drawLoaf(g, 0, 0, loaf.recipeId, 1);
    const label = this.add.text(0, 16, `${Math.round(loaf.freshness)}%`, textStyle(10, "#8a6a55")).setOrigin(0.5, 0);
    const hit = this.add.circle(0, 0, 22, 0x000000, 0.001).setInteractive({ draggable: true, useHandCursor: true });
    const box = this.add.container(x, y, [g, label, hit]);
    this.input.setDraggable(hit);
    this.loafNodes.set(loaf.id, box);

    hit.on("drag", (pointer: Phaser.Input.Pointer) => {
      box.setDepth(10);
      box.x = pointer.x;
      box.y = pointer.y;
    });
    hit.on("dragend", () => {
      const state = game();
      let best = -1;
      let bestD = 70;
      for (let s = 0; s < state.shelfCount(); s++) {
        const r = this.shelfRect(s);
        const d = Phaser.Math.Distance.Between(box.x, box.y, r.centerX, r.centerY);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      if (best >= 0) state.placeOnShelf(loaf.id, best);
      else if (loaf.shelf != null) loaf.shelf = null;
      this.rebuildLoaves();
    });
  }

  private drawPriceRow(): void {
    const g = game();
    const ids = [...new Set(g.loaves.filter((l) => l.freshness > 0).map((l) => l.recipeId))];
    if (!ids.length) ids.push(...g.featured);
    ids.slice(0, 3).forEach((id, i) => {
      const y = 448 + i * 44;
      const recipe = RECIPE_MAP[id];
      this.add.graphics()
        .fillStyle(C.white, 1)
        .lineStyle(2, C.line, 1)
        .fillRoundedRect(16, y, this.scale.width - 32, 40, 10)
        .strokeRoundedRect(16, y, this.scale.width - 32, 40, 10);
      this.add.text(26, y + 10, recipe.name, textStyle(13, "#5c3d2e"));
      const price = this.add.text(120, y + 10, `$${g.effectivePrice(id)}`, textStyle(13, "#c45c28"));
      this.priceLabels.set(id, price);
      button(this, 200, y + 20, 28, 24, "−", () => {
        g.setPrice(id, (g.prices[id] ?? recipe.suggestedPrice) - 2);
        price.setText(`$${g.effectivePrice(id)}`);
      }, C.inkSoft);
      button(this, 234, y + 20, 28, 24, "+", () => {
        g.setPrice(id, (g.prices[id] ?? recipe.suggestedPrice) + 2);
        price.setText(`$${g.effectivePrice(id)}`);
      }, C.sage);
      button(this, 310, y + 20, 64, 24, g.sales[id] ? "特價中" : "特價", () => {
        g.toggleSale(id);
        price.setText(`$${g.effectivePrice(id)}`);
      }, g.sales[id] ? C.accent : C.line);
    });
  }

  private drawCustomers(dt: number): void {
    this.faces.clear();
    const list = game().customers;
    const live = new Set(list.map((c) => c.id));
    for (const id of [...this.walkX.keys()]) {
      if (!live.has(id)) this.walkX.delete(id);
    }
    list.forEach((c, i) => {
      const target = 40 + i * 52;
      const cur = this.walkX.get(c.id) ?? -24;
      const next = cur + (target - cur) * Math.min(1, dt * 6);
      this.walkX.set(c.id, next);
      drawFace(this.faces, next, 300, c.mood);
    });
  }
}
