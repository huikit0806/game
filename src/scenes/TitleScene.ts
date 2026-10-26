import Phaser from "phaser";
import { clearSave } from "../systems/save";
import { game, resetGame } from "../state/GameState";
import { C, textStyle } from "../ui/theme";
import { button, roundRect } from "../ui/widgets";
import { drawLoaf } from "../art/draw";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  init(): void {
    // Scene 實例會重用，每輪進標題都清掉上一幀殘留。
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor(C.paper);
    this.add.rectangle(w / 2, h / 2, w, h, C.paper);

    this.add
      .text(w / 2, 88, "小暖麵包店", textStyle(34, "#5c3d2e", { fontStyle: "bold" }))
      .setOrigin(0.5);
    this.add
      .text(w / 2, 128, "訂料 · 做包 · 賣包 · 收工", textStyle(15, "#8a6a55"))
      .setOrigin(0.5);

    const card = roundRect(this, 48, 170, w - 96, 210, C.white);
    const art = this.add.graphics();
    drawLoaf(art, w / 2, 250, "white", 2.2);
    drawLoaf(art, w / 2 - 70, 280, "pineapple", 1.4);
    drawLoaf(art, w / 2 + 72, 278, "chocolate", 1.4);
    this.tweens.add({
      targets: [card, art],
      y: "+=6",
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(
        w / 2,
        410,
        "輕鬆經營一間街坊麵包店。\n做包有手感，賣包有一點點策略。",
        textStyle(14, "#8a6a55", { align: "center" }),
      )
      .setOrigin(0.5);

    const hasSave = game().day > 1 || game().cash !== 180 || game().xp > 0 || game().level > 1;
    button(this, w / 2, 520, 240, 52, hasSave ? "繼續營業" : "開始營業", () => {
      game().phase = "prep";
      this.scene.start("prep");
    });
    button(
      this,
      w / 2,
      588,
      240,
      48,
      "新的一局",
      () => {
        clearSave();
        resetGame();
        this.scene.start("prep");
      },
      C.inkSoft,
    );

    this.add
      .text(w / 2, h - 36, "本地存檔 · 可隨時關掉再開", textStyle(12, "#c4a484"))
      .setOrigin(0.5);
  }
}
