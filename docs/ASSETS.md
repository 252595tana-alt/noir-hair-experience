# 画像素材

- `public/images/hero.png`：内蔵image_genツールで新規生成。架空の成人モデル。写真の追加編集はしていません。
- `public/images/hero-360/turntable-v2.avif|webp`：上記HEROを参照し、内蔵image_genツールで作成した同一モデルの4列×2行・8方向ターンテーブル。1776×888へ正規化し、ブラウザ表示用spriteとして圧縮。`front-v2.webp` は正面フレームとOpening点群の生成元。初稿で逆転していた左右斜め後ろを並べ直し、不足していた左斜め前を専用生成して差し替え済み。
- `public/images/styles-v2/*.webp`：LONG / WOLF / PERM / BOB / SHORT / BLEACH / LAYER / CREATIVEの代表写真8点。既存HEROと同じ架空の成人女性・黒背景・黒衣装・リムライトを基準に内蔵imagegenで制作し、すべて1024×1536pxへ統一。最終プロンプトセットは [STYLE_IMAGE_PROMPTS_V2.md](STYLE_IMAGE_PROMPTS_V2.md)。
- `assets/color-turnarounds/{black,ash,silver,blonde,dark-brown,beige,red,pink}.webp`：COLOR用のAI生成4列×2行マスター。各1536×1024px。8方向のセルは約378〜379×504pxで、人物、照明、切り抜き位置を色間で揃えています。旧ZIPの小画像を単純拡大したものではありません。生成方針は [COLOR_IMAGE_PROMPTS.md](COLOR_IMAGE_PROMPTS.md) に記録しています。
- `public/hair/{color}/01.webp`〜`08.webp`：マスターを固定セルで分割し、Lanczos3と軽いsharpenで768×1024pxへ正規化したcanonical 64枚。各セルの元情報量を超えるネイティブ撮影ディテールを示すものではありません。
- `public/hair/{color}/NN-{320,480,640,768}.{avif,webp,jpg}`：DOMのresponsive表示と端末Tier別WebGL Texture用variant。`src/data/imageManifest.json` が全64枚の寸法、幅、base URLを保持します。
- スタッフのイニシャル画像・概念地図：DOM/CSSで構成したデモ。
- フォント：Barlow Condensed / DM Sansを `next/font` で自己配信。読込できない場合はシステムフォントへフォールバック。

## HERO生成プロンプト

```text
Use case: photorealistic-natural. Create a finished photograph asset for a luxury Japanese hair salon website, no typography or interface. Portrait 2:3. A striking Japanese female fashion model age 25, waist-up, very long layered ash black hair with wispy fringe, hair flowing broadly to the right with a slight wind, sculptural naturally separated silky strands. Three-quarter pose facing camera, confident quiet expression, black sleeveless high neck fashion top, arms relaxed. Rich realistic skin, editorial beauty campaign shot on medium format. Dark charcoal almost black seamless background (#050505), cinematic silver rim lighting outlining every strand on right, softer warm light on face, high contrast, highly refined fashion magazine photography, restrained, realistic not plastic. Entire top of hair visible with generous headroom, shoulders visible, model centered. No text, no logos, no watermark. Hair is focal point. Save image asset.
```

## TOP 360°ターンテーブル生成プロンプト

使用方式：内蔵image_genのidentity-preserve編集。`public/images/hero.png` を人物・髪型・衣装・照明の参照画像として使用。

