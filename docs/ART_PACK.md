# 《看山异闻录 · 周期庭院》美术圣经与逐资产提示词

版本：1.1 · 给专业美工团队直接开工  
**本轮绘画 Agent 请用 [`art-pack/PAINTING_PROMPTS.md`](art-pack/PAINTING_PROMPTS.md)**，逐条 PNG 提示词与落地文件名都在那里。3D/GLB 规格仍以本文为准。  
游戏：网页端知识冒险 RPG · 化学主题 · 优先电脑浏览器  
风格锚点：Monument Valley（ustwo）+ 化学作为建筑语言  
官方角色：刘看山（NPC 向导，不是主角）

---

## 0. 开工前必须记住

1. **主角不是刘看山。** 玩家是独立的微型旅人。禁止白身、黑鼻、黑肢、圆白尾、尖耳白狐剪影。两人同框必须 0.5 秒内分清。
2. **化学长在建筑上。** H / C / O、原子序数 1 / 6 / 8、电子环、价键路径、碳六边形、族温室，都是纪念碑结构，不是地面贴纸、HUD 图标或广场小玩具。
3. **一个英雄镜头必须完整。** 无名原子庭（码头庭院 quay）是成品海报。其余台地可以简化，但不能做成空盒子。
4. **不要参考当前游戏截图当正稿。** 现网模型是占位：棋盘地、整面连体宫墙、粗金条路径、广场散落宝石、两个一样的白狐狸，全部作废。
5. **地图格子不可改。** 美工只换衣服，不改坐标。玩法格子写在第 3 节。

刘看山官方参考在：

- `docs/art-pack/references/liu-kanshan/liu-orthographic-front-side-back.jpg`
- `docs/art-pack/references/liu-kanshan/liu-hero-white.jpg`
- `docs/art-pack/references/liu-kanshan/idle.png` / `greet.png` / `computer.png`
- 现成动画：`apps/web/public/assets/liu-kanshan/*.gif`（320×320）

---

## 1. 风格宪法

### 1.1 画面目标

等距正交纪念碑。奶油石、赤陶墙、细金嵌线、长而软的阴影。建筑像被一把布尔运算刀切出来：拱、壁龛、柱、台、桥，边角干净。人物极小，建筑极大。空气是午后沙漠，远处有层叠桌山和一轮扁平日盘。

一眼必须读出：**这是一座按元素规律生长的庭院**，不是实验室 HUD，也不是魔法宝石广场。

### 1.2 构图法则

- 每座台地只有 **一个主纪念碑 + 一条路径 + 最多两棵树 / 三个花盆**。
- 广场留白是设计，不是没做完。道具必须嵌进墙体、壁龛、门槛，禁止在空地中央堆物件。
- 建筑体量要分开：西礼拜堂、后宫三拱、东门楼是三个独立体积，中间必须有天空缝。禁止一条墙横贯全宽。
- 路径是 **细金嵌线**（约 8–12cm 视觉宽度），不是粗金砖地毯。
- 地面是均匀灰泥，允许极弱的手工抹痕，**禁止棋盘格、马赛克重复、地砖缝网**。

### 1.3 化学可读性

| 知识 | 建筑读法 |
|---|---|
| 质子数决定元素 | 壁龛拱心石刻 1 / 6 / 8，门楼三槽对应氢碳氧 |
| 氢 | 单核 + 单环，金色 |
| 碳 | 六边形地面徽章 + 四价短柱，核内 6 点，双层电子环，青绿 |
| 氧 | 核内 8 点，双层环，偏青的水色 |
| 周期 / 族 | 廊柱按横周期、纵族排列 |
| 电子层 | 观测台中央核 + 两到三圈轨道环 |
| 元素家族 | 三座温室：碱金属 / 卤素 / 稀有气体 |
| 化学键 | 两座原子柱 + 中间键梁 |
| 同位素 | 两座几乎相同的塔，高度/质量略不同，共顶一穹 |

场景中允许的文字只有：`H` `C` `O` 和数字 `1` `6` `8`。禁止中文、英文句子、水印、Logo、元素周期表整表。

### 1.4 调色板（锁定）

无名原子庭：

