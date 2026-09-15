# 逐资产可复制提示词

每条都是完整提示词。先贴「全局前缀」，再贴该资产正文。  
更完整的规格、坐标、验收见 `docs/ART_PACK.md`。

---

## 全局前缀（每条都用）

```
纪念碑谷（Monument Valley）式等距正交建筑插画，布尔运算般干净的几何体，奶油石灰泥与赤陶墙，细金嵌线，长而柔软的午后阴影，空气透视，人物极小建筑极大。化学主题必须能从建筑结构直接读出，不是贴纸。禁止棋盘格地面、拼贴、像素方块、宝石堆、照片级材质、水印、中文句子、UI 文字。只有必要时出现字母 H/C/O 或数字 1/6/8。成品游戏美术，不是概念草图。
Monument Valley isometric architecture, clean boolean volumes, cream plaster and terracotta, thin gold inlay, long soft afternoon shadows, tiny characters vs monumental buildings. Chemistry is readable from the architecture itself. No checkerboard floors, no collage, no Minecraft blocks, no gem clutter, no photoreal materials, no watermark, no UI text. Letters only H/C/O and digits 1/6/8 when required. Finished game art.
```

---

## 角色

### CHR-PLAYER-IDLE  主角站立（不是刘看山）

```
Monument Valley isometric game character sprite, tiny human explorer, not an animal, not a fox, not Liu Kanshan. Stylized smooth clay 3D, terracotta travel cloak #B56B4E, cream lining #F3DDC0, teal-stone belt, a small brass pocket lens case on a strap, short warm-toned hair, rounded leather shoes. Standing idle, 3/4 facing an isometric camera, full body, feet planted, height of a pawn in a giant plaza. Soft lighting, no outline, no pores, no fur. Transparent background. Do not copy the official white fox mascot. No black stick limbs, no giant black nose, no pointed white ears, no round white tail.
中文：微型人形旅人，赤陶斗篷，黄铜透镜盒，纪念碑谷比例，透明背景。主角不是刘看山，禁止白狐吉祥物任何特征。
```

### CHR-PLAYER-WALK  主角行走

```
Same tiny terracotta-cloak human explorer walking southeast in isometric Monument Valley view, 6–8 frame walk cycle, clay-smooth 3D, brass lens case bouncing slightly, cloak hem moving, feet contacting ground, transparent background. Not a fox, not Liu Kanshan, no white bean body, no black stick limbs.
中文：同一人形旅人东南向走循环，赤陶斗篷，透明背景，绝不是白狐。
```

### CHR-PLAYER-INTERACT  主角交互

```
Same tiny human explorer reaching one hand toward a terracotta arch keystone, isometric 3/4, 4 frames, clay-smooth Monument Valley sprite, terracotta cloak, brass lens case, transparent background. Curious, not combat. Not Liu Kanshan.
中文：同一旅人伸手轻触拱心石，四帧，透明背景。
```

### CHR-LIU-SIT  刘看山坐姿（严格官方形象）

```
Official Zhihu mascot Liu Kanshan sitting on a cream cushion in a small chapel alcove. Exact design: smooth matte white bean-shaped body, pointed white ears, huge round black nose, one tiny black dot eye, thin black arms and legs, round white tail. Calm waiting sit, 3/4 isometric Monument Valley camera, slight breathing. Transparent background, only a hint of cushion, no clothes, no glasses, no recolor, no redesign. Match the official front/side/back turnaround exactly.
中文：严格按刘看山官方三视图，坐在西侧小礼拜堂垫子上，等距四分之三侧面，白身黑鼻黑肢圆尾，透明背景，不得改设计。
```

### CHR-LIU 现成资产（不要重画）

直接使用 `idle` `greet` `wander` `sleep` `ball` `computer`。若必须统一相机，只做轻微透视校正。

---

## 无名原子庭（英雄场景）

### ARCH-QUAY-PLAZA  奶油广场

