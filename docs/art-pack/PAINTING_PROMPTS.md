# 绘画 Agent 提示词包

给 **2D 绘画 Agent** 用。每条资产一份完整提示词，复制代码块即可，不要拼多条。  
生成后按文件名丢进 [`apps/web/public/assets/art/`](../../apps/web/public/assets/art/)。  
3D / GLB 规格仍在 [`PROMPTS.md`](PROMPTS.md) 与 [`../ART_PACK.md`](../ART_PACK.md)，本包只出 PNG。

游戏：《看山异闻录 · 周期庭院》  
风格锚点：ustwo《纪念碑谷》等距正交，化学是建筑，不是贴纸。  
**主角不是刘看山。** 玩家是赤陶斗篷微型人形旅人。刘看山是官方白狐 NPC，只画缺的坐姿。

---

## 0. 怎么交给绘画 Agent

1. 先做 **P0**，再 P1、P2。P0 齐了就能把交互点从隐形点击板换成醒目道具。
2. 每次只生成 **一条** 资产。把「全局前缀」+「该资产正文」整段粘贴。
3. 刘看山坐姿必须同时附上参考图：
   - `docs/art-pack/references/liu-kanshan/liu-orthographic-front-side-back.jpg`
   - `docs/art-pack/references/liu-kanshan/liu-hero-white.jpg`
   - `docs/art-pack/references/liu-kanshan/idle.png`
4. 主角参考 **不要** 附刘看山图，避免画成狐狸。
5. 输出 PNG，文件名必须与本包完全一致。透明底不要棋盘水印。
6. 场景里允许的字只有 `H` `C` `O` 和数字 `1` `6` `8` `10` `12` `14`，而且只有提示词要求时才出现。

---

## 1. 全局前缀（每条都先贴）

```
Monument Valley isometric orthographic game art, ustwo clay-smooth 3D look, cream plaster #F3DDC0, terracotta #C47B58 and #B56B4E, stone lip #8E5340, gold inlay #E7C56A, long soft afternoon shadows, sparse elegant finished production asset. Chemistry reads from architecture, not stickers or HUD. Scene letters only H C O and digits 1 6 8 10 12 14 when this prompt specifies them. No checkerboard floor, no grout grid, no mosaic tiles, no gem piles, no collage, no photorealism, no anime, no cyberpunk, no neon glow bloom, no watermark, no Chinese sentences, no English UI sentences, no fox protagonist, no Liu Kanshan unless this prompt explicitly asks for him.
```

### 全局负面（可再贴一次）

```
no checkerboard, no tile grout, no mosaic, no Minecraft blocks, no crystal clutter, no gem pile, no floating UI, no glow bloom, no lens flare, no watermark, no logo, no photoreal skin pores, no fur, no anime eyes, no cyberpunk, no neon, no Chinese text, no English sentences, no periodic table chart, no fox player character, no white bean body unless this is Liu Kanshan, no black stick limbs on the human traveler
```

### 尺寸

| 类型 | 画布 | 背景 | 落地 |
|---|---|---|---|
| 角色 / 交互道具精灵 | 1024×1024 | 透明 | 脚底或底座落在画布底部约 8% |
| 建筑剪影 | 2048×2048 | 透明 | 建筑落在下 1/3，不要地面、不要天空 |
| 无缝贴图 | 2048×2048 | 不透明 | 可平铺，看不出格子 |
| UI 图标 | 512×512 | 透明 | 图形居中，四周留白 |
| 登录英雄图 | 1920×1080 | 不透明 | 全幅场景，无 UI |
| 加载 / 概念 | 2048×1152 | 不透明 | 海报构图 |

角色和道具 **不要** 把投影画进 PNG。引擎自己打光。

---

## 2. 不要画（官方复用）

这些文件已经在 `apps/web/public/assets/liu-kanshan/`，禁止重设计：

| ID | 文件 | 用途 |
|---|---|---|
| CHR-LIU-IDLE | `idle.png` / `idle.gif` | 站立 |
| CHR-LIU-GREET | `greet.png` / `greet.gif` | 招呼 |
| CHR-LIU-WANDER | `wander.gif` | 踱步 |
| CHR-LIU-SLEEP | `sleep.gif` | 打盹 |
| CHR-LIU-BALL | `ball.gif` | 玩球 |
| CHR-LIU-COMPUTER | `computer.png` / `computer.gif` | 查阅 |

刘看山形象锁死：哑光白豆身、尖白耳、巨大圆黑鼻、一只小黑点眼睛、细黑四肢、圆白尾。不穿衣服，不戴眼镜，不换色。

---

## 3. 总清单（按生成顺序）

落地目录一律：`apps/web/public/assets/art/<filename>`

### P0 先画（交互能看见、英雄场景能立住）