- 奶油地面 `#F3DDC0`
- 赤陶墙 `#C47B58` / `#B56B4E`
- 唇线 / 压顶 `#8E5340`
- 金嵌线 `#E7C56A`
- 阴影暖褐 `#5A332C`
- 氢金 `#E6BD55`
- 碳青 `#68B8AC`
- 氧水色 `#75C5D4`

后续台地只换墙体色相，不换造型语言：

- 周期廊 sage `#5F9178` / 地 `#DBE7D6`
- 电子台 teal `#4F7F96` / 地 `#D5E5EC`
- 家族温室 coral `#C56D62` / 地 `#F1D4C8`
- 键工坊 ochre `#B3875C` / 地 `#EEE0C8`
- 同位素穹 slate `#6D829C` / 地 `#E2E7EE`

天空与远景：`#EAD6B8` → `#F8D7A0` 日盘，雾色 `#E7D3B4`。禁止紫蓝渐变天空、霓虹赛博、全绿化学课堂。

### 1.5 光影

正交相机，方向光从画面左上偏后打下，长阴影。软 ACES，平涂到软边，几乎无 PBR 噪点、无清晰反射、无 SSAO 脏痕。金属只出现在金嵌线和仪轨，粗糙度中高，微弱自发光（emissive 0.12–0.35）。

### 1.6 绝对禁止

- 棋盘格地面、重复地砖缝、马赛克拼贴
- 粗金羊毛路径、Minecraft 方块感
- 广场中央散落水晶、宝石、灯、讲台、原子玩具
- 宫墙与礼拜堂连成一整面
- 主角与刘看山同模或同色剪影
- 照片级皮肤、毛发、布料扫描
- UI 文字烤进贴图
- 拼贴感：不同风格资产硬切到一起
- 暗黑实验室、蒸汽朋克管道堆、卡通泡泡字体

---

## 2. 技术规格

### 2.1 相机（按此画概念和渲染）

- 正交等距，偏 Monument Valley，不是严格 30° 军棋。
- 引擎相机相对焦点：`(+9.2, +11.0, +11.4)`，略低头看 `+0.8, +0.82, +0.7`。
- 角色精灵面朝相机，轴心在脚底。不要把阴影画进精灵。
- 网格：世界 `x = (gx - gy) * 1.0`，`z = (gx + gy) * 0.82`。一格地面约 1.0 × 0.82 世界单位。

### 2.2 交付格式

| 类型 | 格式 | 规格 |
|---|---|---|
| 建筑纪念碑 | GLB + 概念正交图 | 轴心在地面中心，Y-up，单位米，1 格 ≈ 1m |
| 角色 / 刘看山新姿势 | 透明 PNG 序列或 GIF | 320×320 或 1024×1024，脚底居中偏下 |
| 贴图 | PNG 2K | 可平铺的只平铺灰泥；金嵌线用独立条带，不靠 repeat 出格 |
| VFX | PNG 序列或透明平面 | 不带黑底，不带文字 |
| UI | SVG 或 2x PNG | 深青绿半透明面板，金色描边 |

命名：`kanshan_<id>_<variant>.<ext>`，全小写、短横线。例：`kanshan-quay-palace-h-lit.glb`。

### 2.3 引擎约束

- 不要把投影阴影烘焙进贴图，引擎已有方向光阴影。
- 壁龛内部可以有微弱自发光，但不要bloom到整座宫。
- 可走格子必须留空：角色碰撞是整格。壁龛仪轨放在 **墙体一侧 / 格子后沿**，不要占走格子中心。
- 刘看山占格 `{4,25}`，氢碳氧线索占 `{8,24}{11,24}{14,24}`，这些格玩家不能站上去。

---

## 3. 锁定布局（美工不可改坐标）

无名原子庭 quay `{x0:3,y0:23,x1:16,y1:31, 高度 1.05}`

