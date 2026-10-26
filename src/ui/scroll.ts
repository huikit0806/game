import Phaser from "phaser";

/** 直向捲動區：內容超出就拖／滾輪，底部主按鈕可以釘在畫面外。 */
export function scrollPane(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): { content: Phaser.GameObjects.Container; destroy: () => void } {
  const content = scene.add.container(x, y);
  const maskG = scene.add.graphics();
  maskG.fillStyle(0xffffff, 1);
  maskG.fillRect(x, y, w, h);
  content.setMask(maskG.createGeometryMask());
  maskG.setVisible(false);

  const zone = scene.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive();
  zone.setDepth(-1);

  let dragY = 0;
  let start = 0;
  zone.on("pointerdown", (p: Phaser.Input.Pointer) => {
    dragY = p.y;
    start = content.y;
  });
  scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
    if (scene.registry.get("scrollLock")) return;
    if (!p.isDown) return;
    if (!Phaser.Geom.Rectangle.Contains(zone.getBounds(), p.x, p.y) && Math.abs(p.y - dragY) < 4) return;
    if (Math.abs(p.y - dragY) < 2) return;
    content.y = start + (p.y - dragY);
    clamp();
  });
  scene.input.on("wheel", (_p: Phaser.Input.Pointer, _g: unknown, _dx: number, dy: number) => {
    if (scene.registry.get("scrollLock")) return;
    content.y -= dy * 0.4;
    clamp();
  });

  const clamp = () => {
    const bounds = content.getBounds();
    const extra = Math.max(0, bounds.height - h);
    const minY = y - extra;
    content.y = Phaser.Math.Clamp(content.y, minY, y);
  };

  scene.events.once("shutdown", () => {
    maskG.destroy();
    zone.destroy();
  });

  return {
    content,
    destroy: () => {
      maskG.destroy();
      zone.destroy();
      content.destroy();
    },
  };
}