| ID | 中文 | 格子 | 文件名 | 尺寸 |
|---|---|---|---|---|
| CHR-PLAYER-IDLE | 主角站立 | 5,28 | `kanshan-player-idle.png` | 1024 |
| CHR-PLAYER-WALK | 主角行走 | 全图 | `kanshan-player-walk.png` | 1024 |
| CHR-PLAYER-INTERACT | 主角交互 | 全图 | `kanshan-player-interact.png` | 1024 |
| CHR-PLAYER-PORTRAIT | 主角头像 | UI | `kanshan-player-portrait.png` | 1024 |
| REF-PLAYER-TURNAROUND | 主角三视图 | 设定 | `kanshan-player-turnaround.png` | 2048×1152 |
| CHR-LIU-SIT | 刘看山坐姿 | 4,25 | `kanshan-liu-sit-chapel.png` | 1024 |
| INT-BOOK-OPEN | 打开的田野笔记 | 交互英雄道具 | `kanshan-int-book-open.png` | 1024 |
| INT-BOOK-CLOSED | 合上的笔记 | 未读/收藏 | `kanshan-int-book-closed.png` | 1024 |
| INT-LECTERN-SYMBOL | 符号记忆读经台 | 13,25 | `kanshan-int-lectern-symbol.png` | 1024 |
| INT-ATOM-H | 氢仪轨 | 8,24 | `kanshan-int-atom-h.png` | 1024 |
| INT-ATOM-C | 碳仪轨 | 11,24 | `kanshan-int-atom-c.png` | 1024 |
| INT-ATOM-O | 氧仪轨 | 14,24 | `kanshan-int-atom-o.png` | 1024 |
| INT-FORUM-HEX | 碳六边形论坛徽章 | 10,26 | `kanshan-int-forum-hex.png` | 1024 |
| INT-RIFT-RING | 每日裂隙环 | 13,28 | `kanshan-int-rift-ring.png` | 1024 |
| INT-GATE-ATOMIC | 身份门 1-6-8 | 15,25 | `kanshan-int-gate-atomic.png` | 2048 |
| ARCH-QUAY-CHAPEL | 西礼拜堂 | 4,25 西 | `kanshan-arch-quay-chapel.png` | 2048 |
| ARCH-QUAY-PALACE | 后宫三拱 | y=23 | `kanshan-arch-quay-palace.png` | 2048 |
| ARCH-QUAY-GATEHOUSE | 东门楼 | 15,25 | `kanshan-arch-quay-gatehouse.png` | 2048 |
| ARCH-QUAY-PARAPET | 前缘女墙 | y=31 | `kanshan-arch-quay-parapet.png` | 2048 |
| ENV-CYPRESS | 柏树 | 6,31 / 10,31 / 14,31 | `kanshan-env-cypress.png` | 1024 |
| ENV-SUN | 扁平日盘 | 远景 | `kanshan-env-sun.png` | 1024 |
| TEX-PLASTER-CREAM | 奶油灰泥 | 庭院地 | `kanshan-tex-plaster-cream.png` | 2048 seamless |
| TEX-PLASTER-TERRACOTTA | 赤陶灰泥 | 庭院墙 | `kanshan-tex-plaster-terracotta.png` | 2048 seamless |
| TEX-LIP | 压顶 | 台地边 | `kanshan-tex-lip.png` | 2048 seamless |
| TEX-GOLD-INLAY | 金嵌线条带 | 键径 | `kanshan-tex-gold-inlay.png` | 2048 strip |
| REF-HERO-QUAY | 无名原子庭英雄图 | 概念 | `kanshan-quay-hero.png` | 1920×1080 |

### P1（其余台地与交互建筑）

| ID | 中文 | 格子 | 文件名 | 尺寸 |
|---|---|---|---|---|
| INT-LECTERN-PERIODIC | 周期拼台读经台 | 22,23 | `kanshan-int-lectern-periodic.png` | 1024 |
| INT-LECTERN-ORBIT | 轨道连线读经台 | 29,17 | `kanshan-int-lectern-orbit.png` | 1024 |
| INT-GATE-PERIODIC | 周期廊门 | 18,24 | `kanshan-int-gate-periodic.png` | 1024 |
| INT-GATE-ELECTRON | 电子台门 | 25,20 | `kanshan-int-gate-electron.png` | 1024 |
| INT-GATE-FAMILY | 温室门 | 33,17 | `kanshan-int-gate-family.png` | 1024 |
| INT-GATE-BOND | 键工坊门 | 37,13 | `kanshan-int-gate-bond.png` | 1024 |
| INT-GATE-ISOTOPE | 同位素门 | 40,6 | `kanshan-int-gate-isotope.png` | 1024 |
| INT-CATEGORY-PERIODIC | 周期廊知识碑 | 20,22 | `kanshan-int-category-periodic.png` | 1024 |
| INT-CATEGORY-ELECTRON | 电子台知识碑 | 27,18 | `kanshan-int-category-electron.png` | 1024 |
| INT-CATEGORY-FAMILY | 温室知识碑 | 34,17 | `kanshan-int-category-family.png` | 1024 |
| INT-CATEGORY-BOND | 键工坊知识碑 | 38,11 | `kanshan-int-category-bond.png` | 1024 |
| INT-CATEGORY-ISOTOPE | 同位素知识碑 | 41,4 | `kanshan-int-category-isotope.png` | 1024 |
| INT-HOOK-NEON | 空白 10 号石格 | 16,14 | `kanshan-int-hook-neon.png` | 1024 |
| INT-HOOK-NOBLE | 稀有气体三灯 | 28,25 | `kanshan-int-hook-noble.png` | 1024 |
| INT-HOOK-WATER | 缺键水分子拱 | 35,22 | `kanshan-int-hook-water.png` | 1024 |
| INT-HOOK-C14 | 碳-14 回声 | 40,10 | `kanshan-int-hook-c14.png` | 1024 |
| ARCH-PERIODIC | 周期坐标廊 | 17-23×20-25 | `kanshan-arch-periodic.png` | 2048 |
| ARCH-ELECTRON | 电子观测台 | 24-30×16-22 | `kanshan-arch-electron.png` | 2048 |
| ARCH-FAMILY | 家族温室 | 32-36×15-20 | `kanshan-arch-family.png` | 2048 |
| ARCH-BOND | 键工坊 | 35-41×9-14 | `kanshan-arch-bond.png` | 2048 |
| ARCH-ISOTOPE | 同位素穹室 | 38-43×2-7 | `kanshan-arch-isotope.png` | 2048 |
| ENV-MESA | 远景桌山 | 世界 | `kanshan-env-mesa.png` | 2048 |
| TEX-SAGE | 周期廊灰泥 | periodic | `kanshan-tex-sage.png` | 2048 |
| TEX-TEAL | 电子台灰泥 | electron | `kanshan-tex-teal.png` | 2048 |
| TEX-CORAL | 温室灰泥 | family/water | `kanshan-tex-coral.png` | 2048 |
| TEX-OCHRE | 键工坊灰泥 | bond | `kanshan-tex-ochre.png` | 2048 |
| TEX-SLATE | 同位素灰泥 | isotope | `kanshan-tex-slate.png` | 2048 |
| TEX-WATER | 潟湖水面 | quay 前缘 | `kanshan-tex-water.png` | 2048 |
| TEX-SKY | 暖雾天空 | 世界 | `kanshan-tex-sky.png` | 2048 |

### P2（UI / 登录 / 特效）

