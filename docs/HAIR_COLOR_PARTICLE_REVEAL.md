# Hair Color Particle Reveal

体験本体は`/color-reveal`の専用画面に配置。HOMEのHair Unwoven Gallery直後には静止画の入口を置き、PCナビゲーションとモバイルのMENUからも専用画面へ移動できます。TOPではWebGPUとParticleデータを読み込みません。

## 構成

- `src/components/HairColorParticleReveal/`: TOP用の軽量な入口、5色のradio UI、端末判定、静止画フォールバック、選択保存、予約表示。
- `src/three/HairColorParticleReveal/RevealCanvas.tsx`: 遅延読み込みするR3F Canvas、非同期WebGPU初期化、フレーム制御、GPUエラー処理。
- `src/three/HairColorParticleReveal/revealNodes.ts`: TSLの髪色シェーダー、Compute Shader、WebGL用の頂点シェーダー。
- `scripts/prepare-reveal-assets.mjs`: マスク内の発生点と毛流れテクスチャをオフラインで生成。

使用写真は既存のSILK STRAIGHT（`styles-v2/bleach.webp`）。写真・Hair Mask・Flow・発生点は`model.ts`の同一styleエントリーで管理します。現在対応するモデル写真はこの1スタイルです。新しいスタイルは対応するマスクとFlowを揃えて登録してください。写真だけの差し替えは位置が一致しません。

## GPU処理

WebGPUバックエンドが実際に初期化できた場合、位置・速度を`instancedArray`に保持し、TSL `Fn().compute(count)`を`renderer.compute()`で実行します。シードは読み取り専用のバッファです。マスクをサンプリングした位置から、Flowの向き、弱い乱流、ポインターの局所的な力を使って速度・位置をGPU上で積分します。

WebGPUが利用できない場合はThree.jsのWebGL2バックエンドを使い、同じTSLから生成した頂点シェーダーで移流を計算します。この場合は状態を保持するCompute積分ではなく、経過時間による解析的な軌道です。どちらも毎フレームCPUで粒子位置を更新しません。CPUは一定数のuniformだけを更新し、GPUバッファの読み戻しは行いません。

| 入力 | 用途 |
| --- | --- |
| `uTime` | 低速の乱流位相 |
| `uPointer` | 写真内のポインター位置。局所的に緩く押し流す |
| `uFlow` | RGにXY方向を格納した毛流れテクスチャ |
| `uColorFrom`, `uColorTo` | リニア色空間の髪色係数。髪と粒子で共有 |
| `uProgress` | 2.6秒の色変化とダストの発生・消滅を同期 |
| `uNoise` | 端末別の乱流強度 |
| `uDelta`, `uReset`, `uMotion` | GPU積分、再発生、動作停止 |

粒子は通常のalpha合成を使う柔らかい細粒と霧です。加算合成、点滅、Bloomは使用しません。髪シェーダーは元写真の輝度と局所コントラストを残し、マスク内だけに色係数を適用します。色変更を中断して別の色を選ぶ場合は、表示中の補間色を次の開始色として使います。

## 品質・停止・フォールバック

| 端末 | 粒子数 | DPR上限 | Noise octave | 更新目安 |
| --- | ---: | ---: | ---: | ---: |
| PC | 12,000 | 1.5 | 3 | 60fps |
| Mobile / coarse pointer / Save-Data | 2,400 | 1 | 1 | 最大30fps |

Mobileは写真・Mask・Flow・シードの転送量も削減。画面付近までCanvasをロードせず、画面外・非表示タブ・サロンoverlay表示中は停止します。色変化完了後も連続描画しません。`prefers-reduced-motion`またはUIのOFFでは粒子を停止し、選択色を直ちに反映します。

素材取得失敗・WebGL context loss・WebGPU device loss・shaderエラーではDOMの写真とマスクを使った簡易色プレビューに戻ります。髪色の選択と予約は継続できます。GPU版と静止画版は色の厳密な一致を保証しません。

Flowは元写真の中央分けと髪の長さに合わせた手続き的な演出用フィールドです。実測の毛流れではありません。マスクは既存の画像に沿って作られたデータを再利用しています。

## 保存と予約

`noir-color-reveal-v1`に`{ style: "silk-straight", color: "silver" }`を保存。読み込み時にstyleと5色を検証し、不正値は既定値へ戻します。localStorageが使えない場合は現在のタブ内で保持します。既存Galleryの保存値は独立しています。

「BOOK THIS COLOR」は次のURLで既存予約画面へ遷移します。

```text
/booking?source=hair-color-particle-reveal&style=silk-straight&color=silver
```

予約画面のリロードや共有URLでも選択が復元され、予約確認とLINE用メッセージにSTYLE / COLORが入ります。WEB予約先へも`source` / `style` / `color` queryを追加し、予約先の既存queryは保持します。

実店舗の予約先は既存設定を使用します。

```dotenv
NEXT_PUBLIC_LINE_BOOKING_URL=https://line.me/R/oaMessage/@YOUR_ACCOUNT/
NEXT_PUBLIC_WEB_BOOKING_URL=https://YOUR_BOOKING_FORM/
```

現在リポジトリには予約先URLが提供されていません。未設定の場合は予約内容・メッセージ確認まで利用でき、予約の送信や確定は行われません。外部フォーム側が`style` / `color`を受け取れるよう設定してください。

## 再生成と検証

```sh
pnpm assets:reveal
pnpm typecheck
pnpm lint
pnpm build
pnpm test tests/hair-color-reveal-model.spec.ts --project=logic
pnpm test tests/hair-color-reveal.spec.ts --project=desktop --project=mobile --project=tablet
```

ブラウザーテストは起動中のlocalhost:3000を使用します。通常のWebGPUと、WebGPUを無効化したWebGLの両方について画素比較、同色リプレイによる粒子描画、連続変更、停止、予約、保存、欠損素材、context loss、キーボード、320px幅、axeを検証します。

検証結果: ChromeのPC・Pixel 7エミュレーション・タブレット寸法で追加27ケースを確認（修正後の再実行を含む）。TOPから専用画面への遷移、GPUを利用できない場合の予約、画面を離れる際の実際の`GPUDevice.destroy()`も確認しました。既存のlogic / production 23ケース、Depth Portrait / 既存選択・予約のPC回帰13ケースも通過しています。実機iOS / Androidでの性能測定は含みません。

参考: [Three.jsのCompute Particles](https://threejs.org/examples/webgpu_compute_particles.html)、[R3FのWebGPU対応](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)。