```
Monument Valley courtyard floor, one continuous cream plaster surface #F3DDC0, hand-troweled but nearly uniform, warm terracotta lip #8E5340 around the floating island edge. No tiles, no grout, no checkerboard, no mosaic, no crack grid. Isometric orthographic, long shadows, empty elegant plaza. Finished 3D game asset.
中文：整块奶油灰泥广场，一圈赤陶压边，严禁棋盘格和地砖缝。
```

### ARCH-QUAY-BOND-PATH  价键细径

```
Thin gold chemical-bond inlay path flush in cream plaster, finger-width, smooth rounded turns, color #E7C56A, Monument Valley elegance. Route from spawn to a west chapel to a hexagonal medallion to three north arches to an east gate. No glow bloom, no chunky gold bricks, no arrows, no runes. Reads as a covalent bond drawn across a courtyard.
中文：院子里的一根化学键，细金嵌线，不是金砖大道。
```

### ARCH-QUAY-MEDALLION  碳六边形徽章

```
Flush floor medallion: regular hexagon gold inlay for carbon, four short valence marks, cream plaster inside, no raised dais, no crystal. Readable as carbon hexagon + four bonds from a distance. Monument Valley terracotta-cream-gold, isometric.
中文：地面六边形碳徽章，四条价键短线，嵌平，不要台子。
```

### ARCH-QUAY-CHAPEL  西侧礼拜堂

```
Small west-side chapel as its own volume, terracotta plaster cube, single arched alcove facing the courtyard, cream cushion inside, modest cream cornice. A visible gap of sky between this chapel and the north palace — they must not merge. Monument Valley, empty seat (mascot composited later), no extra furniture, no clipping doorway.
中文：西侧独立小礼拜堂，开口朝院子，只有坐垫。必须和后宫断开，中间能看见天。
```

### ARCH-QUAY-PALACE  后宫三拱实验室

```
Monument Valley north palace: three distinct arched laboratories side by side, not one long garage. Terracotta plaster, cream pilasters between arches, carved keystones. Left hydrogen gold, middle carbon teal, right oxygen cyan. Each arch is a deep niche large enough for an atom orrery inside. Stepped cream roof slabs, no giant dome, not full-width of the plaza. Separate from the west chapel. Long shadows, finished monument.
中文：北侧后宫必须是三座能分开的拱门实验室，氢金、碳青、氧水蓝，壁柱隔开，不要一个大车库。
```

### ARCH-QUAY-NICHE-H  氢仪 H-1

```
Architectural niche orrery of hydrogen inside a terracotta arch: one gold proton sphere, one single electron ring, keystone carved H and 1. Monument Valley scale, chapel relic not a toy. Deliver dim unlit and warm gold lit variants. No text except H and 1.
中文：氢壁龛，1个质子+1圈电子，拱心石 H 与 1，亮/灭两态。
```

### ARCH-QUAY-NICHE-C  碳仪 C-6

```
Architectural niche orrery of carbon: teal nucleus with six proton beads, two electron shells, four valence marks on the inner ring, keystone C and 6, hexagonal motif on the niche floor. Monument Valley, large relic in the middle arch. Dim and lit variants. No text except C and 6.
中文：碳壁龛，6质子、双电子层、四价标记，拱心石 C 与 6。
```

### ARCH-QUAY-NICHE-O  氧仪 O-8

```
Architectural niche orrery of oxygen: cyan-water nucleus with eight proton beads, two electron shells, keystone O and 8, cooler light than hydrogen. Monument Valley, right-hand arch relic. Dim and lit variants. No text except O and 8.
中文：氧壁龛，8质子、双电子层，拱心石 O 与 8。
```

### ARCH-QUAY-GATEHOUSE  东身份门楼