| ID | 中文 | 文件名 | 尺寸 |
|---|---|---|---|
| UI-SKILL-ATOMIC | 技能·核视 | `kanshan-ui-skill-atomic.png` | 512 |
| UI-SKILL-PERIODIC | 技能·周期 | `kanshan-ui-skill-periodic.png` | 512 |
| UI-SKILL-VALENCE | 技能·价引 | `kanshan-ui-skill-valence.png` | 512 |
| UI-SKILL-FAMILY | 技能·族鸣 | `kanshan-ui-skill-family.png` | 512 |
| UI-SKILL-BOND | 技能·键织 | `kanshan-ui-skill-bond.png` | 512 |
| UI-SKILL-ISOTOPE | 技能·同位 | `kanshan-ui-skill-isotope.png` | 512 |
| UI-PROMPT-E | 交互键帽 E | `kanshan-ui-prompt-e.png` | 512 |
| UI-BOOK-ICON | 手册小图标 | `kanshan-ui-book-icon.png` | 512 |
| UI-BRAND-MARK | 登录品牌标 | `kanshan-ui-brand-mark.png` | 512 |
| LOGIN-HERO | 登录英雄背景 | `kanshan-login-hero.png` | 1920×1080 |
| LOADING-ORRERY | 加载仪轨 | `kanshan-loading-orrery.png` | 1024 |
| VFX-NICHE-LIT | 壁龛检视光 | `kanshan-vfx-niche-lit.png` | 1024 |
| VFX-RIFT | 裂隙脉冲 | `kanshan-vfx-rift.png` | 1024 |
| VFX-UNLOCK | 技能解锁环 | `kanshan-vfx-unlock.png` | 1024 |

---

## 4. P0 逐条提示词

每条都是完整提示词。先贴第 1 节前缀，再贴下面正文；或直接复制带前缀的完整块。

---

### CHR-PLAYER-IDLE  主角站立（不是刘看山）

- 文件：`kanshan-player-idle.png`
- 1024×1024 PNG，透明底，脚底约在画布底部 8%
- 用途：玩家默认精灵，出生格 5,28

```
Monument Valley isometric orthographic game character sprite, fully transparent background, no ground plane, no baked contact shadow. Tiny human explorer, not an animal, not a fox, not Liu Kanshan. Stylized clay-smooth ustwo 3D. Head-to-body about 1:2, pawn-sized in a giant plaza. Terracotta travel cloak #B56B4E with cream lining #F3DDC0, teal-stone belt #4F7F96, a small brass pocket lens case on a diagonal strap, short warm-toned hair, rounded leather shoes, warm skin, cloth limbs not stick limbs. Standing idle, 3/4 facing the isometric camera, full body, feet planted, calm breathing pose. Soft afternoon light, no outline, no pores, no fur, no facial detail noise. Palette #F3DDC0 #C47B58 #E7C56A. Do not copy the official white fox mascot. No black stick limbs, no giant black nose, no pointed white ears, no round white tail, no watermark.
```

中文验收：微型人形旅人，赤陶斗篷，黄铜透镜盒。0.5 秒内不能看成白狐。

---

### CHR-PLAYER-WALK  主角行走

- 文件：`kanshan-player-walk.png`
- 1024×1024，单帧东南向中步；不要精灵表

```
Monument Valley isometric orthographic game character sprite, fully transparent background, no ground plane. The same tiny terracotta-cloak human explorer as the idle sheet, identical design: cloak #B56B4E, cream lining #F3DDC0, teal-stone belt, brass pocket lens case, short warm hair, rounded leather shoes. Mid-stride walking southeast, 3/4 isometric, cloak hem lifted slightly, lens case bouncing, front foot contacting the bottom 8% of the frame. Clay-smooth ustwo 3D, soft light, no motion blur streaks, no smear frames, no outline. Not a fox, not Liu Kanshan, no white bean body, no black stick limbs, no watermark.
```

---

### CHR-PLAYER-INTERACT  主角交互

- 文件：`kanshan-player-interact.png`
- 1024×1024

```
Monument Valley isometric orthographic game character sprite, fully transparent background, no ground plane. The same tiny human explorer in terracotta cloak #B56B4E, cream lining, teal belt, brass lens case. Reaching one hand forward and slightly up as if touching an unseen arch keystone, curious not combat, 3/4 isometric, full body, feet at bottom 8%. Clay-smooth ustwo 3D, palette #F3DDC0 #C47B58 #E7C56A. No weapon, no magic beam, no fox, no Liu Kanshan, no watermark.
```

---

### CHR-PLAYER-PORTRAIT  主角头像

- 文件：`kanshan-player-portrait.png`
- 1024×1024，胸像，对话用

```
Monument Valley isometric game portrait bust, fully transparent background. Same tiny human traveler, terracotta cloak collar #B56B4E, cream lining #F3DDC0, short warm hair, brass lens case strap visible on the shoulder, calm curious face, stylized clay-smooth ustwo 3D, 3/4 view, shoulders-up crop, no pores, no anime eyes, no outline. Not a fox, not Liu Kanshan, no giant black nose, no pointed ears. Palette #F3DDC0 #C47B58 #E7C56A. No watermark, no text.
```

---

### REF-PLAYER-TURNAROUND  主角三视图

- 文件：`kanshan-player-turnaround.png`
- 2048×1152，不透明奶油底，设定图

```
Character turnaround sheet for a Monument Valley game, cream paper background #F3DDC0, no UI chrome. Tiny human explorer shown in front, 3/4, side, and back, same height, feet on a faint ground line. Terracotta cloak #B56B4E, cream lining, teal-stone belt, brass pocket lens case, short warm hair, rounded shoes. Clay-smooth ustwo 3D, production model sheet, sparse labels only as tiny letters F / S / B if needed, no Chinese, no English sentences. Not a fox, not Liu Kanshan. No watermark.
```

---

### CHR-LIU-SIT  刘看山西礼拜堂坐姿

- 文件：`kanshan-liu-sit-chapel.png`
- 1024×1024，透明底
- **必须同时附官方参考**：`liu-orthographic-front-side-back.jpg`、`liu-hero-white.jpg`、`idle.png`
- 禁止重设计

