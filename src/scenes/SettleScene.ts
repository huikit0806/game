import Phaser from "phaser";
import { RECIPE_MAP } from "../data/recipes";
import { RECIPE_UNLOCKS } from "../data/unlocks";
import { UPGRADES } from "../data/upgrades";
import { profit } from "../systems/economy";
import { describeRule } from "../systems/unlock";
import { game } from "../state/GameState";
import { C, textStyle } from "../ui/theme";
import { button, toast, topBar } from "../ui/widgets";
import { scrollPane } from "../ui/scroll";

export class SettleScene extends Phaser.Scene {
  constructor() {
    super("settle");
  }

  create(): void {
    const g = game();
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor(C.paper);
    topBar(this, "今日結算", g.cash, g.day, g.level);

    const pane = scrollPane(this, 0, 78, w, h - 150);
    const box = pane.content;
    let y = 6;

    const p = profit(g.log.revenue, g.log.materialCost);
    const best = g.bestSeller();
    const card = this.add.graphics();
    card.fillStyle(C.white, 1);
    card.lineStyle(2, C.line, 1);
    card.fillRoundedRect(16, y, w - 32, 210, 14);
    card.strokeRoundedRect(16, y, w - 32, 210, 14);
    box.add(card);
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
      box.add(this.add.text(32, y + 12 + i * 26, line, textStyle(15, i === 2 ? "#c45c28" : "#5c3d2e")));
    });
    y += 226;

    if (g.lastUnlocks.length) {
      box.add(this.add.text(20, y, "新解鎖：" + g.lastUnlocks.join("、"), textStyle(13, "#6f9b6a")));
    } else {
      const locked = (Object.keys(RECIPE_UNLOCKS) as (keyof typeof RECIPE_UNLOCKS)[]).filter(
        (id) => !g.unlockedRecipes.includes(id),
      )[0];
      if (locked) {
        box.add(
          this.add.text(
            20,
            y,
            `下一款：${RECIPE_MAP[locked].name}（${describeRule(RECIPE_UNLOCKS[locked])}）`,
            textStyle(12, "#8a6a55", { wordWrap: { width: w - 40 } }),
          ),
        );
      }
    }
    y += 40;

    box.add(this.add.text(20, y, "把錢投入升級", textStyle(14, "#5c3d2e")));
    y += 28;
    UPGRADES.forEach((u) => {
      const lv = g.upgrades[u.id];
      const maxed = lv >= u.maxLevel;
      const cost = maxed ? "—" : `$${u.costs[lv]}`;
      const row = this.add.container(0, y);
      const bg = this.add.graphics();
      bg.fillStyle(C.white, 1);
      bg.lineStyle(2, C.line, 1);
      bg.fillRoundedRect(16, 0, w - 32, 46, 12);
      bg.strokeRoundedRect(16, 0, w - 32, 46, 12);
      const title = this.add.text(28, 6, `${u.name}  Lv.${lv}/${u.maxLevel}`, textStyle(14, "#5c3d2e"));
      const blurb = this.add.text(28, 24, u.blurb, textStyle(11, "#8a6a55"));
      const btn = button(this, w - 58, 23, 80, 30, maxed ? "滿級" : cost, () => {
        if (maxed) return;
        if (!g.buyUpgrade(u.id)) {
          toast(this, "現金不夠");
          return;
        }
        toast(this, `${u.name} 升級了`);
        this.scene.restart();
      }, maxed ? C.line : C.accent);
      row.add([bg, title, blurb, btn.container]);
      box.add(row);
      y += 52;
    });

    const fade = this.add.graphics().setDepth(8);
    fade.fillStyle(C.paper, 1);
    fade.fillRect(0, h - 72, w, 72);
    button(this, w / 2, h - 40, 230, 46, "進入下一日", () => {
      g.beginDay(true);
      this.scene.start("prep");
    }).container.setDepth(9);
  }
}