```text
Use case: identity-preserve
Asset type: production website 360-degree portrait turntable sprite sheet
Input image: reference for the exact woman's identity, long layered black hairstyle, black sleeveless turtleneck, cinematic black studio look
Primary request: Create one seamless 4-column by 2-row contact sheet containing exactly eight equally sized portrait frames of the same woman rotating through a complete 360-degree turn. Order left-to-right, top row then bottom row: 1 front, 2 right three-quarter front (45°), 3 right profile (90°), 4 right three-quarter back (135°), 5 back (180°), 6 left three-quarter back (225°), 7 left profile (270°), 8 left three-quarter front (315°).
Composition/framing: fixed camera and fixed crop in every panel, head and upper torso centered at identical scale and vertical position; long hair remains fully visible and logically follows the head around the turn.
Scene/backdrop: uniform pure black seamless background in every panel.
Lighting/mood: dark high-fashion salon editorial, cool silver rim light with subtle violet-blue highlights, restrained and realistic, matching the reference.
Constraints: exactly the same adult woman, facial identity, long hair length and cut, body proportions, sleeveless black turtleneck and lighting across all eight views; each panel must align for frame-by-frame drag rotation; clean equal panel boundaries without gaps, labels, borders, numbers, text, logos, or watermarks.
Avoid: duplicated angles, mirrored face pretending to be another angle, changing hairstyle or outfit, extra people, cropped hair, wind-blown asymmetry that breaks rotation consistency, panel dividers, captions.
```

初稿で不足した左斜め前は、HERO、初稿sprite、提供素材の左斜め前を参照し、次の追加プロンプトで1フレームだけ補正しました。

```text
Use case: identity-preserve
Asset type: one replacement frame for a production website 360-degree portrait turntable
Primary request: Create exactly one square portrait of the same woman at LEFT THREE-QUARTER FRONT / 315 degrees. She is turned 45 degrees to her left from the frontal pose, so her nose and gaze point clearly toward the RIGHT side of the image. The camera stays fixed.
Composition/framing: 1:1 square, head and upper torso centered at exactly the same scale and vertical position as each panel in the existing turntable; all long hair visible.
Scene/backdrop: uniform pure black seamless background.
Lighting/mood: identical dark high-fashion salon editorial lighting, cool silver rim light and subtle violet-blue highlights.
Constraints: exactly the same adult woman, facial identity, long hair length/cut, body proportions, sleeveless black turtleneck, crop, background and lighting. One person, one frame only. It must connect smoothly from left profile to front.
Avoid: facing toward image-left, frontal pose, right three-quarter pose, changing face, hairstyle, outfit, scale or shoulder position, wind, extra people, borders, labels, text, logos, watermark.
```

## COLOR素材の再生成

リポジトリ直下で次を実行します。

```bash
pnpm assets:color
```

スクリプトは8マスターが1536×1024pxであることを検証し、固定4×2セルを01〜08の順で分割します。既存の `NN-WIDTH.avif|webp|jpg` だけを整理した後、768×1024px canonical、320 / 480 / 640 / 768pxのAVIF・WebP・JPEG、64件のmanifestを決定的に再生成します。色ID、枚数、マスター寸法、フレーム寸法が不正な場合は完了させません。

## Phase 4 配信用素材

- COLORのcanonicalとvariantは `scripts/prepare-color-assets.mjs` が担当します。`scripts/prepare-production-assets.mjs` はCOLOR生成を同スクリプトへ委譲し、STYLE別OGなど残りの公開素材を生成します。
- `src/data/imageManifest.json` が768×1024px、幅 `[320,480,640,768]`、base URLを保持。`HairImage` が表示幅に適した形式を選択し、遅延・失敗時はplaceholderを表示します。WebGLはHigh 768px、Medium 640pxを上限にし、Low TierではCanvasを作らず480px variantをDOM表示や先読みに使用します。
- `public/og/`：STYLE 8点＋SALON 1点、1200×630 JPEG。STYLE名と設定サロン名を含む。生成時に `.env.local` 等の公開サロン名を読み込む。
- フォントはPhase 4から `next/font` による自己配信。Google Fontsへの実行時アクセスは不要。ビルド時には取得用ネットワークが必要。
- 原本ZIPは変更していません。現在のAI生成COLOR素材はデモ用です。正式公開で実際の仕上がりを保証する場合は、同一カメラ・照明・切り抜きで撮影した実作品へ置き換えてください。