```
Official Zhihu mascot Liu Kanshan sitting on a small cream stone cushion, isometric 3/4 Monument Valley camera, fully transparent background except the cushion. Exact official design, match the attached turnaround: smooth matte white bean-shaped body, pointed white ears, huge round black nose, one tiny black dot eye, thin black stick arms and legs, round white tail, no clothes, no glasses, no recolor, no redesign. Calm waiting sit inside a chapel alcove, paws resting, slight breathing. Cushion is a low cream plaster disk with a thin terracotta lip, occupying the bottom 8–12% of the frame. Clay-smooth, no fur texture, no photorealism, no watermark. Do not turn him into the human traveler. Do not add a cloak.
```

中文验收：白豆身、大黑鼻、细黑肢、圆白尾，坐在奶油垫上。和官方 idle 是同一只狐狸。

---

### INT-BOOK-OPEN  打开的田野笔记（交互英雄道具）

- 文件：`kanshan-int-book-open.png`
- 1024×1024，透明底
- 用途：知识卡 / 谜题的醒目「按 E」道具，可单独放，也可搁在读经台上

```
Isometric Monument Valley game prop sprite, fully transparent background, no ground plane. A small cream-stone lectern, terracotta sides #C47B58, thin gold reading slope #E7C56A, chest-high, boolean-clean volumes. The hero is an open field book on the slope: cream pages #F3DDC0, terracotta cover, a gold carbon-hexagon inlay on the cover edge, tiny incised letters H C O on the open page, a brass bookmark ribbon hanging. Clearly reads as "press E here" without any UI, glow, or floating keycap. Clay-smooth ustwo 3D, long soft self-shadow on the lectern only. No modern hardcover dust jacket, no printed paragraphs, no Chinese, no English sentences, no fox, no watermark.
```

中文验收：一眼就是一本摊开的田野笔记，化学来自六边形和 H/C/O，不是贴了元素周期表的课本。

---

### INT-BOOK-CLOSED  合上的笔记

- 文件：`kanshan-int-book-closed.png`
- 1024×1024
- 用途：未读状态、收藏物「元素观察手册」

```
Isometric Monument Valley game prop sprite, fully transparent background, no ground plane. A closed field notebook standing slightly open at the corner as if just set down, terracotta cover #C47B58, cream page edges #F3DDC0, gold carbon-hexagon inlay on the front, brass clasp and bookmark ribbon, no title text. Small, elegant, clay-smooth ustwo 3D, contact at bottom 8%. Same design language as the open book. No modern logo, no ISBN, no Chinese, no English sentences, no fox, no watermark.
```

---

### INT-LECTERN-SYMBOL  符号记忆读经台（13,25）

- 文件：`kanshan-int-lectern-symbol.png`
- 1024×1024
- 格子：13,25 · 贴墙，不要占路心

```
Isometric Monument Valley interactable landmark sprite, fully transparent background, no ground plane. Wall-hugging cream plaster lectern with terracotta sides, thin gold reading slope, chest-high. An open field book on it showing three large elegant letters H, C, O as carved type, plus tiny gold tiles like memory cards along the slope. This is the Element Symbol Memory Table. Sparse, monumental, clearly a place to study, not a kiosk. Clay-smooth ustwo 3D, palette #F3DDC0 #C47B58 #E7C56A. No monitor, no keyboard, no barcode, no floating UI, no glow bloom, no fox, no watermark.
```

---

### INT-ATOM-H  氢仪轨（8,24）

- 文件：`kanshan-int-atom-h.png`
- 1024×1024
- 格子：8,24 · 放在龛内深处，不要占走格中心

```
Isometric Monument Valley architectural relic sprite, fully transparent background, no ground plane. Hydrogen orrery: one gold proton sphere as nucleus #E6BD55, one single thin electron ring, cream and terracotta chapel-relic base. Keystone or ring engraved only "H" and "1". Large like a chapel reliquary, not a desk toy. Clay-smooth ustwo 3D, warm gold light, no bloom, no sparks. Palette #F3DDC0 #C47B58 #E7C56A #E6BD55. No other letters, no Chinese, no fox, no watermark.
```

---

### INT-ATOM-C  碳仪轨（11,24）

- 文件：`kanshan-int-atom-c.png`
- 1024×1024 · 11,24

```
Isometric Monument Valley architectural relic sprite, fully transparent background, no ground plane. Carbon orrery: teal nucleus #68B8AC with six small proton beads, two concentric electron shells, four short valence marks on the inner ring, a hexagonal motif on the niche floor plate. Keystone engraved only "C" and "6". Chapel-scale relic, clay-smooth ustwo 3D, cream and terracotta surround fragments allowed at the base. No other text, no diamond crystal, no molecule stick model, no fox, no watermark.
```

---

### INT-ATOM-O  氧仪轨（14,24）

- 文件：`kanshan-int-atom-o.png`
- 1024×1024 · 14,24

```
Isometric Monument Valley architectural relic sprite, fully transparent background, no ground plane. Oxygen orrery: cooler cyan-water nucleus #75C5D4 with eight proton beads, two electron shells, keystone engraved only "O" and "8". Chapel-scale relic on a cream-terracotta base, clay-smooth ustwo 3D, quieter light than hydrogen. No water splash, no bubbles, no other letters, no fox, no watermark.
```

---

### INT-FORUM-HEX  碳六边形论坛徽章（10,26）

- 文件：`kanshan-int-forum-hex.png`
- 1024×1024
- 格子：10,26 · 嵌平地面，玩家要能走上去，所以主体是地面徽章而不是台子

```
Isometric Monument Valley floor medallion sprite, fully transparent background. A regular hexagon gold inlay #E7C56A for carbon, four short valence marks, cream plaster #F3DDC0 inside the hex, almost flush, not a raised dais, not a crystal. Readable as carbon hexagon plus four bonds from a distance. Slight thickness only at the gold line. Clay-smooth ustwo 3D, top-down-ish isometric. No pedestal, no gems, no text except optional tiny C, no fox, no watermark.
```

---

### INT-RIFT-RING  每日裂隙环（13,28）

- 文件：`kanshan-int-rift-ring.png`
- 1024×1024 · 13,28 · 嵌平细环，不要立碑