```
East identity gatehouse, twin terracotta towers with cream caps, lintel spanning a walkable arch. Three circular sockets in the lintel with tiny incised numerals 1, 6, 8; gold/teal/cyan when filled, stone-dark when empty. Monument Valley, elegant, not a castle portcullis, not a sci-fi scanner. Variants: all dark; 1 lit; 1+6 lit; all lit open.
中文：东侧双塔门楼，梁上三孔 1、6、8，点亮后才是氢碳氧身份之门。
```

### ARCH-QUAY-PARAPET  前缘女墙

```
Low terracotta parapet, chest-high, cream coping, two or three cypress in pots, gap for a stair bridge, Monument Valley sparse landscaping. No iron fence, no banners, no row of ten trees.
中文：胸口高的前缘女墙，两三棵柏，留出桥缺口。
```

### ENV-LAGOON / MESA / SUN / SKY  环境衬底

```
Monument Valley postcard backdrop: shallow turquoise-green lagoon at the courtyard front, peach desert, stacked cream-and-sage mesa buttes, a flat pale sun disc, warm dusty sky #EAD6B8. No cloud collage, no lens flare, no city. Backdrop is quiet; the courtyard stays the hero.
中文：潟湖、桌山、扁平日盘、暖雾天空，只做明信片衬底。
```

### ENV-CYPRESS  柏树

```
Monument Valley cypress, stacked six-sided cones, foliage #DDE8D0 or dry #E8D7B6, cream trunk, isometric, clean boolean look, single tree asset with two color variants.
中文：纪念碑谷柏树，六边锥叠，奶油树干。
```

---

## 其余台地

### ARCH-PERIODIC  周期坐标廊

```
Isometric colonnade in sage plaster #5F9178, cream floor #DBE7D6, pillars as a fragment of the periodic table: rows as periods, columns as groups. Thin gold indices, no full periodic chart, no element-letter soup. Walkable aisle, one lectern built into a pillar. Monument Valley.
中文：建筑化的周期表片段，横周期纵族，不要整表贴墙。
```

### ARCH-ELECTRON  电子观测台

```
Teal observatory monument, cream floor, large architectural nucleus and two or three torus electron orbits as building rings. Sodium 2-8-1 hinted by bead counts. Monument Valley, calm, not a space station, no HUD, no glow sticks.
中文：电子观测台，中央核+两到三圈建筑化轨道。
```

### ARCH-FAMILY  家族温室

```
Three small greenhouse pavilions in coral plaster: alkali warm vines, halogen sharp pale crystals, noble-gas quiet gold lanterns. Monument Valley, sparse, architectural, not cartoon vegetables.
中文：三座温室=碱金属/卤素/稀有气体，性格靠植物与灯，不靠贴字。
```

### ARCH-BOND  键工坊

```
Ochre workshop: two atom pillars and a connecting bond beam. Left slightly metallic (donor), right slightly glassy (receiver). Connected and broken variants. Monument Valley. No pipes, no anvils, no fantasy crystals.
中文：双原子柱+键梁，接通/断开两态。
```

### ARCH-ISOTOPE  同位素穹室

```
Slate-blue vault, two nearly identical towers under one pale dome. Same silhouette, different mass: shorter carbon-12, taller carbon-14 with two extra neutron beads in the capital. Six proton marks identical on both. Monument Valley. Optional tiny 12 / 14 only.
中文：两座几乎相同的塔，质量微差，共顶一穹，质子数都是 6。
```

### ARCH-NEON  空白 10 号石格

```
A blank periodic-table floor tile monument, incised number 10, missing symbol, sage plaster. Unawakened ashen; awakened with quiet neon-gas glow suggesting Ne without writing the name. Monument Valley.
中文：被擦掉符号的石格，只留 10，唤醒后冷青光。
```

### ARCH-NOBLE  稀有气体亭

```
Quiet noble-gas pavilion, three lanterns in a triangle, teal plaster, empty center, no bond beams. Lanterns pale gold-white. Monument Valley, calm, not a light show.
中文：三盏静灯，亭中空，故意不成键。
```

