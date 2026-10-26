import Phaser from "phaser";
import { HEIGHT, WIDTH } from "./config";
import { C } from "./ui/theme";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { PrepScene } from "./scenes/PrepScene";
import { KitchenScene } from "./scenes/KitchenScene";
import { ShopScene } from "./scenes/ShopScene";
import { SettleScene } from "./scenes/SettleScene";

/**
 * 小暖麵包店 — 手機直向經營遊戲。
 *
 * 場景流：boot → title → prep → kitchen → shop → settle → prep
 * 權威狀態在 GameState；場景只負責互動與演出。
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: C.paper,
  width: WIDTH,
  height: HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene, PrepScene, KitchenScene, ShopScene, SettleScene],
};

const prev = (window as unknown as { __warmLoaf?: Phaser.Game }).__warmLoaf;
if (prev) prev.destroy(true);
const gameApp = new Phaser.Game(config);
(window as unknown as { __warmLoaf?: Phaser.Game }).__warmLoaf = gameApp;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    gameApp.destroy(true);
  });
}
