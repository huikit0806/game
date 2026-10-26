import Phaser from "phaser";
import { RECIPE_MAP } from "../data/recipes";
import { UPGRADES } from "../data/upgrades";
import { profit } from "../systems/economy";
import { describeRule } from "../systems/unlock";
import { RECIPE_UNLOCKS } from "../data/unlocks";
import { game } from "../state/GameState";
import { C, textStyle } from "../ui/theme";
import { button, roundRect, toast, topBar } from "../ui/widgets";

export class SettleScene extends Phaser.Scene {
  constructor() {
    super("settle");
  }

  create(): void {
    const g = game();
    const w = this.scale.width;
    this.cameras.main.setBackgroundColor(C.paper);
    topBar(this, "今日結算", g.cash, g.day, g.level);

    const p = profit(g.log.revenue, g.log.materialCost);
    const best = g.bestSeller();
    roundRect(this, 16, 84, w - 32, 210, C.white);
    const lines = [
      `營業額  $${g.log.revenue}`,
      `材料成本  $${g.log.materialCost}`,
      `利潤  $${p}`,
      `服務客人  ${g.log.customersServed}　離開 ${g.log.customersLeft}`,
      `浪費  ${g.log.wasted} 個`,
      `最賣得  ${best ? `${RECIPE_MAP[best.id].name} ×${best.count}` : "—"}`,
      `經驗  +${g.log.xpEarned}${g.goalJustDone ? `　目標完成 +$${g.goal.rewardCash}` : ""}`,
    ];
    lines.forEach((line, i) => {
      this.add.text(32, 96 + i * 26, line, textStyle(15, i === 2 ? "#c45c28" : "#5c3d2e"));
    });

    if (g.lastUnlocks.length) {
      this.add.text(20, 306, "新解鎖：" + g.lastUnlocks.join("、"), textStyle(13, "#6f9b6a"));
    } else {
      const locked = (Object.keys(RECIPE_UNLOCKS) as (keyof typeof RECIPE_UNLOCKS)[]).filter(
        (id) => !g.unlockedRecipes.includes(id),
      )[0];
      if (locked) {
        this.add.text(20, 306, `下一款：${RECIPE_MAP[locked].name}（${describeRule(RECIPE_UNLOCKS[locked])}）`, textStyle(12, "#8a6a55"));
      }
    }

    this.add.text(20, 334, "把錢投入升級", textStyle(14, "#5c3d2e", { fontStyle: "bold" }));
    UPGRADES.forEach((u, i) => {
      const lv = g.upgrades[u.id];
      const y = 358 + i * 52;
      const maxed = lv >= u.maxLevel;
      const cost = maxed ? "—" : `$${u.costs[lv]}`;
      roundRect(this, 16, y, w - 32, 46, C.white);
      this.add.text(28, y + 6, `${u.name}  Lv.${lv}/${u.maxLevel}`, textStyle(14, "#5c3d2e", { fontStyle: "bold" }));
      this.add.text(28, y + 24, u.blurb, textStyle(11, "#8a6a55"));
      button(this, w - 58, y + 23, 80, 30, maxed ? "滿級" : cost, () => {
        if (maxed) return;
        if (!g.buyUpgrade(u.id)) {
          toast(this, "現金不夠");
          return;
        }
        toast(this, `${u.name} 升級了`);
        this.scene.restart();
      }, maxed ? C.line : C.accent);
    });

    button(this, w / 2, this.scale.height - 44, 230, 46, "進入下一日", () => {
      g.beginDay(true);
      this.scene.start("prep");
    });
  }
}