| 功能 | 格子 | 美术对应 |
|---|---|---|
| 玩家出生 | 5,28 | 键径起点，面向北宫 |
| 刘看山 | 4,25 | 西侧独立小礼拜堂内坐着 |
| 每日裂隙 | 13,28 | 嵌在东前方地面的细环，不要立碑 |
| 氢壁龛 | 8,24 | 后宫左拱，拱心石 1 / H |
| 碳壁龛 | 11,24 | 后宫中拱，拱心石 6 / C |
| 氧壁龛 | 14,24 | 后宫右拱，拱心石 8 / O |
| 碳论坛徽章 | 10,26 | 地面六边形金嵌，不是台子 |
| 身份门 | 15,25 | 东门楼通道，三槽 1-6-8 |
| 符号记忆台 | 13,25 | 贴墙小读经台，不要立在路中间 |

其余台地：

| 台地 | 范围 | 高度 | 主纪念碑 | 交互格 |
|---|---|---|---|---|
| 周期廊 periodic | 17,20–23,25 | 1.92 | 周期/族列柱 | 知识 20,22 · 门 18,24 · 拼台 22,23 |
| 电子台 electron | 24,16–30,22 | 2.78 | 核 + 轨道环厅 | 27,18 · 25,20 · 连线 29,17 |
| 家族温室 family | 32,15–36,20 | 3.58 | 三座温室 | 34,17 · 33,17 |
| 键工坊 bond | 35,9–41,14 | 4.48 | 双柱 + 键梁 | 38,11 · 37,13 |
| 同位素穹 isotope | 38,2–43,7 | 5.72 | 双塔共穹 | 41,4 · 40,6 |
| 霓虹隐格 neon | 14,12–18,15 | 1.92 | 空白 10 号石格 | 16,14 |
| 稀有气体亭 noble | 26,24–30,27 | 2.78 | 三盏静灯亭 | 28,25 |
| 水分子拱 water | 33,21–37,24 | 3.58 | 缺键 H-O-H 拱 | 35,22 |
| 碳-14 回声 | 桥边 40,10 | — | 两声余韵装置 | 40,10 |

主桥：quay→periodic→electron→family→bond→isotope。侧桥通往 neon / noble / water。

---

## 4. 全局提示词前缀（每条资产都先贴这段）

中文：

> 纪念碑谷（Monument Valley）式等距正交建筑插画，布尔运算般干净的几何体，奶油石灰泥与赤陶墙，细金嵌线，长而柔软的午后阴影，空气透视，人物极小建筑极大。化学主题必须能从建筑结构直接读出，不是贴纸。禁止棋盘格地面、拼贴、像素方块、宝石堆、照片级材质、水印、中文句子、UI 文字。只有必要时出现字母 H/C/O 或数字 1/6/8。成品游戏美术，不是概念草图。

English:

> Monument Valley isometric architecture, clean boolean volumes, cream plaster and terracotta, thin gold inlay, long soft afternoon shadows, tiny characters vs monumental buildings. Chemistry is readable from the architecture itself. No checkerboard floors, no collage, no Minecraft blocks, no gem clutter, no photoreal materials, no watermark, no UI text. Letters only H/C/O and digits 1/6/8 when required. Finished game art.

---

## 5. 角色

### CHR-PLAYER-IDLE  主角站立 · 新设计

- 类型：角色精灵
- 用途：玩家角色，出生格 5,28，全程跟随
- 规格：透明 PNG 320² 与 1024²；脚底轴心；无投影；4–6 帧呼吸
- 体型：站立高度约 0.9–1.1 格，远小于门拱
- 必须：和刘看山完全不同的剪影

**形象锁定（请按此设计，不要改成狐狸）：**

小型人形旅人，头身比约 1:2。深暖赤陶短袍 `#B56B4E`，奶油内衬 `#F3DDC0`，青石腰带，斜挎一只小黄铜透镜盒（原子视野的视觉种子）。短发或软帽，肤色偏暖，四肢是布料和皮革而不是纯黑棒状肢。侧影是斗篷三角形，不是圆耳朵白豆。

**提示词：**

```
Monument Valley isometric game character sprite, tiny human explorer, not an animal, not a fox, not Liu Kanshan. Stylized low-poly-smooth clay look, cream and terracotta travel cloak, brass pocket lens case on a strap, short warm-toned hair, simple rounded shoes. Standing idle, facing 3/4 toward an isometric camera, full body, feet planted, small scale as if standing in a giant plaza. Clean vector-like 3D, soft lighting, no outline, no facial pores, no fur. Transparent background. Do not copy the official white fox mascot. No black stick limbs, no giant black nose, no pointed white ears.
中文补充：微型人形旅人，赤陶斗篷，黄铜透镜盒，纪念碑谷比例，透明背景，禁止白狐吉祥物特征。
```

