# 《看山异闻录 · 周期庭院》美术制作包

给专业美工和绘画 Agent 使用，不要求读代码。  
引擎里现有的占位几何、棋盘地砖、广场散落小道具全部作废。

## 先看哪个文件

| 文件 | 给谁 | 用途 |
|---|---|---|
| **[PAINTING_PROMPTS.md](PAINTING_PROMPTS.md)** | **绘画 Agent（现在用这个）** | 每条 PNG 一份可复制提示词 |
| **[PAINTING_INDEX.csv](PAINTING_INDEX.csv)** | 绘画 Agent / 制作统筹 | 文件名、格子、优先级、落地路径 |
| [../ART_PACK.md](../ART_PACK.md) | 美术指导 | 风格、相机、锁定格子、验收 |
| [PROMPTS.md](PROMPTS.md) | 3D / GLB 团队 | 旧的建模提示词，本轮先不画模型 |
| [ASSET_INDEX.csv](ASSET_INDEX.csv) | 3D 资产总表 | GLB 规格仍在这里 |
| [references/liu-kanshan/](references/liu-kanshan/) | 全员 | 刘看山官方三视图与现有精灵 |

生成的 PNG 一律丢进：

`apps/web/public/assets/art/`

文件名必须与 `PAINTING_INDEX.csv` 完全一致。程序侧收到 P0 后再接线，未到图之前不要改名。

## 不可动摇

1. **主角不是刘看山。** 玩家是赤陶斗篷的微型人形旅人。禁止白身、黑鼻、黑肢、圆白尾、尖耳白狐剪影。
2. **化学长在建筑上。** H / C / O、1 / 6 / 8、电子环、价键路径是纪念碑，不是贴纸。
3. **风格锁定纪念碑谷。** 等距正交、奶油赤陶、长阴影、稀疏道具。禁止棋盘地、拼贴、宝石堆。
4. **交互必须看得见。** 知识点和谜题要用书、读经台、仪轨、门楼，不要隐形点击板。

## 刘看山参考

- `liu-orthographic-front-side-back.jpg` 正面 / 侧面 / 背面
- `liu-hero-white.jpg` / `liu-hero-green-key.jpg` 形象定稿
- `idle.png` `greet.png` `computer.png` 现成精灵
- 动画原文件在 `apps/web/public/assets/liu-kanshan/`

缺的是西侧小礼拜堂坐姿。新绘制必须 1:1 匹配官方形象。画坐姿时把上面三张一起发给绘画 Agent。画主角时 **不要** 附这些图。

## 绘画 Agent 先做 P0

1. 无名原子庭英雄图（锁体积）
2. 主角四件套：站 / 走 / 交互 / 头像 + 三视图
3. 刘看山坐姿
4. **打开的田野笔记** 和符号记忆读经台（醒目交互）
5. 氢 / 碳 / 氧仪轨、碳徽章、裂隙环、身份门
6. 西礼拜堂、后宫三拱、女墙、灰泥贴图

P1 是其余台地的门、知识碑、世界钩子。P2 是技能图标、登录背景、特效。
