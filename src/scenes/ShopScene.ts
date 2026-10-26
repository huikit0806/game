import Phaser from "phaser";
import { SHOP_SECONDS } from "../config";
import { RECIPE_MAP } from "../data/recipes";
import { game } from "../state/GameState";
import type { Loaf } from "../state/types";
import { drawFace, drawLoaf, pop } from "../art/draw";
import { C, textStyle } from "../ui/theme";
import { button, progressBar, roundRect, toast, topBar } from "../ui/widgets";

export class ShopScene extends Phaser.Scene {
  private timeBar: { set: (t: number) => void } | null = null;
  private clock!: Phaser.GameObjects.Text;
  private cash!: Phaser.GameObjects.Text;
  private faces!: Phaser.GameObjects.Graphics;
  private loafNodes = new Map<string, Phaser.GameObjects.Container>();
  private dragging: Loaf | null = null;

  constructor() {
    super("shop");
  }

  init(): void {
    this.timeBar = null;
    this.loafNodes = new Map();
    this.dragging = null;
  }

  create(): void {
    const g = game();
    const w = this.scale.width;
    this.cameras.main.setBackgroundColor(C.paper);
    topBar(this, "營業中", g.cash, g.day, g.level);
    this.cash = this.children.getByName("cashLabel") as Phaser.GameObjects.Text;

    this.clock = this.add.text(20, 80, "", textStyle(13, "#8a6a55"));
    this.timeBar = progressBar(this, 20, 100, w - 40, 12);

    this.add.text(20, 122, "把托盤的包拖到架子 · 可即時調價", textStyle(12, "#8a6a55"));
    this.drawShelves();
    this.rebuildLoaves();
    this.drawPriceRow();

    this.faces = this.add.graphics();
    this.add.text(20, 560, "客人", textStyle(13, "#5c3d2e", { fontStyle: "bold" }));

    button(this, w / 2, this.scale.height - 44, 200, 42, "提早收工", () => {
      g.shopTime = 0;
    }, C.inkSoft);
  }

  update(_t: number, delta: number): void {
    const g = game();
    const dt = delta / 1000;
    const ev = g.tickShop(dt);
    this.timeBar?.set(g.shopTime / SHOP_SECONDS);
    this.clock.setText(`剩餘 ${Math.max(0, g.shopTime).toFixed(0)} 秒 · 已賣 ${g.log.customersServed}`);

    if (ev.baked.length) {
      toast(this, "剛出爐！拖去上架");
      this.rebuildLoaves();
    }
    if (ev.bought) {
      toast(this, `賣出 ${RECIPE_MAP[ev.bought.recipeId].name} +$${g.effectivePrice(ev.bought.recipeId)}`);
      this.rebuildLoaves();
      this.refreshCash();
      pop(this, this.faces);
    }
    if (ev.left) toast(this, "有客人等不及走了");
    this.drawCustomers();

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
    const w = this.scale.width;
    for (let i = 0; i < g.shelfCount(); i++) {
      const x = 16 + (i % 3) * 122;
      const y = 148 + Math.floor(i / 3) * 100;
      roundRect(this, x, y, 112, 88, C.shelf);
      this.add.text(x + 8, y + 6, `架 ${i + 1}`, textStyle(11, "#8a6a55"));
    }
    roundRect(this, 16, 360, w - 32, 86, C.white);
    this.add.text(26, 368, "出爐托盤", textStyle(12, "#5c3d2e", { fontStyle: "bold" }));
  }

  private shelfRect(i: number): Phaser.Geom.Rectangle {
    const x = 16 + (i % 3) * 122;
    const y = 148 + Math.floor(i / 3) * 100;
    return new Phaser.Geom.Rectangle(x, y, 112, 88);
  }

  private rebuildLoaves(): void {
    for (const n of this.loafNodes.values()) n.destroy();
    this.loafNodes.clear();
    const g = game();
    const tray = g.trayLoaves();
    tray.forEach((loaf, i) => this.makeLoafNode(loaf, 46 + i * 58, 412));
    for (let s = 0; s < g.shelfCount(); s++) {
      g.shelfLoaves(s).forEach((loaf, i) => {
        const r = this.shelfRect(s);
        this.makeLoafNode(loaf, r.x + 32 + i * 48, r.y + 50);
      });
    }
  }

  private makeLoafNode(loaf: Loaf, x: number, y: number): void {
    const g = this.add.graphics();
    drawLoaf(g, 0, 0, loaf.recipeId, 1);
    const label = this.add
      .text(0, 18, `${Math.round(loaf.freshness)}%`, textStyle(10, "#8a6a55"))
      .setOrigin(0.5, 0);
    const hit = this.add.circle(0, 0, 22, 0x000000, 0.001).setInteractive({ draggable: true, useHandCursor: true });
    const box = this.add.container(x, y, [g, label, hit]);
    this.input.setDraggable(hit);
    this.loafNodes.set(loaf.id, box);

    hit.on("dragstart", () => {
      this.dragging = loaf;
      box.setDepth(10);
    });
    hit.on("drag", (pointer: Phaser.Input.Pointer) => {
      box.x = pointer.x;
      box.y = pointer.y;
    });
    hit.on("dragend", () => {
      const state = game();
      let placed = false;
      for (let s = 0; s < state.shelfCount(); s++) {
        if (this.shelfRect(s).contains(box.x, box.y)) {
          placed = state.placeOnShelf(loaf.id, s);
          break;
        }
      }
      if (!placed && loaf.shelf != null) {
        // 拖回托盤
        loaf.shelf = null;
      }
      this.rebuildLoaves();
    });
  }

  private drawPriceRow(): void {
    const g = game();
    const ids = [...new Set(g.loaves.filter((l) => l.freshness > 0).map((l) => l.recipeId))];
    if (!ids.length) ids.push(...g.featured);
    ids.slice(0, 4).forEach((id, i) => {
      const y = 456 + i * 26;
      const recipe = RECIPE_MAP[id];
      this.add.text(20, y, recipe.name, textStyle(12, "#5c3d2e"));
      const price = this.add.text(120, y, `$${g.effectivePrice(id)}`, textStyle(12, "#c45c28", { fontStyle: "bold" }));
      button(this, 190, y + 8, 28, 22, "−", () => {
        g.setPrice(id, (g.prices[id] ?? recipe.suggestedPrice) - 2);
        price.setText(`$${g.effectivePrice(id)}`);
      }, C.inkSoft);
      button(this, 224, y + 8, 28, 22, "+", () => {
        g.setPrice(id, (g.prices[id] ?? recipe.suggestedPrice) + 2);
        price.setText(`$${g.effectivePrice(id)}`);
      }, C.sage);
      button(this, 300, y + 8, 56, 22, g.sales[id] ? "特價中" : "特價", () => {
        g.toggleSale(id);
        this.scene.restart();
      }, g.sales[id] ? C.accent : C.line);
    });
  }

  private drawCustomers(): void {
    this.faces.clear();
    game().customers.forEach((c, i) => {
      drawFace(this.faces, 40 + i * 52, 610, c.mood);
    });
  }
}