变体：`walk` 四向或至少东南向走循环 6–8 帧；`interact` 伸手触拱心石 4 帧。

### CHR-LIU-SIT  刘看山坐在西礼拜堂 · 新绘制

- 类型：角色精灵
- 用途：格子 4,25，嵌在西侧独立壁龛座垫上
- 规格：320² / 1024² 透明 PNG，可加 6 帧轻微呼吸
- 必须 1:1 匹配官方吉祥物，不得重设计

官方特征：纯白圆润躯干，尖耳，巨大圆形黑鼻，细小黑点眼睛（单侧可见一颗），纯黑细臂细腿，圆白尾。哑光搪胶，不是毛绒。

**提示词：**

```
Official Zhihu mascot Liu Kanshan sitting inside a small terracotta chapel alcove, exact character design: smooth matte white bean-shaped body, pointed white ears, huge round black nose, tiny black dot eye, thin black arms and legs, round white tail. Sitting on a cream cushion, 3/4 isometric view matching Monument Valley camera, paws resting, calm waiting pose, breathing idle. Transparent background, no environment except a hint of cushion. Do not redesign. Do not add clothes, glasses, or color. Match the provided orthographic turnaround exactly.
中文补充：严格按刘看山官方三视图，坐在西侧小礼拜堂垫子上，等距四分之三侧面，透明背景，不要改设计。
```

### CHR-LIU-*  已有资产，不要重画

直接使用 `idle` `greet` `wander` `sleep` `ball` `computer`。若要统一等距相机，只能做 **轻微透视校正**，不得改变形体。对话时切 `greet`，礼拜堂默认用坐姿。

---

## 6. 无名原子庭（英雄场景，必须完整）

这一节是海报。交付时要能单独出一张无 UI 的英雄渲染：从东南看完整庭院，前缘能看见一点潟湖。

### ARCH-QUAY-PLAZA  奶油广场

- 类型：建筑地面
- 范围：3–16 × 23–31 的内走区，不含边墙格
- 规格：GLB 地面板 + 2K 灰泥 albedo/roughness

**提示词：**

```
Monument Valley courtyard floor, one continuous cream plaster surface #F3DDC0, hand-troweled but nearly uniform, warm terracotta lip #8E5340 around the island edge, no tiles, no grout, no checkerboard, no mosaic, no cracks grid. Isometric orthographic, long shadows, empty elegant plaza ready for a thin gold path and one hexagonal medallion. Finished 3D game asset.
中文补充：整块奶油灰泥广场，只有一圈赤陶压边，严禁棋盘格和地砖缝。
```

### ARCH-QUAY-BOND-PATH  价键细径

- 类型：嵌地金线
- 路线：5,28 出生 → 西折到刘看山 4,25 → 再折向 10,26 碳徽章 → 沿 8/11/14,24 三拱前沿 → 东至 15,25 门楼
- 规格：独立 mesh，宽度约 0.12–0.18 世界单位，略高于地面 2–3cm

**提示词：**

```
Thin gold chemical-bond inlay path set flush into cream plaster, width of a finger, not a road. Smooth rounded corners at turns, Monument Valley elegance, color #E7C56A, slight warmth, no glow bloom, no chunky gold bricks, no arrows, no runes. It should read as a covalent bond drawn across a courtyard.
中文补充：像画在院子里的一根化学键，细金嵌线，不是金砖大道。
```

### ARCH-QUAY-MEDALLION  碳六边形徽章

- 类型：地面镶嵌
- 格子：10,26
- 规格：嵌平，不挡走；六边形 + 中心四条短价键

**提示词：**

```
Floor medallion at courtyard center: a regular hexagon gold inlay for carbon, four short valence marks at 90-degree-like tetrahedral hints simplified to isometric graphic, cream plaster inside, no raised dais, no crystal. Readable as carbon's hexagon and four bonds from a distance. Monument Valley, terracotta-cream-gold.
中文补充：地面六边形碳徽章，四条价键短线，嵌平，不要台子。
```