### ARCH-WATER  水分子拱

```
Broken water-molecule arch: central oxygen volume, two hydrogen volumes, one covalent bond beam missing. Coral plaster, water-cyan accents. Repaired variant completes bent H-O-H and casts a faint prismatic shadow. Monument Valley. Optional tiny H / O only.
中文：H-O-H 拱门缺一条键，修复后投下浅虹影。
```

### ARCH-C14-ECHO  碳-14 回声

```
Small roadside echo relic: two similar carbon nuclei, one with two extra pale beads, second ring glows a half-beat later. Modest ochre-slate, Monument Valley, not a loud shrine.
中文：桥边小品，两声回响，质子数相同中子数不同。
```

### ARCH-BRIDGE  阶梯键桥

```
Isometric stair bridge between floating terraces, cream stone steps, thin gold bond inlay down the center, low terracotta rails. Main wide and side narrow variants. Monument Valley. No ropes, no chains, no giant arches.
中文：奶油石阶，中央一根细金键，低栏杆。
```

---

## 交互 / 贴图 / 特效 / UI

### PROP-LECTERN  贴墙读经台

```
Wall-attached isometric lectern, cream stone, thin gold reading slope, chest-high, Monument Valley. No monitor, no keyboard, no floating book, does not sit in path center.
中文：贴墙小读经台，不要立在路中间。
```

### PROP-RIFT  每日裂隙

```
A thin cyan ring inlaid flush in cream plaster, slow pulse, Monument Valley. Daily rift, not a portal door, not a crystal, not a standing stone.
中文：嵌平的水色细环，缓慢呼吸。
```

### TEX-PLASTER-CREAM  奶油灰泥

```
Seamless cream plaster albedo #F3DDC0, Monument Valley, almost uniform, very subtle trowel variation, no tiles, no grout, no stain grid, 2048, high roughness, no noisy normal map.
```

### TEX-GOLD-INLAY  金嵌线

```
Thin gold inlay trim, warm #E7C56A, soft metal not chrome, not glitter, usable as a strip, 2048, optional transparent edges.
```

### VFX-NICHE-LIT / SOCKET / RIFT / SKILL

```
Subtle Monument Valley game VFX, soft dust light in an arch or a thin ring pulse or a quiet valence ring expanding from tiny feet. No sparks, no lens flare, no manga lines, no fireworks, transparent PNG sequence.
中文：温石光，不要技能特效包。
```

### UI-SKILL 六枚技能图标

```
Minimal Monument Valley UI icon, flat-soft 3D, cream-gold-teal, no text, transparent SVG+PNG 256.
原子视野：单核+一环，金。
周期步：2×3 空格阵。
价电子牵引：最外层一颗珠被拉出。
族性共鸣：三盏小灯。
化学键编织：双珠连一线。
同位回声：双核微差。
```

---

## 英雄总图（只用于概念验收，不替代分资产）

```
Finished Monument Valley isometric game screenshot, chemistry architecture courtyard called the Nameless Atom Court. Cream plaster plaza with no tiles, a thin gold bond path, a hexagonal carbon medallion, a small separate west chapel, a north palace with three distinct arched labs for hydrogen carbon oxygen (keystones H-1, C-6, O-8) with atom orreries inside the niches, an east twin-tower identity gate with sockets 1-6-8, low front parapet, two cypress trees, lagoon and desert mesas beyond, flat sun. Tiny human traveler in a terracotta cloak in the foreground; white fox mascot Liu Kanshan sitting in the west chapel — two different characters. Sparse, elegant, long shadows, no clutter, no checkerboard, no gems on the floor, no collage, no watermark. Poster-quality.
中文：纪念碑谷成品截图，无名原子庭，三拱氢碳氧实验室，细金键径，西侧独立礼拜堂坐着白狐刘看山，前景是赤陶斗篷的微型人形主角，两人不是同一角色。广场干净，化学全靠建筑阅读。
```
