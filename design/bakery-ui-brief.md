# Bakery sim — pen.dev UI brief

Portrait mobile **390×844** (iPhone). Shared chrome on all main tabs:

- Top status: day number, cash `$`, maybe star rating
- Bottom tab bar (4): **入貨** | **做包** | **店面** | **結算**
- Active tab highlighted; icons + Cantonese labels

## Visual direction

Warm bakery, not generic purple SaaS. Flour-dust cream paper, soft caramel / cocoa accents, rounded soft corners (not pill clusters). Expressive display type for titles; readable body. Real product imagery placeholders (flour bags, dough, loaves, shop counter) — not abstract gradients as the main idea.

## Screens to design in one `.pen`

1. **入貨 (Buy)** — supplier shop: category chips (flour / dairy / toppings), ingredient cards (icon, name, price, stock owned), cart / confirm buy CTA
2. **做包 — recipe pick** — recipe list with required ingredients (enough / missing state), “開始做包” CTA
3. **做包 — knead** — full-screen minigame: dough in center, gesture hint (swipe/circle), progress ring, cancel
4. **做包 — toppings** — dough base + draggable topping tray; target zones; done CTA
5. **店面 (Shop)** — counter / shelves with finished bread to place/sell; customer queue strip; price tags
6. **結算 (Day end)** — revenue, costs, waste, net profit, “開始下一日” CTA

Also a lightweight **component sheet**: tab bar, ingredient card, recipe row, primary/secondary buttons, cash chip.

## Labels

Prefer Traditional Chinese (Cantonese UI copy) as in the product: 入貨、做包、店面、結算、現金、第 N 日、開始做包、確認入貨、開始下一日.