```
Isometric Monument Valley floor relic sprite, fully transparent background. A thin cyan ring inlaid in cream plaster, almost flush, slow sacred geometry, reads as a daily rift, not a portal door and not a crystal. Color #75C5D4 with cream #F3DDC0 interior, gold hairline #E7C56A optional. Clay-smooth ustwo 3D, quiet, elegant. No swirl galaxy, no magic circle runes, no Japanese torii, no text, no fox, no watermark.
```

---

### INT-GATE-ATOMIC  身份门 1-6-8（15,25）

- 文件：`kanshan-int-gate-atomic.png`
- 2048×2048 建筑剪影，透明底
- 格子：15,25 · 双塔三槽

```
Isometric Monument Valley architecture cutout, fully transparent background, no ground plane, no sky. East identity gatehouse: two terracotta towers #C47B58 with cream caps #F3DDC0, a walkable arch lintel between them. Three circular sockets in the lintel with tiny incised numerals 1, 6 and 8. Default state: sockets stone-dark, readable. Clay-smooth ustwo 3D, long soft self-shadow on the towers only. Elegant, not a castle portcullis, not a sci-fi scanner. Palette #F3DDC0 #C47B58 #8E5340 #E7C56A. No banners, no iron fence, no Chinese, no English words, no fox, no watermark.
```

---

### ARCH-QUAY-CHAPEL  西礼拜堂

- 文件：`kanshan-arch-quay-chapel.png`
- 2048×2048 · 空座位，狐狸稍后合成

```
Isometric Monument Valley architecture cutout, fully transparent background, no ground plane, no sky. Small west-side chapel, a modest terracotta plaster cube #C47B58 with a single arched alcove facing us, cream cornice #F3DDC0, one cream cushion on a low seat inside, no other furniture. Human scale tiny relative to a palace. Boolean-clean volumes, clay-smooth ustwo 3D. Empty seat; do not draw Liu Kanshan, do not draw the player. No door that would clip a character, no stained glass saints, no cross, no text, no watermark.
```

---

### ARCH-QUAY-PALACE  后宫三拱实验室

- 文件：`kanshan-arch-quay-palace.png`
- 2048×2048
- 必须是三座能分开的拱，不是连体车库

```
Isometric Monument Valley architecture cutout, fully transparent background, no ground plane, no sky. North palace of the Nameless Atom Court: three distinct arched laboratories side by side, not one long garage. Terracotta plaster walls #C47B58, cream pilasters #F3DDC0 between arches, carved keystones. Left arch warmer gold for hydrogen, middle teal for carbon, right cyan-water for oxygen. Each arch is a deep niche large enough for an orrery. Stepped cream slab roof, modest, no giant dome. Clay-smooth ustwo 3D, long self-shadows. Optional tiny keystone letters H C O and digits 1 6 8 only. No connecting garage wall, no chimneys, no windows collage, no fox, no watermark.
```

---

### ARCH-QUAY-GATEHOUSE  东门楼（建筑件，可与 INT-GATE-ATOMIC 同造型更大）

- 文件：`kanshan-arch-quay-gatehouse.png`
- 2048×2048
- 若与 INT-GATE-ATOMIC 重复，画更完整的双塔+基座版本，门洞可走

```
Isometric Monument Valley architecture cutout, fully transparent background, no ground, no sky. Twin-tower cream-and-terracotta gatehouse with a walkable arch, three lintel sockets 1 6 8, cream caps, terracotta bodies, boolean-clean, clay-smooth ustwo 3D. Slightly wider base than the interactable icon version, monumental. Palette #F3DDC0 #C47B58 #8E5340 #E7C56A. No portcullis, no glowing sci-fi slot, no fox, no watermark.
```

---

### ARCH-QUAY-PARAPET  前缘女墙

- 文件：`kanshan-arch-quay-parapet.png`
- 2048×2048

```
Isometric Monument Valley architecture cutout, fully transparent background, no ground, no sky. Low terracotta parapet, chest-high, cream coping #F3DDC0, a gap in the center for a stair bridge, two simple cream pots without trees (trees are a separate asset). Sparse, elegant, clay-smooth ustwo 3D. No iron fence, no banners, no row of ten trees, no text, no watermark.
```

---

### ENV-CYPRESS  柏树

- 文件：`kanshan-env-cypress.png`
- 1024×1024

```
Monument Valley cypress tree sprite, fully transparent background, no ground plane. Stacked six-sided cone foliage in pale sage #DDE8D0, cream plaster trunk #F3DDC0, boolean-clean, isometric, clay-smooth ustwo 3D. Single tree, not a grove. Dry variant hint allowed as slightly warmer #E8D7B6 on one face. No pine needles photoreal, no autumn collage, no watermark.
```

---

### ENV-SUN  扁平日盘

- 文件：`kanshan-env-sun.png`
- 1024×1024，透明底

```
Flat pale sun disc for a Monument Valley sky, fully transparent background. A simple cream-gold circle #F8D7A0 with the faintest warm halo, no lens flare, no sunspots, no rays, no clouds. Soft, paper-like, ustwo. No watermark.
```

---

### TEX-PLASTER-CREAM  奶油灰泥

- 文件：`kanshan-tex-plaster-cream.png`
- 2048×2048 无缝，不透明

```
Seamless 2048x2048 cream plaster albedo texture, Monument Valley, color #F3DDC0, almost uniform, very subtle hand-trowel variation, no tiles, no grout, no checkerboard, no mosaic, no stain grid, no cracks network, no text, no watermark. High-roughness matte plaster, not shiny marble, not concrete photos.
```

---

### TEX-PLASTER-TERRACOTTA  赤陶灰泥

- 文件：`kanshan-tex-plaster-terracotta.png`
- 2048×2048 无缝

```
Seamless 2048x2048 terracotta plaster albedo, Monument Valley, color between #C47B58 and #B56B4E, almost uniform, very subtle trowel variation, no bricks, no grout, no repeating stamp, no graffiti, no watermark. Matte clay wall, not photoreal terracotta photos.
```

---

### TEX-LIP  压顶

- 文件：`kanshan-tex-lip.png`
- 2048×2048 无缝

```
Seamless 2048x2048 stone lip / coping albedo, Monument Valley, color #8E5340, slightly darker than terracotta, almost uniform, subtle worn edge, no bricks, no tiles, no watermark.
```