### ARCH-QUAY-CHAPEL  西侧刘看山礼拜堂

- 类型：独立建筑
- 位置：西墙外凸，开口朝向 4,25；与后宫之间必须露出天空缝
- 规格：独立 GLB，不要和宫墙布尔成一块

**提示词：**

```
Small west-side chapel volume, separate from the back palace, terracotta plaster cube with a single arched alcove facing the courtyard, cream cushion inside, modest cream cornice, human scale tiny relative to the palace. A visible gap of sky between chapel and palace. Monument Valley, no doors that clip characters, no interior furniture except the seat. The fox mascot will be composited later; model the empty seat.
中文补充：西侧独立小礼拜堂，一座小体积，开口朝院子，里面只有坐垫。必须和后宫断开，中间能看见天。
```

### ARCH-QUAY-PALACE  后宫三拱实验室

- 类型：主纪念碑
- 位置：北侧 y=23 墙，**不要拉满 3–16 全宽**；建议主体约 x=7 到 x=15，左右留柱墩和天空
- 规格：三个完全可辨的拱形实验室，拱之间有壁柱

**提示词：**

```
Monument Valley back palace on the north edge of a cream courtyard: three distinct arched laboratories side by side, not one long garage. Terracotta plaster walls, cream pilasters between arches, carved keystones. Left arch hydrogen gold, middle carbon teal, right oxygen cyan. Each arch is a deep niche, large enough to hold an atom orrery inside, not a sticker on the plaza. Roof is stepped cream slabs, modest, no giant dome. Separate from the west chapel. Isometric, long shadows, finished game monument.
中文补充：北侧后宫必须是三座能分开的拱门实验室，氢金、碳青、氧水蓝，壁柱隔开，不要连成一个大车库。
```

### ARCH-QUAY-NICHE-H / C / O  三座元素壁龛（可与宫殿分件或同文件子网格）

共同规格：仪轨在龛内深处，不侵入 8/11/14,24 的走格中心。拱心石刻对应字母与原子序数。

**氢 H-1 提示词：**

```
Architectural niche orrery of hydrogen: one gold proton sphere as nucleus, one single electron ring, keystone carved "H" and "1", terracotta and cream surround, Monument Valley scale, large like a chapel relic not a toy. Dim unlit variant and warm gold lit variant. No text except H and 1.
```

**碳 C-6 提示词：**

```
Architectural niche orrery of carbon: teal nucleus with six proton beads, two electron shells, four valence marks on the inner ring, keystone "C" and "6", hexagonal motif in the niche floor. Monument Valley, large relic inside the middle arch. Dim and lit variants. No text except C and 6.
```

**氧 O-8 提示词：**

```
Architectural niche orrery of oxygen: cyan-water nucleus with eight proton beads, two electron shells, keystone "O" and "8", cooler light than hydrogen. Monument Valley, right-hand arch relic. Dim and lit variants. No text except O and 8.
```

未检视 = 龛内冷阴影、仪轨低亮；检视后 = 拱心石与环轻微自发光，颜色符合元素，不闪霓虹。

### ARCH-QUAY-GATEHOUSE  东身份门楼

- 位置：东缘 x=16，通道对准 15,25
- 规格：双塔 + 过梁，过梁下三个圆形槽：1 / 6 / 8

**提示词：**

```
East identity gatehouse, twin terracotta towers with cream caps, a lintel spanning a walkable arch. Three circular sockets in the lintel labeled 1, 6, 8 in tiny incised numerals, gold / teal / cyan when filled, stone-dark when empty. Monument Valley, elegant, not a castle portcullis, not a sci-fi scanner. Player walks through after sockets light.
中文补充：东侧双塔门楼，梁上三孔 1、6、8，点亮后才能读成氢碳氧身份之门。
```

变体：三槽全灭、只亮 1、亮 1+6、全亮开门。

### ARCH-QUAY-PARAPET  前缘低矮女墙

南缘 y=31，高度只到角色胸口，留出主桥缺口。2–3 个赤陶花盆 + 柏树，不要一排十棵。

