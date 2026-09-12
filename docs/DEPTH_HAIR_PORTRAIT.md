# Depth Hair Portrait

HOMEのHair Material Labの次に配置した、1枚の写真を使う奥行きポートレートです。既存の `styles-v2/bleach.webp` をそのまま使用し、対応するDepth MapとHair Maskを重ねています。PCナビ、スマホのMENUからセクションへ移動できます。

## 表示と操作

- STYLEは写真に対応する `silk-straight`（SILK STRAIGHT）。今回の素材は1スタイルです。
- COLORは `black / brown / ash / beige`。写真の毛流れ・陰影を残し、マスク内だけを補間して変更します。
- マウス移動、横方向のタッチ、キーボード対応の視点スライダーで穏やかな奥行き差を付けます。縦方向のタッチはページスクロールを維持します。
- 奥行き効果のON/OFF、元写真との比較が可能。比較中も選択値は保持します。
- reduced motionでは視点変形と自動光を停止し、カラー変更を即時反映します。

## 素材とDepthの定義

`scripts/prepare-depth-portrait.mjs` は、この写真専用に作成した輪郭・顔除外領域と画像の明度・色差を使ってHair Maskを生成します。Depthは顔・前髪・毛先・背景の領域を手動設計したアートディレクション用のマップです。実測深度や深度推定モデルの出力ではありません。元のモデル写真は変更しません。

| 項目 | PC | スマホ |
|---|---|---|
| 写真 | 1024 × 1536 WebP（既存） | 640 × 960 WebP |
| Depth Map | 1024 × 1536 PNG | 384 × 576 PNG |
| Hair Mask | 1024 × 1536 PNG | 640 × 960 PNG |

3つの画像は同じ2:3の構図・UVを共有します。Depthは黒が遠く白が近いデータ、Maskは黒が対象外・白が髪・グレーが混合境界です。顔・前髪・毛先・背景の深度を滑らかに分け、前髪が手前、顔が中間、毛先と背景が奥に感じられるよう調整しています。Depthはぼかして局所的な折れや顔の歪みを抑えています。

```sh
pnpm assets:depth
```

出力は `public/images/depth-portrait/`。`manifest.json` に元写真・寸法・生成方式を記録します。別写真へ差し替える場合は3画像を一組で用意してください。この生成スクリプトの輪郭座標は現在の写真専用です。

## 独立コンポーネント

```tsx
import { DepthHairPortrait, type DepthPortraitSelection } from "@/components/DepthHairPortrait";

<DepthHairPortrait
  value={selection}
  onSelectionChange={setSelection}
  onBook={(selection: DepthPortraitSelection) => openBooking(selection)}
  active={!overlayOpen}
/>
```

公開APIは `src/components/DepthHairPortrait/index.ts`。`value`省略時は専用の永続stateを使います。`bookingHref`でリンク先を変更でき、通常クリック・別タブでも同じ選択値を渡せます。`onBook`は通常クリック時に `{ style, color }` を返します。素材定義・カラー・品質設定は `model.ts` に集約しています。

Gallery / Journey / GPU Hair Wind / Material LabのstateやCanvasへ依存しません。連携する際は親コンポーネントで選択値を変換してください。スタイルを増やす場合は `depthPortraits` に登録し、その写真に対応するDepthとMaskを必ず指定します。

## Shaderと描画

`src/three/DepthHairPortrait/depthPortrait.vert` で `uDepth` をサンプリングし、細分化した `PlaneGeometry` の頂点を深度とポインターに応じてわずかに変位させます。写真の外周では変位をゼロへ落とし、画像端の欠けを防ぎます。写真・Depth・Maskを同じUVで変形するため、カラー領域が髪からずれません。

`depthPortrait.frag` ではsubtle light sweep、毛流れを模したanisotropic風highlight、fine noise、マスク勾配からのedge highlight、写真の明るい筋に沿うhair glossを計算します。実3Dの毛髪散乱ではなく、写真に合わせた控えめな近似です。すべての色・光効果をHair Mask内に限定し、顔・目・服・背景の色を維持します。