---

### TEX-GOLD-INLAY  金嵌线条带

- 文件：`kanshan-tex-gold-inlay.png`
- 2048×2048，金线可平铺的条带，背景透明或奶油

```
Thin gold inlay trim texture, warm #E7C56A, soft metal not chrome, not jewelry glitter, Monument Valley, usable as a repeating strip across 2048, transparent or cream #F3DDC0 around the line, no ornate filigree, no runes, no watermark.
```

---

### REF-HERO-QUAY  无名原子庭英雄图

- 文件：`kanshan-quay-hero.png`
- 1920×1080，不透明，海报，无 UI
- 先于其他建筑精修，用来锁体积关系

```
Finished Monument Valley isometric game screenshot, chemistry architecture courtyard called the Nameless Atom Court. Cream plaster plaza #F3DDC0 with no tiles, a thin gold bond path #E7C56A, a hexagonal carbon medallion, a small separate west chapel, a north palace with three distinct arched labs for hydrogen carbon oxygen with keystones H-1, C-6, O-8 and atom orreries inside the niches, an east twin-tower identity gate with sockets 1-6-8, low front parapet, two cypress trees, lagoon and desert mesas beyond, flat pale sun. Tiny human traveler in terracotta cloak in the foreground. White fox mascot Liu Kanshan sitting in the west chapel — two different characters, instantly distinct. Sparse, elegant, long shadows, no clutter, no checkerboard, no gems on the floor, no collage, no HUD, no watermark. Poster quality.
```

中文验收：广场干净；三拱能读出氢碳氧；西礼拜堂与后宫之间能看见天；狐狸和旅人不是同一个角色。

---

## 5. P1 逐条提示词

---

### INT-LECTERN-PERIODIC  周期拼台（22,23）

- 文件：`kanshan-int-lectern-periodic.png`

```
Isometric Monument Valley interactable sprite, transparent background, no ground plane. Wall-hugging lectern in sage plaster #5F9178 with cream slope, an open book and a small set of blank periodic-table tiles (empty rectangles, no element soup). Gold hairline indices. Chest-high, clay-smooth ustwo 3D. Letters none, or only tiny 1 6 8 if needed. No full periodic chart, no monitor, no fox, no watermark.
```

---

### INT-LECTERN-ORBIT  轨道连线读经台（29,17）

- 文件：`kanshan-int-lectern-orbit.png`

```
Isometric Monument Valley interactable sprite, transparent background. Lectern in teal plaster #4F7F96, cream slope, open book, and a miniature architectural nucleus with two torus rings as a study model built into the lectern, not a science-kit toy. Clay-smooth ustwo 3D. No HUD orbits, no glow sticks, no fox, no watermark.
```

---

### INT-GATE-PERIODIC  周期廊门（18,24）

- 文件：`kanshan-int-gate-periodic.png`

```
Isometric Monument Valley gate sprite, transparent background. A modest sage-plaster #5F9178 arch with cream cap, thin gold period/group marks as architecture, walkable opening. Clay-smooth ustwo 3D, not a castle, not a metal turnstile. No text except optional tiny indices, no fox, no watermark.
```

---

### INT-GATE-ELECTRON  电子台门（25,20）

- 文件：`kanshan-int-gate-electron.png`

```
Isometric Monument Valley gate sprite, transparent background. Teal plaster #4F7F96 arch, cream cap, a single thin torus ring motif in the lintel suggesting electron shells. Clay-smooth ustwo 3D. No space-station hatch, no HUD, no fox, no watermark.
```

---

### INT-GATE-FAMILY  温室门（33,17）

- 文件：`kanshan-int-gate-family.png`

```
Isometric Monument Valley gate sprite, transparent background. Coral plaster #C56D62 arch with cream cap, three tiny lantern/leaf marks suggesting alkali, halogen, noble-gas families. Clay-smooth ustwo 3D, greenhouse-adjacent, not a garden trellis. No vegetables, no fox, no watermark.
```

---

### INT-GATE-BOND  键工坊门（37,13）

- 文件：`kanshan-int-gate-bond.png`

```
Isometric Monument Valley gate sprite, transparent background. Ochre plaster #B3875C arch, cream cap, lintel reads as a bond beam between two small atom bosses. Clay-smooth ustwo 3D. No pipes, no anvil, no fox, no watermark.
```

---

### INT-GATE-ISOTOPE  同位素门（40,6）

- 文件：`kanshan-int-gate-isotope.png`

```
Isometric Monument Valley gate sprite, transparent background. Slate-blue plaster #6D829C arch, cream cap, two nearly identical keystone beads, one slightly larger, hinting carbon-12 vs carbon-14. Optional tiny 12 and 14 only. Clay-smooth ustwo 3D. No radiation trefoil, no fox, no watermark.
```

---

### INT-CATEGORY-PERIODIC  周期廊知识碑（20,22）

- 文件：`kanshan-int-category-periodic.png`

```
Isometric Monument Valley wall tablet sprite, transparent background. Sage plaster knowledge tablet attached to a pillar, cream face, gold hairline grid of empty period/group cells, not a full chart, an open field book resting on a tiny shelf. Clearly interactable. Clay-smooth ustwo 3D. No paragraphs, no Chinese, no English sentences, no obelisk in the path center, no fox, no watermark.
```

---

### INT-CATEGORY-ELECTRON  电子台知识碑（27,18）

- 文件：`kanshan-int-category-electron.png`

```
Isometric Monument Valley wall tablet sprite, transparent background. Teal plaster tablet with a nucleus-and-shell relief and a small open book on a shelf. Interactable landmark, clay-smooth ustwo 3D. No HUD, no fox, no watermark.
```

---

### INT-CATEGORY-FAMILY  温室知识碑（34,17）

- 文件：`kanshan-int-category-family.png`

```
Isometric Monument Valley wall tablet sprite, transparent background. Coral plaster tablet with three small reliefs: warm vine, sharp crystal, quiet lantern. Tiny open book on a shelf. Clay-smooth ustwo 3D. No cartoon vegetables, no fox, no watermark.
```

---

### INT-CATEGORY-BOND  键工坊知识碑（38,11）

- 文件：`kanshan-int-category-bond.png`