**提示词：**

```
Low terracotta parapet on the front edge of an isometric courtyard, chest-high, cream coping, two or three cypress trees in pots, Monument Valley sparse landscaping, gap for a stair bridge on the east-south. No iron fence, no banners.
```

### ENV-LAGOON / ENV-MESA / ENV-SUN / ENV-SKY  英雄镜头环境

前缘浅潟湖接沙漠，远景 4–6 座分层桌山，扁平日盘，暖雾天空。庭院仍是主体，环境只做明信片衬底。

**提示词（可一张环境板）：**

```
Monument Valley postcard backdrop behind a terracotta courtyard: shallow turquoise-green lagoon hugging the front edge, peach desert, stacked mesa buttes in cream and sage, a flat pale sun disc, warm dusty sky #EAD6B8. No clouds collage, no lens flare, no city. The courtyard architecture remains the hero, backdrop is quiet.
```

### ENV-CYPRESS  柏树

6 边锥叠成的纪念碑谷柏树，叶色 `#DDE8D0` / 枯色 `#E8D7B6`，树干奶油。用于前缘和远景，每座台地最多两棵。

---

## 7. 其余台地纪念碑

造型语言与庭院相同：赤陶体系换色相，一个主结构，禁止空盒子和广场堆物。

### ARCH-PERIODIC  周期坐标廊

sage 绿柱廊。横排暗示周期（电子层数），纵列暗示族（价电子）。知识台 20,22 是廊中一块坐标石，不是电脑。

```
Isometric colonnade monument in sage plaster #5F9178, cream floor #DBE7D6, pillars arranged like a fragment of the periodic table: rows as periods, columns as groups. Thin gold indices, no full periodic table chart, no element letter soup. Monument Valley, walkable aisle down the middle. One stone lectern built into a pillar.
中文补充：周期廊是建筑化的周期表片段，横周期纵族，不要把整张表贴墙上。
```

### ARCH-ELECTRON  电子观测台

teal 圆厅。中央核，两到三圈可走外观的轨道环（视觉环，实际碰撞仍在地面）。

```
Teal observatory monument, cream floor, a large architectural nucleus in the center and two or three torus electron orbits as building rings, Monument Valley, calm, not a space station. Sodium 2-8-1 can be hinted by bead counts on rings. No HUD, no glow sticks.
```

### ARCH-FAMILY  家族温室

三座相连但可辨的温室：左碱金属暖珊瑚、中卤素冷珊瑚、右稀有气体静金。

```
Three small greenhouse pavilions in coral plaster, Monument Valley, alkali / halogen / noble-gas families readable by plant color and lamp temperament: reactive warm vines, sharp pale crystals, quiet gold lanterns. Not cartoon vegetables. Sparse, architectural.
```

### ARCH-BOND  键工坊

两座原子柱 + 一条横梁。梁可以有「断开 / 接上」两态。

```
Ochre workshop monument: two atom pillars and a connecting bond beam, Monument Valley. Left pillar slightly metallic (electron donor), right pillar slightly glassy (electron receiver). Connected variant and broken variant. No pipes, no anvils, no fantasy crystals.
```

### ARCH-ISOTOPE  同位素穹室

两座几乎相同的塔，一座略矮/略轻为碳-12，一座略高为碳-14，共顶半透明冷色穹。

```
Slate-blue vault, two nearly identical towers under one pale dome, Monument Valley. Same silhouette, different mass: one slightly shorter (carbon-12), one slightly taller with two extra neutron beads in the capital (carbon-14). Six proton marks identical on both. No numbers except optional tiny 12 / 14.
```

### ARCH-NEON  空白 10 号石格

sage 侧台，一块被擦掉符号的石板，只留原子序数 10。未发现时像缺陷，发现后浮现 Ne 的冷青光（仍不要写 Neon 单词）。

```
A single blank periodic-table floor tile monument, incised number 10, missing symbol, Monument Valley sage plaster. Unawakened: ashen. Awakened: quiet neon-gas glow forming the idea of Ne without lettering the name.
```

### ARCH-NOBLE  稀有气体亭

