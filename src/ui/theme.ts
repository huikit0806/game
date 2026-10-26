import Phaser from "phaser";

/** 溫暖紙本風：奶油底、可可線、赤陶強調。 */

export const C = {
  paper: 0xfff6ea,
  cream: 0xf7e4c8,
  ink: 0x5c3d2e,
  inkSoft: 0x8a6a55,
  line: 0xc4a484,
  accent: 0xe07a3d,
  accentDeep: 0xc45c28,
  sage: 0x6f9b6a,
  rose: 0xd46a6a,
  white: 0xfffdf8,
  shelf: 0xe8c9a0,
};

export const FONT = 'GameSans, "WenQuanYi Micro Hei", "Noto Sans TC", "PingFang TC", sans-serif';

export function textStyle(
  size: number,
  color = "#5c3d2e",
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    // 單一 TTF 沒有 bold face。Phaser 設 bold 會換西文體，中文變方格。
    align: extra.align ?? "left",
    wordWrap: extra.wordWrap,
  };
}
