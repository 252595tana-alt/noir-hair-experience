# 画像素材

- `public/images/hero.png`：内蔵image_genツールで新規生成。架空の成人モデル。写真の追加編集はしていません。
- `public/hair/*/*.webp`：Phase 3でユーザー提供の `hair_color_variations_64_images.zip` に置換。8色×8方向。`scripts/import-hair-assets.mjs` で区切り線・隣行を除去し、140〜141×100pxの比較範囲をロスレスWebP化。元ZIPは保持。拡大時の粗さと色ごとの構図差が残るため、実作品の高解像度素材への差し替えを推奨。
- スタッフのイニシャル画像・概念地図：DOM/CSSで構成したデモ。
- フォント：Google FontsのBarlow Condensed / DM Sans。通信できない場合はシステムフォントへフォールバック。

## HERO生成プロンプト

```text
Use case: photorealistic-natural. Create a finished photograph asset for a luxury Japanese hair salon website, no typography or interface. Portrait 2:3. A striking Japanese female fashion model age 25, waist-up, very long layered ash black hair with wispy fringe, hair flowing broadly to the right with a slight wind, sculptural naturally separated silky strands. Three-quarter pose facing camera, confident quiet expression, black sleeveless high neck fashion top, arms relaxed. Rich realistic skin, editorial beauty campaign shot on medium format. Dark charcoal almost black seamless background (#050505), cinematic silver rim lighting outlining every strand on right, softer warm light on face, high contrast, highly refined fashion magazine photography, restrained, realistic not plastic. Entire top of hair visible with generous headroom, shoulders visible, model centered. No text, no logos, no watermark. Hair is focal point. Save image asset.
```

## Phase 4 配信用素材

- `scripts/prepare-production-assets.mjs` が64フレームからAVIF / WebP / JPEGを2幅ずつ、計384variant生成。高解像度原本への置換時は最大1600pxまで複数幅を自動生成する。元画像を超えて拡大しない。
- `src/data/imageManifest.json` が寸法とsrcset候補を保持。`HairImage` が対応形式を選択し、遅延・失敗時はplaceholderを表示。
- `public/og/`：STYLE 8点＋SALON 1点、1200×630 JPEG。STYLE名と設定サロン名を含む。生成時に `.env.local` 等の公開サロン名を読み込む。
- フォントはPhase 4から `next/font` による自己配信。Google Fontsへの実行時アクセスは不要。ビルド時には取得用ネットワークが必要。
- 原本ZIPは変更していない。提供画像の低解像度・構図差は最適化では解消できないため、正式公開時は実作品の高解像度画像への置換が必要。