```
Isometric Monument Valley wall tablet sprite, transparent background. Ochre plaster tablet showing two atom bosses joined by a bond line, open book on a shelf. Clay-smooth ustwo 3D. No pipes, no fox, no watermark.
```

---

### INT-CATEGORY-ISOTOPE  同位素知识碑（41,4）

- 文件：`kanshan-int-category-isotope.png`

```
Isometric Monument Valley wall tablet sprite, transparent background. Slate plaster tablet with two almost identical tower reliefs, one taller, tiny 12 and 14 optional, open book on a shelf. Clay-smooth ustwo 3D. No trefoil, no fox, no watermark.
```

---

### INT-HOOK-NEON  空白 10 号石格（16,14）

- 文件：`kanshan-int-hook-neon.png`

```
Isometric Monument Valley floor monument sprite, transparent background. A blank periodic-table floor tile, sage plaster, incised number 10 only, missing symbol, ashen unawakened look. Monumental but quiet. Clay-smooth ustwo 3D. No letter Ne, no neon sign, no fox, no watermark.
```

---

### INT-HOOK-NOBLE  稀有气体三灯（28,25）

- 文件：`kanshan-int-hook-noble.png`

```
Isometric Monument Valley pavilion prop sprite, transparent background. Three pale gold-white lanterns in a triangle on a teal plaster plinth, empty center, no bond beams on purpose. Quiet noble-gas pavilion, clay-smooth ustwo 3D. Not a light show, no fire, no fox, no watermark.
```

---

### INT-HOOK-WATER  缺键水分子拱（35,22）

- 文件：`kanshan-int-hook-water.png`

```
Isometric Monument Valley architecture-prop sprite, transparent background. Broken water-molecule arch: central oxygen volume, two hydrogen volumes, one covalent bond beam missing. Coral plaster #C56D62, water-cyan accents #75C5D4. Optional tiny H and O only. Clay-smooth ustwo 3D. No splash, no cartoon H2O formula string, no fox, no watermark.
```

---

### INT-HOOK-C14  碳-14 回声（40,10）

- 文件：`kanshan-int-hook-c14.png`

```
Isometric Monument Valley roadside relic sprite, transparent background. Two similar carbon nuclei, one with two extra pale neutron beads, modest ochre-slate, second ring hinted. Optional tiny 12 and 14. Clay-smooth ustwo 3D, not a loud shrine, no radiation icon, no fox, no watermark.
```

---

### ARCH-PERIODIC  周期坐标廊

- 文件：`kanshan-arch-periodic.png` · 2048×2048

```
Isometric Monument Valley architecture cutout, transparent background, no ground, no sky. Sage plaster colonnade #5F9178, cream floor, pillars as a fragment of the periodic table: rows as periods, columns as groups, thin gold indices, walkable aisle. One lectern built into a pillar. Clay-smooth ustwo 3D. No full periodic chart, no element-letter soup, no fox, no watermark.
```

---

### ARCH-ELECTRON  电子观测台

- 文件：`kanshan-arch-electron.png` · 2048×2048

```
Isometric Monument Valley architecture cutout, transparent background. Teal observatory monument #4F7F96, cream floor, large architectural nucleus and two or three torus electron orbits as building rings. Sodium 2-8-1 hinted by bead counts, not by text. Clay-smooth ustwo 3D, calm, not a space station, no HUD, no glow sticks, no fox, no watermark.
```

---

### ARCH-FAMILY  家族温室

- 文件：`kanshan-arch-family.png` · 2048×2048

```
Isometric Monument Valley architecture cutout, transparent background. Three small greenhouse pavilions in coral plaster #C56D62: alkali warm vines, halogen sharp pale crystals, noble-gas quiet gold lanterns. Sparse, architectural, clay-smooth ustwo 3D. Not cartoon vegetables, no labels, no fox, no watermark.
```

---

### ARCH-BOND  键工坊

- 文件：`kanshan-arch-bond.png` · 2048×2048

```
Isometric Monument Valley architecture cutout, transparent background. Ochre workshop #B3875C: two atom pillars and a connecting bond beam. Left slightly metallic donor, right slightly glassy receiver. Default connected state. Clay-smooth ustwo 3D. No pipes, no anvils, no fantasy crystals, no fox, no watermark.
```

---

### ARCH-ISOTOPE  同位素穹室

- 文件：`kanshan-arch-isotope.png` · 2048×2048

```
Isometric Monument Valley architecture cutout, transparent background. Slate-blue vault #6D829C, two nearly identical towers under one pale dome. Shorter carbon-12, taller carbon-14 with two extra neutron beads in the capital. Six proton marks identical on both. Optional tiny 12 / 14 only. Clay-smooth ustwo 3D. No radiation trefoil, no fox, no watermark.
```

---

### ENV-MESA  远景桌山

- 文件：`kanshan-env-mesa.png` · 2048×2048

```
Monument Valley backdrop cutout, transparent background. Four to six stacked cream-and-sage desert mesas, peach sand suggestion, far and quiet, air perspective, clay-smooth ustwo 3D. Backdrop only, not the hero. No city, no collage clouds, no watermark.
```

---

### TEX-SAGE / TEAL / CORAL / OCHRE / SLATE

共用句式，改颜色与文件名。

**TEX-SAGE** `kanshan-tex-sage.png`

```
Seamless 2048x2048 sage plaster albedo, Monument Valley, color #5F9178, almost uniform, subtle trowel, no tiles, no grout, no watermark.
```

**TEX-TEAL** `kanshan-tex-teal.png`

```
Seamless 2048x2048 teal plaster albedo, Monument Valley, color #4F7F96, almost uniform, subtle trowel, no tiles, no grout, no watermark.
```

**TEX-CORAL** `kanshan-tex-coral.png`

```
Seamless 2048x2048 coral plaster albedo, Monument Valley, color #C56D62, almost uniform, subtle trowel, no tiles, no grout, no watermark.
```

**TEX-OCHRE** `kanshan-tex-ochre.png`

```
Seamless 2048x2048 ochre plaster albedo, Monument Valley, color #B3875C, almost uniform, subtle trowel, no tiles, no grout, no watermark.
```

