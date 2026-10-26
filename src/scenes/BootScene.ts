import Phaser from "phaser";
import { readSave } from "../systems/save";
import { game, resetGame } from "../state/GameState";
import { C } from "../ui/theme";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(C.paper);
    const save = readSave();
    if (save) {
      resetGame().applySave(save);
    } else {
      game();
    }
    // Phaser 畫文字前必須等 CJK 字型進 document.fonts，否則會變成方格。
    const ready = document.fonts ? document.fonts.load("16px GameSans") : Promise.resolve();
    void ready.finally(() => this.scene.start("title"));
  }
}
