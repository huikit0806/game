# 小暖麵包店

手機優先的休閒麵包店模擬。直向 390×844，Phaser 4 場景切換，狀態存在 `localStorage`。

## 玩法

每日：預約原材料（三日後到，即日急單加五成）→ 做包（落料、搓麵、發酵、烘烤，食物會變形）→ 開舖賣包 → 收工結算。

準備／廚房／結算清單可直向拖動。營業時計時喺上架之後先開始；手機可用「一鍵上架」。出爐有蒸汽同彈跳。

起始只有白麵包。牛奶包、菠蘿包、蛋撻、可頌、丹麥酥、肉鬆包、巧克力包、季節限定用等級、銷量、每日目標或材料解鎖。

## 本機

```bash
npm install
npm test
npm run dev
```

瀏覽器開直向視窗最接近手機。`npm run build` 產出靜態檔。

## 架構

```
場景        Boot → Title → Prep → Kitchen → Shop → Settle ↺
資料        data/ingredients · recipes · unlocks · upgrades
狀態        state/GameState（權威，場景不各自記進度）
系統        systems/economy · unlock · shop · save · goals
UI / 手感   ui/widgets · art/draw（程序化線條，不出圖）
```

加新麵包：在 `recipes.ts` 加一筆，在 `unlocks.ts` 寫條件。不要把數字寫死在場景裡。

## 技術選擇

沒有指定引擎。需求是手機、localStorage、清晰場景、前端可擴展——用 **Phaser 4.2**（不是預設 Godot）：場景機、觸控、FIT 縮放都現成，存檔直接走瀏覽器。
