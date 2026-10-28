# 确认稿中的照片猫

2026-10-28，使用内置 image_gen 从 `home-photo-sticker-v2.png` 中提取照片质感猫咪，透明素材保存在 `public/assets/cat-photo.png`。白色贴纸边框和投影由前端添加，以保持不同尺寸下的一致视觉厚度。素材是 AI 生成的照片质感形象，非用户提供的真实宠物照片。

```text
Use case: background-extraction. Image 1 is the edit target, the approved mobile interface design. Extract ONLY the central photographic ragdoll kitten into a standalone transparent PNG asset. Preserve that exact kitten's real photographic appearance, fluffy cream-white fur, light brown markings, blue eyes, natural face, seated front-facing posture and curved tail on the left. Do not reinterpret it as a plush toy, illustration, cartoon or 3D rendering. Keep the complete cat from the ear tips to the front paws, no cropped body parts. Remove ALL UI, text, hearts, badge, cushion, ball, screenshot background and the existing white sticker outline/shadow, leaving just the natural furry silhouette on actual transparent alpha. The frontend will add its own uniform white sticker border. Do not replace removed scenery with white or gray. Portrait roughly 4:5 image, cat centered filling 88–92% of the height, balanced modest transparent margins, normal undistorted proportions. No added objects, no text, no background and no ground shadow.
```
