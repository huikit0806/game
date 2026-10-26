import type { UpgradeDef } from "../state/types";

export const UPGRADES: UpgradeDef[] = [
  {
    id: "ovenSlots",
    name: "烤箱容量",
    blurb: "同時多烘幾盤。",
    maxLevel: 3,
    costs: [80, 160, 280],
  },
  {
    id: "ovenSpeed",
    name: "烤箱速度",
    blurb: "縮短烘烤時間。",
    maxLevel: 3,
    costs: [70, 150, 260],
  },
  {
    id: "mixerSpeed",
    name: "攪拌機",
    blurb: "配料／攪拌更快完成。",
    maxLevel: 3,
    costs: [60, 130, 220],
  },
  {
    id: "shelves",
    name: "展示架",
    blurb: "櫃面可放更多包。",
    maxLevel: 3,
    costs: [70, 140, 240],
  },
  {
    id: "decor",
    name: "店面裝修",
    blurb: "客人來得更密。",
    maxLevel: 3,
    costs: [90, 180, 300],
  },
  {
    id: "staff",
    name: "請員工",
    blurb: "營業時自動補架。",
    maxLevel: 1,
    costs: [220],
  },
];

export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
