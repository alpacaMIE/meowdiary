# 素材来源与生成记录

## 2026-10-29 · 全页面对齐单页设计

`public/assets/design/` 中的 `diary.png`、`feeding.png`、`settings.png`、`storage.png` 分别是已确认的单页设计 06、07、16、20 的原样副本。`src/ui.jsx` 的 `referenceIcons` 只通过 SVG viewBox 取用其中的插画图标；页面文字、表单、按钮、卡片及数据均由 HTML/React 渲染。没有把整页设计图作为界面，也没有修改设计源文件。

布局对应关系及浏览器回归截图见 `qa/design-alignment.html`。旧版第 13 张首次建档图由猫咪专用的第 21–33 张设计取代；保留右上角“跳过”。

以下三张图片均使用内置 `image_gen` 生成，并复制到本项目。不依赖运行时生图或远程素材地址。

| 文件 | 用途 | 背景 |
| --- | --- | --- |
| `public/assets/cat.png` | 团子、猫咪默认形象 | 透明 |
| `public/assets/dog.png` | 小米、狗狗默认形象 | 透明 |
| `public/assets/diary.png` | 演示日记配图 | 窗边场景 |

## Cat — 最终提示词

Use case: stylized-concept. Asset type: main pet mascot for a warm cream mobile pet diary app. A single adorable fluffy seal-bicolor ragdoll kitten, whole body sitting, front three-quarter view looking slightly upward, large clear blue eyes, small pink nose, cream-white face with symmetric cocoa-brown mask, chocolate ears and one fluffy brown tail curling to its left, four anatomically correct paws, plush lifelike fur with delicate painterly softness. Warm gentle daylight. Sophisticated collectible plush illustration, same visual direction as a warm Japanese pet lifestyle journal, no clothing or accessories. Centered on a truly transparent background, generous clear space around ears and tail. No text, no props, no background.

## Dog — 最终提示词

Use case: stylized-concept. Asset type: secondary pet mascot for a warm cream pet diary app. A single adorable fluffy golden cream puppy with floppy caramel ears, whole body sitting, front three-quarter view, big gentle brown eyes and small black nose, short rounded paws, one tail, correct dog anatomy, plush lifelike fine fur with delicate painterly softness. Warm gentle daylight. Sophisticated collectible plush illustration matching a cute fluffy ragdoll kitten aesthetic. Centered on a truly transparent background with clear space around silhouette. No text, no clothes, no props.

## Diary — 最终提示词

Use case: illustration-story. Asset type: wide editorial diary photo for a warm cream pet journal app. One adorable fluffy seal-bicolor ragdoll kitten with large blue eyes, white muzzle, tiny pink nose, cocoa brown ears and mask, sitting on cream linen by a sunlit window, gently looking toward a tiny blue butterfly. Plush lifelike soft fine fur and delicate painterly finish. Warm afternoon sunlight, blurred beige domestic interior with a soft green houseplant, quiet tender mood, lovely subtle grain and creamy caramel palette. Wide horizontal 3:2 composition, kitten on right-center, unobstructed. No text or logos or watermark.

图标：Lucide React（ISC）。站点小图标为本地 SVG。毛色和体型选择使用前端 CSS 展示参数，不覆盖原始素材。

## 2026-10-28 · 手绘贴纸风

本轮使用内置 `image_gen`，新增以下透明素材：

- `public/assets/cat-photo.png`：从用户确认的 `Design/风格探索/home-photo-sticker-v2.png` 提取的照片质感猫咪。白边与投影由前端 SVG filter 添加。完整提示词见 `Design/风格探索/cat-photo.prompt.md`。
- `public/assets/sticker-icons.png`：3 列 × 4 行的手绘图标图集，通过 CSS 单元格定位显示。完整提示词见 `Design/风格探索/sticker-icons.prompt.md`。

两张素材均为 AI 生成，保存在项目内，无远程资源依赖。旧版猫咪图保留用于历史资料兼容，新界面将原猫咪素材路径映射到 `cat-photo.png`。

## 2026-10-29 · 猫咪建档引导

`public/assets/onboarding/` 中的四张 PNG 是已确认 imagegen 设计稿的完整副本，未重新生成或修改原图：

| 文件 | 对应设计稿 | 用途 |
| --- | --- | --- |
| `welcome.png` | `21_猫咪建档_开始.png` | 首次启动的猫咪与档案贴纸 |
| `avatars.png` | `23_猫咪建档_头像选择.png` | 橘猫、狸花、三花、黑猫、白猫头像 |
| `dates.png` | `26_猫咪建档_生日与到家日.png` | 猫咪与日历贴纸 |
| `health.png` | `28_猫咪建档_健康资料.png` | 猫咪与体重秤贴纸 |

页面通过 SVG viewBox 显示需要的插画区域，文字、按钮、表单和弹层均由 HTML/CSS 构建。默认布偶头像仍使用 `cat-photo.png`。完整原始提示词见 `Design/单页图/猫咪建档_生成记录.json`。头像区域信息随档案保存，并用于首页、详情、切换面板和分享图片，确保选中的头像一致。