**TEX-SLATE** `kanshan-tex-slate.png`

```
Seamless 2048x2048 slate plaster albedo, Monument Valley, color #6D829C, almost uniform, subtle trowel, no tiles, no grout, no watermark.
```

---

### TEX-WATER  潟湖水面

- 文件：`kanshan-tex-water.png`

```
Seamless 2048x2048 shallow lagoon water albedo, Monument Valley, turquoise-green #4F8F8C, almost still, very low roughness, faint cream reflections, no waves collage, no foam grid, no watermark.
```

---

### TEX-SKY  暖雾天空

- 文件：`kanshan-tex-sky.png`

```
Seamless or latlong 2048x2048 warm dusty sky, Monument Valley, gradient #EAD6B8 to pale #F8D7A0, quiet haze, no cloud collage, no purple-blue neon sky, no sun already painted (sun is a separate sprite), no watermark.
```

---

## 6. P2 逐条提示词

---

### UI-SKILL-ATOMIC  核视

- 文件：`kanshan-ui-skill-atomic.png` · 512×512

```
Minimal Monument Valley UI icon, 512 square, fully transparent background. One gold nucleus sphere and a single electron ring, clay-smooth soft 3D, cream-gold-teal, no text, no circular button chrome, no glow bloom, no watermark.
```

---

### UI-SKILL-PERIODIC  周期

- 文件：`kanshan-ui-skill-periodic.png`

```
Minimal Monument Valley UI icon, transparent background. A 2 by 3 empty cell grid in cream and gold, suggesting a fragment of the periodic table, no letters, no numbers, clay-smooth, no watermark.
```

---

### UI-SKILL-VALENCE  价引

- 文件：`kanshan-ui-skill-valence.png`

```
Minimal Monument Valley UI icon, transparent background. An outer-shell bead being gently drawn along a gold hairline from a teal ring, clay-smooth, no text, no watermark.
```

---

### UI-SKILL-FAMILY  族鸣

- 文件：`kanshan-ui-skill-family.png`

```
Minimal Monument Valley UI icon, transparent background. Three tiny lanterns in a quiet triangle, cream-gold-coral, clay-smooth, no text, no watermark.
```

---

### UI-SKILL-BOND  键织

- 文件：`kanshan-ui-skill-bond.png`

```
Minimal Monument Valley UI icon, transparent background. Two beads joined by a single gold bond line, clay-smooth, no text, no watermark.
```

---

### UI-SKILL-ISOTOPE  同位

- 文件：`kanshan-ui-skill-isotope.png`

```
Minimal Monument Valley UI icon, transparent background. Two almost identical nuclei, one with two extra pale beads, slate-cream-gold, clay-smooth, no radiation symbol, no text, no watermark.
```

---

### UI-PROMPT-E  交互键帽

- 文件：`kanshan-ui-prompt-e.png`

```
Minimal Monument Valley UI keycap, transparent background. A small cream stone keycap with a gold letter E only, terracotta sides, clay-smooth ustwo 3D, no keyboard, no WASD set, no watermark. Letter E is required.
```

---

### UI-BOOK-ICON  手册小图标

- 文件：`kanshan-ui-book-icon.png`

```
Minimal Monument Valley UI icon, transparent background. Tiny open field book, terracotta cover, cream pages, gold hexagon inlay, matches the world book prop, clay-smooth, no title text, no watermark.
```

---

### UI-BRAND-MARK  登录品牌标

- 文件：`kanshan-ui-brand-mark.png`

```
Minimal Monument Valley brand mark, transparent background. A cream-terracotta flask silhouette fused with a gold carbon hexagon, clay-smooth, no letters, no Zhihu logo copy, no fox, no watermark.
```

---

### LOGIN-HERO  登录英雄背景

- 文件：`kanshan-login-hero.png` · 1920×1080

```
Monument Valley isometric login background, 1920x1080, no UI, no buttons, no text. Nameless Atom Court from a slightly closer southeast view than the poster: cream plaza, thin gold path, three H C O arches, west chapel, east gate, lagoon edge. Tiny terracotta-cloak traveler in the lower third. Liu Kanshan sitting in the west chapel, clearly a different character. Soft afternoon, long shadows, finished game art. No checkerboard, no gems, no watermark.
```

---

### LOADING-ORRERY  加载仪轨

- 文件：`kanshan-loading-orrery.png` · 1024×1024 透明

```
Monument Valley loading emblem, transparent background. A quiet carbon orrery: teal nucleus, two rings, gold hexagon plate, clay-smooth, centered, no text, no spinner chrome, no watermark.
```

---

### VFX-NICHE-LIT  壁龛检视光

- 文件：`kanshan-vfx-niche-lit.png`

```
Subtle Monument Valley VFX sprite, transparent background. Soft dust light in an arch, warm gold to teal, no sparks, no lens flare, no manga speed lines, no text, no watermark. Usable as an additive overlay.
```

---

### VFX-RIFT  裂隙脉冲

- 文件：`kanshan-vfx-rift.png`

```
Subtle Monument Valley VFX sprite, transparent background. A thin cyan ring, almost flush, soft pulse, no portal tunnel, no runes, no watermark.
```

---

### VFX-UNLOCK  技能解锁环

- 文件：`kanshan-vfx-unlock.png`

```
Subtle Monument Valley VFX sprite, transparent background. One quiet valence ring expanding from a point, gold-teal,  single frame of an 8-frame idea, no fireworks, no particles storm, no watermark.
```

---

## 7. 交件检查

绘画 Agent 交图前自检：

1. 文件名与本包完全一致，PNG，P0 角色/道具是透明底。
2. 主角不是狐狸：没有白豆身、大黑鼻、尖耳、圆白尾。
3. 刘看山坐姿必须能和 `idle.png` 认成同一只。
4. 打开的书是交互英雄道具，能在 13,25 当「按 E」目标。
5. 氢碳氧仪轨能从结构读出 H-1、C-6、O-8。
6. 没有棋盘地、宝石堆、中文句子、水印、赛博霓虹。
7. 建筑剪影没有地面和天空，方便叠到现有岛上。

收到 P0 图后，再把精灵接到 `apps/web/public/assets/art/`，由程序侧替换隐形点击板。
