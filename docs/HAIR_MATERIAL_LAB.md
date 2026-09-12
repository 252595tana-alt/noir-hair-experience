# Hair Material Lab

HOMEのHair Unwoven Galleryの次に配置した、独立した毛束のマテリアル体験です。写真の加工や顔の変形は行わず、手続き生成したHair MeshをReact Three FiberとThree.jsのShaderMaterialで描画します。

## 操作と選択値

- STYLE: `straight` / `wave`
- COLOR: `black` / `brown` / `ash` / `beige`
- TEXTURE: `matte` / `natural` / `silky`
- マウスは照明位置のみを変更。タッチ端末・キーボードでは「光の位置」rangeを使用。
- AUTO LIGHTは光の自動移動を停止・再開。reduced motionでは自動移動を停止し、選択を即時反映。

## 独立コンポーネントのAPI

`src/components/HairMaterialLab/index.ts`から公開します。

```tsx
import { HairMaterialLab, type HairMaterialSelection } from "@/components/HairMaterialLab";

<HairMaterialLab
  value={selection}
  onSelectionChange={setSelection}
  onBook={(selection: HairMaterialSelection) => openBooking(selection)}
  active={!overlayOpen}
/>
```

`value`省略時は内部state、`defaultValue`で初期選択を指定できます。`onSelectionChange`と`onBook`は常に `{ style, color, texture }` を受け取ります。`bookingHref`で通常リンク／新規タブ用の遷移先を差し替えられます。既定は `/booking?source=hair-material-lab&style=...&color=...&texture=...`。

LabはGallery・Journey・Windのstate、Canvas、スクロール制御を参照しません。サイト側の `Experience.tsx` のみが選択を保持し、予約画面への遷移を担当します。将来の連携はこの親側で各体験の選択を変換して `value` に渡してください。GPU Hair Windからの変形値をLabに渡す必要はありません。

## シェーダー

`src/three/HairMaterialLab/hairMaterial.vert` はSTYLEの補間値だけで形状を変化させます。ポインターと時間のuniformはvertex shaderに存在せず、照明操作で髪は動きません。

`hairMaterial.frag` は以下を計算します。

- Fine silk grain: 毛流れに沿う微細な筋。`fwidth`で高周波のエイリアシングを抑制。
- Subtle procedural noise: 低振幅のvalue noiseを重ね、色と粗さを変調。
- Anisotropic highlight: 接線に沿ったKajiya–Kay型の主・副ローブ。
- Rim light: 視線と法線から輪郭光を算出。
- Light sweep: 髪のUV上を移動する帯状光源。
- Roughness variation: ノイズと微細筋から局所的な粗さを生成。

MATTE → NATURAL → SILKY はroughness `0.78 → 0.44 → 0.18`、specular `0.16 → 0.48 → 0.86`、highlight `0.23 → 0.62 → 1.08`。フレーム時間に基づく指数補間で滑らかに変更します。定数は `model.ts` に集約。

GLSL編集後は `pnpm shaders`。`pnpm dev` / `pnpm build`でも生成されます。`shaders.generated.ts`を直接編集しないでください。

## 負荷・ライフサイクル

| 設定 | PC | スマホ・タッチ端末 |
|---|---|---|
| DPR上限 | 1.5 | 1 |
| Noise octaves | 3 | 1（コンパイル時に削減） |
| 毛束 / 長さ方向の分割 | 72 / 112 | 42 / 64 |
| 自動描画の上限 | 画面更新に同期 | 最大30FPS |
| アンチエイリアス | 有効 | 無効 |

画面の240px手前でCanvasを遅延読込。画面外・非表示タブ・親の `active=false` ではタイマーを解除し描画停止。AUTO LIGHT停止後は補間が完了した時点でdemand描画も停止します。geometryは品質変更時とアンマウント時にdispose。WebGL非対応・コンテキスト喪失・シェーダー失敗では静止SVGプレビューへ移行し、選択と予約リンクを保持します。

## 予約接続

予約画面ではLab専用の3項目を表示し、通常ギャラリーの予約内容と混在させません。URLから列挙値を検証して復元するため、予約画面の再読み込み・共有にも対応します。Lab操作で既存ギャラリーの選択値や料金を変更しません。

- LINE: 既存の `NEXT_PUBLIC_LINE_BOOKING_URL` を使用し、3項目を入れた日本語の予約文を既存 `createLineBookingUrl` へ渡します。
- WEB: `NEXT_PUBLIC_WEB_BOOKING_URL` に `source / style / color / texture` queryを付加し、元のqueryとhashも保持します。外部フォーム側でこれらの項目を取り込むよう設定してください。
- 未設定時: 既存の予約文プレビュー・コピーを使用します。選択しただけでは外部送信や予約確定は発生しません。

## 検証

`tests/hair-material-model.spec.ts`: 全24組み合わせ、LINE文面、WEBパラメーター保持、不正値の拒否。

`tests/hair-material-lab.spec.ts`: PC / mobile / tabletの操作・予約の再読込、GPUコンパイル、質感と形状の描画変化、照明のみのポインター操作、DPRとNoise、画面外停止、キーボード、320px、axe、reduced motion、WebGL非対応・context loss。

```sh
pnpm typecheck
pnpm lint
pnpm build
# 別ターミナルで pnpm dev または pnpm start
pnpm exec playwright test tests/hair-material-model.spec.ts tests/hair-material-lab.spec.ts
```

実機Safari・ネイティブLINEアプリへの遷移と、予約サービス側でのquery受け取りは接続先設定後に確認してください。