三盏灯：氦、氖、氩。安静，不成键，亭中空。

```
Quiet noble-gas pavilion, three lanterns in a triangle, teal plaster, Monument Valley. The architecture refuses to connect: no bond beams, empty center. Lanterns pale gold-white. Calm, not a party light show.
```

### ARCH-WATER  水分子拱

氧在中央，两侧氢，缺一条共价键。修复态投下浅虹影。

```
Broken water-molecule arch: central oxygen volume, two hydrogen volumes, one covalent bond beam missing. Coral plaster with water-cyan accents, Monument Valley. Repaired variant completes the bent H-O-H and casts a faint prismatic shadow. No cartoon H2O letters besides optional tiny H / O.
```

### ARCH-C14-ECHO  碳-14 回声装置

主桥旁小型双塔残响，不要另建一座岛。

```
Small roadside echo relic: two similar carbon nuclei, one with two extra pale beads, a delay in the second ring's glow. Monument Valley, modest scale, ochre-slate. Not a loud shrine.
```

### ARCH-BRIDGE  阶梯键桥

主桥宽、侧桥窄。石阶奶油，中央一根细金嵌线，低栏杆。禁止巨大拱桥。

```
Isometric stair bridge between floating terraces, cream stone steps, thin gold bond inlay down the center, low terracotta rails, Monument Valley. Main and side width variants. No ropes, no chains.
```

---

## 8. 交互物（全部嵌进建筑）

禁止做成地面掉落物。

| ID | 格子 | 做法 |
|---|---|---|
| PROP-FORUM-DAIS | 10,26 | 就是地面徽章本身，完成态金线更亮 |
| PROP-GATE-SOCKETS | 15,25 | 门楼梁上三孔，见东门楼变体 |
| PROP-LECTERN | 13,25 / 22,23 / 29,17 | 贴墙读经台，斜面板，无屏幕 |
| PROP-RIFT | 13,28 | 地面细环，今日裂隙，水色脉冲 |
| PROP-TABLET | 各知识格邻墙 | 墙板，不是方尖碑 |
| PROP-HOOK-* | 隐格 / 亭 / 拱 / 回声 | 用对应纪念碑的未完成态，不要额外宝箱 |

**讲台提示词：**

```
Wall-attached isometric lectern in cream stone with a thin gold reading slope, Monument Valley, no monitor, no keyboard, no floating book. Chest-high, does not block the path center.
```

**每日裂隙提示词：**

```
A thin cyan ring inlaid in cream plaster floor, almost flush, slow pulse, Monument Valley. Reads as a daily rift, not a portal door, not a crystal.
```

---

## 9. 贴图

全部手绘灰泥，2K，可轻微抹痕，**repeat 必须看不出格子**。金嵌线不要做在可平铺地砖里，做独立条带或蒙版。

| ID | 颜色 | 用途 |
|---|---|---|
| TEX-PLASTER-CREAM | `#F3DDC0` | 庭院地面 |
| TEX-PLASTER-TERRACOTTA | `#C47B58`–`#B56B4E` | 庭院墙 |
| TEX-LIP | `#8E5340` | 压顶 |
| TEX-GOLD-INLAY | `#E7C56A` | 键径、徽章 |
| TEX-SAGE / TEAL / CORAL / OCHRE / SLATE | 见第 1.4 | 各台地墙与地 |
| TEX-WATER | `#4F8F8C` | 潟湖，低粗糙度 |
| TEX-SKY | `#EAD6B8`–`#F8D7A0` | 天空穹，禁止云拼贴 |

**灰泥提示词：**

```
Seamless cream plaster albedo, Monument Valley, almost uniform, very subtle trowel variation, no tiles, no grout, no stains grid, 2048, PBR roughness high, no normal-map noise.
```

**金嵌线提示词：**

```
Thin gold inlay trim texture, warm #E7C56A, soft metal, not chrome, not jewelry glitter, usable as a strip, 2048, transparent edges optional.
```

---

## 10. VFX

克制。化学发光像温石，不像技能特效包。