写真はsRGB、DepthとMaskはlinear data texture。出力時だけsRGBへ変換し、全体のtone mappingは行いません。GLSLを編集した場合は `pnpm shaders`（dev / buildでも実行）でTypeScriptモジュールを再生成します。

| 設定 | PC | スマホ・タッチ端末・省データ |
|---|---|---|
| Plane分割 | 100 × 150 | 36 × 54 |
| DPR上限 | 1.5 | 1.25 |
| Noise octaves | 2 | 1（コンパイル時削減） |
| Pointer強度 | 1 | 0.45 |
| Edge計算 | マスクの4近傍サンプリング | 微分による近似 |
| 自動描画 | 画面更新に同期 | 最大30FPS |
| アンチエイリアス | 有効 | 無効 |

写真の240px手前でCanvasを遅延読み込みします。画面外・非表示タブ・`active=false`では描画を停止。操作と光を停止した後も、補間が完了すれば描画しません。3枚のTextureとGeometryを所有し、途中読込失敗・アンマウント時にもdisposeします。WebGL非対応、素材読込失敗、context loss、shader失敗では静止写真に戻り、カラー操作と予約導線を維持します。静止表示の色はマスクを使うCSS合成の近似です。

## 選択値と予約

専用localStorageキー `noir-depth-portrait-v1` に `{ style, color }` を保存し、再読込・タブ間で同期します。無効な値を検証し、保存領域が使用できない場合はタブ内メモリを使います。既存ギャラリーの選択・料金は変更しません。

BOOK THIS STYLEは次のようなURLで既存の予約画面へ進みます。

```text
/booking?source=depth-hair-portrait&style=silk-straight&color=ash
```

予約画面はURLから選択を復元し、SILK STRAIGHT / ASHを表示。再読込・共有URLも対応します。

- LINE: `NEXT_PUBLIC_LINE_BOOKING_URL` にSTYLE / COLORを記載した日本語の予約文を渡します。公式アカウントの `https://line.me/R/oaMessage/@account/` 形式に対応。
- WEB: `NEXT_PUBLIC_WEB_BOOKING_URL` に `source / style / color` queryを付加。既存のqueryとhashを保持します。外部フォーム側でこのqueryを取り込む設定が必要です。
- 予約先が未設定の場合は既存の予約文プレビュー・コピーを使います。選択やCTAだけで予約確定は行いません。

## 検証

`tests/depth-portrait-model.spec.ts` は全カラーのURL・LINE文面・WEB引継ぎ、不正値拒否、写真とマップの寸法、肌・服・背景の除外、領域別Depthを検証します。

`tests/depth-hair-portrait.spec.ts` はPC / mobile / tabletで選択保持と予約、GPUによる髪色変更と対象外の画素維持、ポインター・実タッチイベント、品質上限、画面外停止、キーボード、320px、axe、reduced motion、素材欠落・context lossを検証します。

```sh
pnpm typecheck
pnpm lint
pnpm build
# 別ターミナルで pnpm dev または pnpm start
pnpm exec playwright test tests/depth-portrait-model.spec.ts tests/depth-hair-portrait.spec.ts
```

実機Safari、ネイティブLINEアプリ、外部予約フォームでの実際の受取りは未検証です。スマホ検証はChromeの端末エミュレーションです。

### 今回の検証結果

2026-09-12、Next.js 16.3.4 / Chromeの本番モードで確認しました。

- `pnpm typecheck` / `pnpm lint` / `pnpm build`: 成功。
- 新規Portraitの17件と既存ロジック・本番表示の19件: 36件成功。
- 通常の選択・予約、Material Lab、Gallery、Journeyの回帰確認: 19件成功。JourneyのPC専用ケースはmobile / tabletで既定どおり2件skipし、対応するモバイル描画テスト2件を別途実行して成功。合計57件成功。
- 左右の最大視点で撮影したCanvas画像を比較。約440px幅の写真で顔領域は約7px、毛先領域は約0pxの相対移動を確認し、Shader上の奥行き差が実画像にも反映されることを確認。
- セクションのPC / mobile / tablet画像を `docs/screenshots/` に保存（検証用のためGit管理外）。
