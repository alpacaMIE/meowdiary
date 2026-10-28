# 首页 · 照片贴纸 v2

- 生成方式：内置 image_gen 编辑。
- 日期：2026-10-27。
- 编辑来源：`home-handdrawn-v1.png`。
- 输出图片：`home-photo-sticker-v2.png`。
- 变更：中央手绘猫替换为照片质感的猫咪抠图，增加白色贴纸边缘和轻微投影。
- 猫咪为 AI 生成的照片质感形象，未使用用户真实宠物照片。

## 完整编辑提示词

```text
Use case: precise-object-edit.
Input image 1 is the EDIT TARGET: an existing Chinese pet diary mobile home screen. Make exactly one localized visual change: replace ONLY the large hand-drawn kitten in the central hero vignette with a photorealistic cat photograph cutout sticker.

The new cat is a real-looking fluffy cream-and-brown ragdoll kitten with blue eyes, a natural cat face and normal feline proportions, photographed sitting facing forward with front paws visible and a fluffy tail curved to the side. It must visibly look like an actual camera photograph, with natural detailed fur, whiskers, eyes and soft daylight, not an illustration, not a cartoon, not a 3D render. Remove all original photo scenery so its silhouette is cleanly isolated. Add a crisp continuous WHITE DIE-CUT STICKER BORDER roughly 8–12 logical display pixels wide around the cat's entire silhouette, including ears, body, paws and tail. Add only a very subtle soft gray offset shadow just outside that white edge so the sticker remains visible on the white interface background. The white sticker outline is important and must be clearly visible. Do not outline the photographic cat in black.

Match the central cartoon cat's existing overall position, bounding size, sitting pose and prominence, with the sticker's paws visually resting on the existing yellow illustrated cushion. Replace the cartoon cat completely, without any ghost illustration underneath.

STRICT INVARIANTS: preserve the exact original screen size, proportions, spacing and composition. Keep the yellow hand-drawn cushion, toy ball, hearts, '摸摸我' speech bubble, '879天' badge, the small cartoon avatar in the top-right pet picker, ALL Chinese text, ALL icons, ALL controls, ALL rows, the status bar and the bottom navigation exactly unchanged. Keep the existing white background and all hand-drawn interface elements unchanged. Do not add any new text or UI, do not redesign the page. Output the complete edited home screen, opaque background, no phone device frame, no additional presentation surround.
```