| ID | 何时 | 提示词要点 |
|---|---|---|
| VFX-NICHE-LIT | 检视 H/C/O 后 | 龛内尘金 / 青 / 水色呼吸，不溢出拱外 |
| VFX-SOCKET-LOCK | 门楼 1/6/8 | 槽内点亮，全亮后梁下一道淡影 |
| VFX-RIFT-PULSE | 每日裂隙 | 细环缓慢扩张 2 秒循环 |
| VFX-SKILL-UNLOCK | 获得技能 | 对应色的一圈价电子环从角色脚下散开，8 帧，不放烟花 |

```
Subtle Monument Valley game VFX, soft dust light in an arch, no sparks, no lens flare, no manga speed lines, transparent PNG sequence.
```

---

## 11. UI 铬件（次要，不要压过纪念碑）

深青绿半透明 `#0D2022`，金描边 `#EFC55F`，圆角 ≤ 8px。面板贴在屏幕边，不要卡片套卡片。图标用化学结构，不用刀剑。

| ID | 内容 |
|---|---|
| UI-SKILL-ATOMIC | 单核 + 一环，金 |
| UI-SKILL-PERIODIC | 2×3 空格阵 |
| UI-SKILL-VALENCE | 最外层一颗珠被牵引 |
| UI-SKILL-FAMILY | 三盏小灯 |
| UI-SKILL-BOND | 双珠连线 |
| UI-SKILL-ISOTOPE | 双核微差 |
| UI-PROMPT-E | 小键帽 E，靠近才出现 |
| UI-PANEL | 对话 / 知识卡 / 谜题，半透明， fort 庭院仍可见 |

```
Minimal Monument Valley UI icon, flat-soft 3D, chemistry motif, cream-gold-teal, no text, 256 PNG and SVG, transparent.
```

---

## 12. 英雄镜头验收（无名原子庭）

美工自检，全部为是才能交：

1. 地面是整块奶油灰泥，不是棋盘。
2. 金径是细线，不是粗砖。
3. 西礼拜堂与后宫之间能看见天。
4. 后宫是三座分开的拱，能读出 H-1、C-6、O-8。
5. 仪轨在龛里，广场空、干净。
6. 东门是双塔 + 三槽，不是一堵墙挖洞。
7. 刘看山坐在西龛，主角是另一套人形旅人。
8. 前缘有潟湖和 2–3 棵柏，远景桌山，庭院仍是主体。
9. 没有宝石、讲台、原子玩具躺在路中间。
10. 一张无 UI 截图可以当海报。

---

## 13. 制作顺序建议

1. 庭院灰泥 + 键径 + 碳徽章（先把地面做对）
2. 西礼拜堂、后宫三拱、东门楼（三个体积分开）
3. 龛内氢碳氧仪 + 亮灭
4. 主角精灵 + 刘看山坐姿
5. 潟湖 / 桌山 / 日盘 / 柏树
6. 周期廊、电子台、温室、键梁、同位素穹
7. 隐格、气体亭、水拱、碳-14
8. 讲台、裂隙环、技能图标、VFX

概念阶段请先出 **无名原子庭正交英雄图** 和 **当前错误截图的 paintover**，确认体积关系再高模。

---

## 14. 给概念画家的总提示词（仅用于英雄图，不替代分资产）

```
Finished Monument Valley isometric game screenshot, chemistry architecture courtyard called the Nameless Atom Court. Cream plaster plaza with no tiles, a thin gold bond path, a hexagonal carbon medallion, a small separate west chapel, a north palace with three distinct arched labs for hydrogen carbon oxygen (keystones H-1, C-6, O-8) with atom orreries inside the niches, an east twin-tower identity gate with sockets 1-6-8, low front parapet, two cypress trees, lagoon and desert mesas beyond, flat sun. Tiny human traveler in terracotta cloak in the foreground, white fox mascot Liu Kanshan sitting in the west chapel — two different characters. Sparse, elegant, long shadows, no clutter, no checkerboard, no gems on the floor, no collage, no watermark. Poster-quality.
中文：纪念碑谷成品截图，无名原子庭，三拱氢碳氧实验室，细金键径，西侧独立礼拜堂坐着白狐刘看山，前景是赤陶斗篷的微型人形主角，两人不是同一角色。广场干净，化学全靠建筑阅读。
```
