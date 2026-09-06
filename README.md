# NŌIR — HAIR IS IDENTITY.

公開デモ：**[noir-hair-experience.vercel.app](https://noir-hair-experience.vercel.app/)**

GitHubの `main` 更新はVercelへ自動デプロイされます。デモはURLから誰でも閲覧できますが、店舗情報と予約先が未設定のため検索エンジン向けにはnoindexを維持しています。

美容室向けインタラクティブサイト / Phase 4。Phase 1〜3の選択・予約連携とWebGL表現を保ち、画像・フォント・描画負荷、SEO、店舗設定、予約URL、アクセシビリティを整備しました。Next.js・TypeScript strict・React・Zustand・GSAP・Three.js・React Three Fiber・GLSL・CSS Modulesを使用します。

ひとつの画面からSTYLE / COLOR / STYLIST / MENU / BOOKINGへ切り替える構成です。実店舗情報と予約URLは未提供のため、現在は架空サロンのプレビュー・検索非公開設定です。正しい情報を `.env.local` とデータファイルに設定すれば、LINE / WEB予約先へ遷移できます。予約確定処理は予約先のシステムで行います。

## 起動

Node.js 24で検証。pnpmを推奨します。

```sh
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm start
```

Google Driveなどシンボリックリンクに制限がある場所でも利用できるよう、`pnpm-workspace.yaml` に `nodeLinker: hoisted` / `packageImportMethod: copy` / `symlink: false` を指定しています。同期ドライブでは依存関係の展開に時間がかかるため、開発時はプロジェクトをローカルディスクへコピーすると快適です。

今回の検証用コピーは `C:\Users\syota\.codex\workspaces\noir-phase1-runtime`。納品ソースはこのREADMEのある「美容室」フォルダです。

## 実装した体験

- HERO：同一モデルの8方向ターンテーブル、粒子形成、淡い光、短い「BE YOU.」のコピー。人物を直接ドラッグ／スワイプして回転可能。
- STYLE：8スタイル、矢印・左右スワイプ・矢印キー、GSAPによる切替。
- 360°：TOPとSTYLEのどちらも8方向。TOPは隣接フレームを混ぜて滑らかに表示し、リリース時は短い慣性で45°単位へスナップ。マウス・タッチ・左右キー・Homeキーに対応し、角度を共通stateへ保持。
- COLOR：8色。候補をTRYで比較し、APPLYで `selectedColor` と料金を更新。`selectedAngle` は維持。
- STYLIST：3名、得意分野、担当スタイル、指名予約。未設定のInstagramは準備中表示。
- MENU：6メニュー。スタイル・カラーのおすすめ施術とOPTIONを分け、料金・時間・指名料を自動計算。
- BOOKING：スタイル・カラー・担当・メニュー・金額・時間を表示。相談プランへ切替しても元の選択を保持。
- SALON：ネイティブdialog。Escape・背景・閉じるボタン、背景操作の無効化、フォーカスの復帰。元のモード・選択状態を保持。
- PCは常設サイドナビ、スマホは下部固定STYLE / COLOR / BOOK / MENU。MENU内にSTYLIST / MENU & PRICE / CONCEPT / SALONを配置。
- `prefers-reduced-motion` ではGSAPとCSSのアニメーションを無効化。

## URLと状態

`/`、`/concept`、`/style`、`/color`、`/stylist`、`/menu`、`/booking`、`/salon` に対応。

`/style/long-wolf` に直接アクセスするとWOLFが選択されます。他に `/style/long`、`/style/perm`、`/style/bob`、`/style/short`、`/style/bleach`、`/style/layer`、`/style/creative` に対応します。不明なURLは404です。

ルートは `src/app/[[...path]]/page.tsx` で検証・静的生成し、共通layout内のExperienceを維持します。Next.jsと連動するHistory APIでURLを変え、`usePathname` でブラウザの戻る・進む・直接アクセスに同期します。

選択はZustandとlocalStorage（`noir-selection-v2`）に保持します。HOME・SALON・他モード・再読み込みでも維持し、確認付きRESETで初期化します。料金と時間は復元時にもデータから再計算します。ブラウザ側で保存が拒否された場合は現在のタブのメモリ内で動作します。サーバー送信はしません。直接アクセスの明示的なスタイル・カラー・担当者指定は保存値より優先されます。ドラッグ案内はアプリ存続中の初回のみです。

## ファイル一覧と役割

```text
src/
  app/
    layout.tsx                  共通レイアウト・日本語設定・メタ情報
    [[...path]]/page.tsx         ルート検証・deep link・静的生成
    not-found.tsx               404とホーム導線
    globals.css                 配色・フォント・リセット・共通操作設定
    icon.svg                    サイトアイコン
  components/
    Experience.tsx              モードの表示分岐・URL同期・アクセント色
    experience.module.css       全画面のCSS Modules・レスポンシブ
    Hero/Hero.tsx               HERO
    Hero/HeroTurntable.tsx      TOPの8方向表示・ドラッグ・慣性・キーボード操作
    Hero/Concept.tsx            ブランドコンセプト
    Navigation/Navigation.tsx   PC・共通ヘッダー
    MobileNavigation/MobileNavigation.tsx  下部固定ナビ・メニューダイアログ
    StyleExperience/StyleExperience.tsx    スタイル切替・COLORモード
    HairViewer/HairViewer.tsx   画像シーケンス・ポインター操作・角度UI
    HairColorSelector/HairColorSelector.tsx  8色選択
    StylistExperience/StylistExperience.tsx スタッフと作品の紐づけ
    MenuPlan/MenuPlan.tsx       メニュー選択
    MenuPlan/PlanSummary.tsx    共通の選択内容・概算料金表示
    Booking/Booking.tsx         予約内容・相談・設定済み外部CTA／未設定時の案内
    SalonOverlay/SalonOverlay.tsx サロン情報・アクセス
    ui/Modal.tsx               共通dialog・フォーカス管理
    ui/Arrow.tsx               共通SVGアイコン
  store/useSiteStore.ts         選択状態・型・更新アクション
  data/
    hairStyles.ts              8色の定義・各8画像のパス
    styles.ts                  8スタイル・slug・写真・担当ID
    stylists.ts                3スタッフ
    menu.ts                    料金・所要時間・見積もり計算
  lib/
    constants.ts               モード・URL・角度数・ドラッグ間隔
    navigation.ts              モード遷移・SALON開閉
    preload.ts                 重複を避けた近接画像の先読み
    useMotion.ts               GSAP・reduced motion
public/
  images/hero.png               旧HERO／CONCEPT用の生成モデル写真
  images/hero-360/              TOP用の同一モデル8方向sprite・正面画像
  images/styles-v2/             8 STYLE固有の1024×1536px代表写真
  hair/{color}/01.webp–08.webp  8方向×8色、64枚のデモ画像
scripts/
  generate-hair.mjs             オリジナルSVGからWebPデモ素材を再生成
  inspect-browser.mjs           ローカル表示・コンソールの診断
  check-production.mjs          本番スモーク・縦スワイプ・320px・フォールバック
tests/experience.spec.ts        主要体験のブラウザテスト
playwright.config.ts           PC / Mobile / Tabletテスト設定
package.json                   依存関係・起動・検証スクリプト
pnpm-lock.yaml                 依存関係の固定
pnpm-workspace.yaml            同期ドライブ対応・依存ビルド許可
.npmrc                         旧pnpm向けの同等設定
tsconfig.json                  TypeScript strict
next-env.d.ts                  Next.jsの型参照
next.config.ts                 Next.js・ローカル開発origin設定
eslint.config.mjs              Next.js / TypeScript lint
.gitignore                     依存・ビルド・検証出力の除外
docs/ASSETS.md                  写真生成方式・プロンプト
docs/VALIDATION.md              検証記録
docs/screenshots/               PC・スマホの完成画面
```

Next.jsが起動時に生成する `AGENTS.md` / `CLAUDE.md` はフレームワークの開発者向け案内です。

## 画像の差し替え

STYLE COLLECTIONの代表写真は `public/images/styles-v2/` にLONG / WOLF / PERM / BOB / SHORT / BLEACH / LAYER / CREATIVEの8点を配置しています。すべて1024×1536pxのWebPで、STYLE通常表示、STYLIST作品カード、切替演出、STYLE別OGへ連動します。

代表写真を再制作する際は `styles-v3` のような新しいversionedディレクトリへ配置し、`styles.ts` とOG出力名を更新します。公開済みURLのブラウザ・SNSキャッシュに旧画像を残さないためです。

STYLE画面の360°用64枚は、提供された `hair_color_variations_64_images.zip` の8色×8方向のモデル画像です。TOPとは別モデルです。元画像は140〜141×125〜126px。一部に含まれる隣の行・白い区切り線を除去して共通の高さ100pxで切り出し、ロスレスWebPに変換しています。元ZIPは変更していません。元画像に起因する色間の構図差・拡大時の粗さは残ります。360° / COLOR / BOOKINGは現在この共通シーケンスを参照します。

TOPは `public/images/hero-360/turntable-v2.avif` / `.webp` の4列×2行spriteを使用します。順序は正面、右斜め前、右側面、右斜め後ろ、背面、左斜め後ろ、左側面、左斜め前です。差し替える場合は各マスを同じ正方形、人物の中心・大きさ・照明・衣装を固定してください。`front-v2.webp` はOpening粒子の生成元なので、正面を差し替えた後に `pnpm assets:particles` を実行します。

次のファイルを同じ名前の実写WebPで置き換えるだけで、ビューアーがそのまま動きます。

```text
public/hair/black/01.webp ... 08.webp
public/hair/ash/01.webp ... 08.webp
public/hair/silver/01.webp ... 08.webp
public/hair/blonde/01.webp ... 08.webp
public/hair/dark-brown/01.webp ... 08.webp
public/hair/beige/01.webp ... 08.webp
public/hair/red/01.webp ... 08.webp
public/hair/pink/01.webp ... 08.webp
```

| ファイル | 角度index | 向き |
|---|---:|---|
| 01.webp | 0 | 正面 / 0° |
| 02.webp | 1 | 斜め / 45° |
| 03.webp | 2 | 横 / 90° |
| 04.webp | 3 | 後ろ斜め / 135° |
| 05.webp | 4 | 背面 / 180° |
| 06.webp | 5 | 後ろ斜め / 225° |
| 07.webp | 6 | 横 / 270° |
| 08.webp | 7 | 斜め / 315° |

全カラーで同じモデル・カメラ位置・向き・切り抜き位置に統一してください。推奨は600×800以上の同一寸法。CONCEPT画像は `public/images/hero.png`、代表写真は `public/images/styles-v2/` と `src/data/styles.ts` の `image` / `position` を編集します。代表写真更新後は `pnpm assets:production` でSTYLE別OGも再生成します。

パスや拡張子を変える場合は `src/data/hairStyles.ts` を編集します。提供画像は `pnpm assets:import <展開済みhair_color_variations_64フォルダ>` で取り込み直せます。元のマネキン生成は `pnpm assets:demo` に残していますが、提供画像を上書きするため通常は実行しません。

## 読み込みとアニメーション

STYLE用64枚は一括ロードしません。現在のSTYLE・COLOR・ANGLEの画像を優先表示し、同色の前後1枚だけを先読みします。COLOR UIがある時だけ、使用可能な次の色の現在角度を1枚先読みします。TOPは8方向をまとめた約77KBのAVIF spriteを優先取得し、WebPへフォールバックします。画像領域の寸法は固定し、STYLE画像欠落時は共通の `public/images/placeholder.svg` を表示します。

カラー変更はopacity / blur / scaleで500ms、スタイル変更はopacity / x / scaleで500ms、モード変更は650ms。常時ループするアニメーションはありません。ドラッグ時の角度更新は即時です。

## WebGLとDOMの境界

描画の境界は `HairViewer/HairViewer.tsx` の画像領域です。DOM画像を常に残し、その上に `ColorComparison` の局所Canvasを重ねます。STYLEは `StyleFlow`、HEROは `HeroEffects` が担当します。

```ts
type HairRendererProps = {
  styleId: string | null;
  color: HairColor;
  angle: number; // 0–7
};
```

Zustand・ナビ・カラーパレット・プラン・予約・SALONはDOM側に残します。WebGL側はこの状態を購読して描画し、角度変更は既存の `setAngle` に返します。コンテキスト消失や低性能端末では画像レンダラーに戻せるようにします。

`style.hairImages[color][angle]` はスタイル別に差し替え可能です。Particle・GLSL Lens・Hair FlowをPhase 3で実装しました。実3D頭部モデル・予約APIは未接続です。WebGLから価格や推奨メニューを直接変更せず、既存のStoreアクションへ入力します。

## Hair Unwoven Gallery

HOMEのHERO直下に、写真が横方向の細いリボンへほどけ、次の写真へ組み上がる4作品のGalleryを追加しました。HEROとは独立した通常の縦スクロール領域で、既存のSTYLE一覧・詳細・COLOR・BOOKINGはそのまま利用できます。見出し、写真、作品情報、VIEW／BOOKはDOMに残し、Galleryが画面に近づいた時だけ装飾用Canvasをdynamic importします。新しいmodeやURLは追加していません。

### 4作品のデータと画像変更

`src/data/hairUnwovenStyles.ts` がGallery固有の表示情報を持ちます。`id` はGallery内の識別子、`styleId` は既存の選択・予約へ渡すIDです。Galleryのタイトルと予約対象のSTYLE名は次の対応です。

| Gallery id / タイトル | 既存styleId / STYLE名 | 使用画像 |
|---|---|---|
| `straight` / STRAIGHT | `long` / LONG | `/images/styles-v2/long.webp` |
| `wave` / WAVE | `perm` / PERM | `/images/styles-v2/perm.webp` |
| `bob` / BOB | `bob` / BOB | `/images/styles-v2/bob.webp` |
| `long` / LONG | `layer` / LAYER | `/images/styles-v2/layer.webp` |

写真を差し替える時は画像を`public/`以下に配置し、該当項目の`image`を変更します。同じ設定をDOM写真とWebGL Textureが参照します。既存の1024×1536px、2:3の代表写真と同程度の解像度・構図を基本に、頭頂・毛先に余白を確保してください。`title`／`description`で表示文、`focusY`でShaderの縦方向crop位置を調整できます。DOM fallbackのcropは`HairUnwovenGallery.module.css`の`.fallbackImage img`でも確認してください。予約対象を変更する場合は、`styleId`を`src/data/styles.ts`に存在するIDへ合わせます。

Galleryは代表写真の体験です。`hairImages`や既存の360°用64フレームは変更しません。STYLE／OGにも同じ写真変更を反映したい場合は、既存STYLE側の画像設定とOG生成手順も更新してください。

### Geometry・Shader・遷移

`ribbonGeometry.ts`が全リボンを単一のindexed `BufferGeometry`にまとめます。退場写真と入場写真の2つのmeshで同じGeometryを共有するため、リボン本数に比例した大量のmeshは作りません。Galleryの描画は2 draw callsを基本とし、Geometryはアンマウント時にdisposeします。

| 端末・Tier | リボン本数 | 各リボンの横分割数 | 遷移中の描画上限 |
|---|---:|---:|---:|
| Desktop High | 60 | 24 | 60FPS |
| Desktop Medium | 40 | 18 | 60FPS |
| Mobile / Tablet相当 | 28 | 14 | 45FPS |

属性`aRibbonIndex`／`aRandom`／`aBandUv`が、各帯の位置・決定的な揺らぎ・帯の縁を表します。Vertex Shaderで時差、横移動、波、緩い回転、pointerへの反応を計算し、Fragment Shaderで微かな色ずれ・ぼけ・縁の光・透明度を加えます。主なuniformは次のとおりです。

| uniform | 用途 |
|---|---|
| `uProgress` / `uDirection` / `uRole` | 進行度0〜1、左右の方向、退場／入場の役割 |
| `uTime` / `uMouse` | 波の時刻と滑らかに追従するpointer位置 |
| `uTexture` / `uTextureSize` | 描画する写真とその寸法 |
| `uResolution` / `uFocus` | 表示枠の寸法とcover crop位置 |
| `uQuality` | Tierに応じた色ずれ・ぼけの強さ |

GSAPが`power2.inOut`で進行度を駆動し、Highは1.42秒、Mediumは1.24秒で切り替えます。写真のTextureが揃ってから開始し、完了した`transitionId`だけを受け付けて作品情報を更新します。静止中はdemand render、遷移中だけ継続描画し、共通`WebGLExperience`で画面外・非表示タブ・SALON表示時の描画を停止します。GSAPも非表示タブとSALONに合わせてpause／resumeします。GLSLを変更したら`pnpm shaders`を実行します。`pnpm dev`／`pnpm build`でも`shaders.generated.ts`を自動更新します。

### 入力・選択・予約への引き継ぎ

PREVIOUS／NEXT、左右キー、横ドラッグ・スワイプ、wheelで作品を切り替えます。遷移中の追加操作は、最新方向1件だけをqueueに保持し、現在の遷移完了後に開始します。操作ごとにGeometryやGSAPを積み増しません。タッチ領域は`touch-action: pan-y`で、縦スワイプによるページスクロールを維持します。

Gallery内の鑑賞操作では予約Storeを変更しません。VIEWで`setStyle(styleId)`→`setViewerOpen(false)`→`go("style")`を実行し、`/style/{slug}`の代表写真へ移動します。BOOKは既存STYLEとの対応を`setStyle(styleId)`で反映した後、`setEditorialStyle(id)`→`go("booking")`で現在表示中の編集名も渡します。たとえばWAVEは施術計算上のPERMへ接続しつつ、BOOKING表示と予約文にはWAVEとして残ります。担当者・推奨施術・概算価格・時間が反映され、利用可能な選択カラー、ANGLE、OPTIONは既存ルールで維持します。非対応カラーは対象STYLEのdefaultColorへ変更します。

### FallbackとTexture管理

Reduced Motion／Save-Data／Low Tier／WebGL不可の場合はCanvasを使わず、DOM写真と同じ操作・VIEW／BOOKを利用します。通常のDOM切替は560ms、Reduced Motion時は動きを抑えて120msで状態を切り替えます。Texture取得失敗・Canvas／Shaderエラー・context loss時もDOMへ復帰します。

`TextureManager.ts`の`useTransitionTextures`は、次の2枚が両方ロードされるまで最後の有効なTextureペアを保持します。準備完了後にまとめて差し替え、それから以前の参照をreleaseするため、queue中のロード待ちで空のフレームを挟みません。世代tokenで古いリクエストの遅延結果を除外し、上限4件の`ResourceCache`で現在の参照を保護します。未使用Texture・不要になった遅延ロード・アンマウント時の資源をdisposeし、既存のCOLOR用`useManagedTextures`とは呼び出しを分けています。

### 追加ファイルとテスト

- データ：`src/data/hairUnwovenStyles.ts`
- Gallery：`src/components/sections/HairUnwovenGallery.tsx`、`HairUnwovenGallery.module.css`
- DOM情報・ナビ：`src/components/ui/StyleInfo.tsx`、`StyleNavigation.tsx`、`HairUnwovenUI.module.css`
- WebGL：`src/three/HairLoom/HairLoomCanvas.tsx`、`HairRibbonScene.tsx`、`ribbonGeometry.ts`、`hairRibbon.vert`、`hairRibbon.frag`
- 接続・共通処理：`Experience.tsx`、`TextureManager.ts`、`scripts/build-shaders.mjs`
- 回帰テスト：`tests/hair-unwoven.spec.ts`。desktop／mobile／tabletの各projectに登録し、logic projectとは分離しています。

追加テストは4作品の循環、左右キー、ホイール、マウスドラッグ、連続入力、全作品のVIEW／BOOK mappingと既存選択保持、Reduced Motion、WebGL不可、実タッチの縦横操作、遷移後のCanvas撤去とBack、SALON中の停止、resize、Texture上限、context lossを確認します。Gallery分だけ実行する場合は`pnpm exec playwright test tests/hair-unwoven.spec.ts`を使います。確認結果は`docs/VALIDATION.md`の「Hair Unwoven Gallery」に記録します。

## テスト

開発サーバーを別ターミナルで起動し、インストール済みGoogle Chromeで実行します。

```sh
pnpm dev
# 別ターミナル
pnpm test
```

Chromeがない場合は `playwright.config.ts` の `channel: 'chrome'` を外し、`pnpm exec playwright install chromium` を実行してください。別ポートは `TEST_BASE_URL` で指定できます。

PC 1440×1000 / Pixel 7相当のMobile / Tablet 820×1180で各28ケース、ロジック17ケース、計101ケースを実行します。最終結果は92成功・9対象外・失敗0です。対象外は別projectで実行済みのデスクトップ専用GPU診断またはタッチ専用入力です。スマホのスワイプはChromiumの実タッチ入力で再現し、Chrome／Edge／WebKit desktop、iPhone WebKit emulation、Android Chrome emulationでもページエラー0・axe違反0を確認しています。iOS／Android実機でのGPU性能と物理タッチは公開後の最終確認対象です。

## 参考

実装は同梱Next.jsドキュメントと[公式インストールガイド](https://nextjs.org/docs/app/getting-started/installation)を確認しています。[開発origin設定](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins)はlocalhost / 127.0.0.1のみ許可しています。

## Phase 2で追加した機能

- STYLEに紐づくVIEW STYLISTと、選択美容師のWORKSからSTYLEへ戻る双方向の導線。
- カラー互換性。別STYLEで使用可能なら現在色を保持し、非対応ならdefaultColorへ切替。角度は維持。
- STYLEのrecommendedMenusとCOLORの必要施術を統合し、おすすめ／追加メニューを分離。
- 指名料込みのestimatedPrice、メニュー時間を合算したestimatedTime。
- BOOKINGの選択画像、STYLE / COLOR / STYLIST / MENUそれぞれのCHANGE。
- LINE予約文のプレビュー／コピーと、未選択でも利用できるCONSULTATION。
- PCのYOUR SELECTION、MENU／BOOKINGの確認付きRESET。
- localStorageによる復元、URL連携、最新選択を失わないBack／Forward。
- 不明IDや破損した保存値の検証、共通画像プレースホルダー。

### データ構造

`src/data/styles.ts` が型 `HairStyle` を公開します。

```ts
type HairStyle = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  stylistId: string;
  recommendedMenus: string[];
  estimatedPriceFrom: number;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  availableColors: HairColor[];
  defaultColor: HairColor;
  heroImage: string;
  hairImages: Record<HairColor, string[]>;
  // Phase 1互換：detail / tags / image / positionも維持
};
```

`Stylist` は `src/data/stylists.ts`。id / slug / name / role / specialties / instagram? / image / styleIds / nominationFee? を持ちます。`styleIds` はSTYLEのstylistIdから生成し、作品一覧との不整合を防ぎます。

`MenuItem` は `src/data/menu.ts`。id / name / priceFrom / durationMin / description? / ja を持ちます。COLORに必要なメニューは `src/data/colorMenus.ts` の `colorMenuRequirements` で管理します。

`src/lib/selection.ts` の `Selection` が、選択内容と導出値の共通型です。

- selectedStyleId / selectedColor / selectedAngle / selectedStylistId
- optionalMenus：ユーザーが明示的に追加したメニュー
- recommendedMenus：STYLEとCOLORから計算
- selectedMenus：上記2つの重複なしの集合
- estimatedPrice / estimatedTime `{ min, max }` / nominationFee
- colorChosen：STYLE未選択時の初期BLACKと、明示的なカラー選択を区別
- consultation：選択を残したまま相談予約文へ切り替えるフラグ

### STYLEの追加

1. `styles.ts` の `baseStyles` にid / slug / name / stylistId / detail / tags / image / positionを追加。
2. `defaults` に同じ並びでdefaultColorを追加し、同ファイルのマッピングでavailableColors / recommendedMenusを設定。defaultColorはavailableColorsに含めてください。
3. `hairImages` にSTYLE専用の8色×8方向を設定。現状は共通デモを参照します。
4. 対応する画像をpublicへ配置。heroImageは基礎データのimageから引き継ぎます。
5. `pnpm test` と `pnpm build` を実行。ルートと担当者のstyleIdsはデータから自動生成されます。

WOLFの正式idは `long-wolf`。Phase 1の旧id `wolf` はstyleByIdで互換解決します。選択中と同じSTYLEを再度表示しても、手動変更した担当者・OPTIONを上書きしません。別STYLEを明示的に選んだときに、そのSTYLEの担当者へ更新します。

### COLORの追加・変更

1. `hairStyles.ts` のhairColorsにid / name / ja / hex / accentを追加。HairColor型と画像パスが追従します。
2. `colorMenus.ts` に必要施術を設定。UI内にはSILVERなどに関する条件を書きません。
3. `styles.ts` のavailableColors／defaultColorを設定し、8方向の画像を配置。

現在の例：SILVER / BLONDE / BEIGE / PINKはBLEACH＋COLOR、その他はCOLOR。BOB / PERMはBLACK / ASH / DARK BROWN / BEIGEのみ利用可。制限はすべてデータ側で変更できます。

### STYLISTの追加

`stylists.ts` のpeopleにid / name / role / specialties / nominationFeeを追加。slugはidから生成されます。プロフィール画像を `public/images/stylist-{id}.svg` へ配置するか、マッピングのimageを撮影写真のパスへ変更します。任意でinstagramに正式URLを設定。担当STYLEのstylistIdもそのidにします。指名料0または未設定なら加算しません。

### MENUの追加

`menu.ts` のmenusに一意のid / name / ja / priceFrom / durationMinを追加。OPTIONに自動で表示されます。必須にしたい場合はSTYLEのrecommendedMenusまたはcolorMenuRequirementsにidを追加してください。

### 価格と時間の計算

純粋関数 `reconcileSelection` に集約しています。StoreはSTYLE・COLOR・STYLIST・OPTIONの変更時に、この関数で選択と導出値を一度に更新します。画面・GSAP側で金額を計算しません。

```text
recommendedMenus = STYLE推奨 ∪ COLOR必要施術
selectedMenus = recommendedMenus ∪ optionalMenus
estimatedPrice = selectedMenusのpriceFrom合計 + nominationFee
estimatedTime.min = selectedMenusのdurationMin合計
estimatedTime.max = min + timeBufferMin（現在30分、未選択時は0）
```

同じ施術を二重計上しません。おすすめはチェック済みで表示し、直接削除せずSTYLE / COLORから変更します。色変更で不要になった自動BLEACHは外れますが、ユーザーがOPTIONとして明示的に追加していたBLEACHは残ります。OPTIONは再タップで削除できます。

例：WOLF＋SILVER＋TAKUYAはCUT 5,500＋COLOR 8,800＋BLEACH 15,000＋指名料1,100＝30,400円〜、270〜300分。TREATMENTを追加すると34,800円〜、300〜330分。BLACKへ変更すると自動BLEACHが外れ、TREATMENTは残って19,800円〜、180〜210分になります。すべてダミーの参考価格・時間で、正式な予約枠ではありません。

STYLEのestimatedPriceFrom / estimatedTimeMin / estimatedTimeMaxは、そのSTYLEの初期メニューとデフォルト色の参考値（指名料を除く）です。実際のプラン表示はStoreの計算結果を使用します。

### 予約文生成

`lib/createBookingMessage.ts` の `createBookingMessage(state)` は副作用のない関数です。データからスタイル名・カラー名・担当者名・メニュー名を解決して日本語テキストを返します。STYLE未選択またはconsultation=trueなら `スタイルについて相談希望です。` を返します。

BOOKINGで生成文を確認・コピーできます。URLが設定されていればLINE / WEB予約先へのリンクを表示し、未設定なら従来のメッセージ確認と準備中案内へ戻ります。`lib/bookingUrl.ts` が日本語と改行をエンコードします。設定方法はPhase 4の項を参照してください。

### URL / Deep Linkの仕様

| URL | 直接アクセス時 |
|---|---|
| `/style/long-wolf` | long-wolfを選択。初回はASHとTAKUYA。互換性がある保存済みカラーは維持 |
| `/color?style=long-wolf&color=silver` | 指定STYLEと使用可能な指定COLORを適用 |
| `/stylist/takuya` | TAKUYAを選択し、その作品のみ表示 |
| `/booking` | 保存中の選択からプランと予約文を表示 |
| `/salon` | オーバーレイ。直接来た場合の閉じる先はHOME |

- ANGLE・メニュー・料金をURLへ含めません。
- UIからモード移動するとpushState。画面内の選択更新はreplaceStateで現在URLに反映し、カラー操作ごとに履歴を増やしません。
- ドキュメントを直接開いた時だけURLの選択を適用します。Back／Forwardではモードを戻し、最新選択を過去のqueryで上書きしません。戻ったURLは現在選択に合わせて整えます。
- SALONの開閉では履歴を対にし、閉じる時は元のモードに戻ります。
- 不明なSTYLE／STYLISTのパスは404。不明なqueryや非対応カラーは無視し、安全な現在色／デフォルト色を使用。
- RESET後は空プランを保存。同じブラウザで再読み込みしても選択は復活しません。その後、明示的なdeep linkを開いた場合は新しい選択として適用します。

### Phase 2の主な追加ファイル

`data/colorMenus.ts`、`lib/selection.ts`、`lib/createBookingMessage.ts`、`components/SelectionSummary/SelectionSummary.tsx`、`components/ResetSelection/ResetSelection.tsx`、`components/ui/SafeImage.tsx`、`public/images/placeholder.svg`、スタッフ用SVG3枚、`tests/selection.spec.ts`。既存のStore・各画面・ナビゲーション・ルート・ブラウザテストも拡張しています。

## Phase 3：WebGL体験

### コンポーネントとShader

| 実装 | 役割 |
|---|---|
| `three/WebGLExperience.tsx` | 局所Canvas、WebGL Error Boundary、context loss / shader error処理、可視性によるframe loop停止 |
| `three/*/*Canvas.tsx` | 用途別に分割したR3Fシーンの遅延読み込み境界。MENU・BOOKINGにはCanvasを置かない |
| `ParticleHead/ParticleHead.tsx` | seeded簡易頭部サンプラー、Points / BufferGeometry / ShaderMaterial |
| `ParticleHead/particleHead.vert` | randomPosition → targetPosition → hairPositionをuniformで補間、微細な漂いと狭い範囲の反発 |
| `ParticleHead/particleHead.frag` | 小さなソフト粒子。selectedColorに応じて控えめに色を変える |
| `HeroEffects.tsx` | 初回セッションのOpening、SKIP、写真ready後のクロスフェード、PC最大8px/6pxの移動 |
| `AmbientParticles` | 同じ粒子実装を少数・低opacityで再利用。Opening中と同時にCanvasを増やさない |
| `ColorComparison.tsx` | CURRENT / TRY比較。PCはLens、タッチ端末・Low・失敗時はDOMスライダー |
| `HairLens/hairLens.frag` | uCurrentTexture / uTryTexture、uMouse、uRadiusでレンズマスク。ごく小さい境界屈折と白いハイライト |
| `HairTransition/transition.frag` | uTexture1 / uTexture2、uProgress / uDirection / uResolutionによる750msの髪の流れ。顔中央の歪みを抑制 |
| `LightSweep/LightSweep.tsx` | DOM fallbackの850ms CSSスイープ。GPUレンズではhairLens.fragのuSweepが同じ一度の光を担当 |
| `shaders/plane.vert` | 比較・遷移共通のスクリーンUV。`noise.glsl` は微小な流れ、`utils.glsl` は画像のcontain/cover計算 |
| `VisualEnhancements.tsx` | 初期品質判定・PCだけの小型カーソル（DRAG / VIEW / TRY / BOOK） |

ShaderはReact内の長い文字列にせず `.vert` / `.frag` / `.glsl` を正本としています。`pnpm shaders` で `shaders.generated.ts` を生成します。dev / buildでも自動生成します。開発中にShaderを編集した場合は `pnpm shaders` を再実行してください。生成TSを直接編集しません。Turbopack / webpack専用ローダーへの依存はありません。

### Openingと状態の責務

`sessionStorage.noir-opening-portrait-v4` で初回HOMEのみ人物形成を再生します。TOPターンテーブルの正面画像から輪郭・顔・髪を優先して採った点群が、左右の髪先から曲線を描いて1.75秒までに人物へ収束します。輪郭の発光を挟み、2.15〜3.2秒でぼけた下絵から同じ位置の写真へ移ります。再生時間は描画準備後3.25秒。スマホは700点以下でも人物を読めるLOD順と薄い写真の段階的な重ね合わせを使います。右下の↻ボタンで再生可能、SKIPは常にDOMボタンです。Deep Link・reduced-motion・Save-Dataでは省略します。点群とCanvasの準備が1.8秒を超える場合は写真へ退避します。失敗した準備を再生済みとして記録せず、次の訪問で再試行できます。

`pnpm assets:particles` が `public/images/hero-360/front-v2.webp` から `public/data/hero-particles.json`（6,000点、約207KB / gzip約54KB）を生成します。正面画像の差し替え時に再生成してください。Openingは写真に一致する2D点群で、回転表示は8方向の実画像spriteです。GLBによる連続的な3D人物モデルではありません。

`previewStore.ts` は永続化しない比較用ドラフトです。色を試すだけでは selectedColor・料金・URL・予約文を更新しません。APPLYが既存 `setColor` を一度呼び、選択を即時確定します。続く850msの拡大・光・画像置換は演出だけなので、途中でBOOKを押しても最新の選択を取得できます。ANGLEはAPPLYの入力に含めません。STYLE / 確定色の変更時には古い候補を破棄します。確定した状態のlocalStorage保存、Back、RESETはPhase 2の仕組みを維持します。

### Performance Tier

| Tier | DPR上限 | Opening粒子 | 比較 / STYLE |
|---|---|---|---|
| High | 1.5 | PC 6,000 | full lens / 750ms flow |
| Medium | 1.25 | PC 3,000 / Mobile 700 | noise 40% / 軽いflow。タッチ端末はDOM比較 |
| Low | 1 | PC 1,000 / Mobile 400 | DOM before/after / GSAP crossfade |

人物形成の完了後はOpening Canvasを破棄します。Postprocessing・Bloomは写真の色と軽さを優先して全Tierで省略しています。初期判定はCPU論理コア・画面サイズ・DPR・pointer種別。2コア以下はLow、タッチ端末・8コア未満・大きなpixel budgetはMedium、それ以外はHigh。

3秒窓×2回、継続的に30FPSを下回ると、まず粒子の描画数を65%へ削減し、次にMediumへShader品質を下げ、最後にLowでレンズを解除します。リロードや選択リセットは行いません。250ms超の休止をFPS判定から除外。毎フレームのVector/Color/Texture生成やReact setStateは行いません。

document.hidden、IntersectionObserverで画面外、SALON表示中はR3Fのframeloopをneverにします。復帰時は再開。コンテキストを失ったCanvasはDOMへ退避して破棄し、そのまま予約へ進めます。モードの再入場で新しいCanvasを作れます。

### Fallbackとスマホ

- WebGL2不可・Canvas作成失敗・Shaderコンパイル失敗・context loss：DOM画像と操作を残す。
- Lensのテクスチャ読込失敗：DOM比較へ切替。画像自体がない場合はSafeImageのplaceholder。
- スマホ：レンズ追従・HERO移動・カスタムカーソルなし。比較はrange inputでキーボードにも対応。
- 360°は既存の横ドラッグ、比較sliderは独立した操作領域。イベント伝播を止め、角度操作へ混入させない。縦スクロールはpan-yを維持。
- TOPの360°も横方向を確定するまでpointer captureせず、縦操作をページスクロールへ渡す。選んだ角度はSTYLE / COLORの `selectedAngle` に引き継ぐ。
- reduced-motion：粒子とHERO移動なし、レンズ歪みなし、画像の短い切替、Light Sweepなし。
- BOOKING / MENU / SALONはDOM中心。WebGLエラーを予約のエラーへ伝播させない。

### GPU Texture管理

Phase 4では `TextureManager.ts` と `lib/resourceCache.ts` が現在・候補の2枚を保護し、直近の画像を含めて最大4枚を保持します。再利用時はロードを省略。上限を超えた未使用画像、遅れて完了した不要ロード、アンマウント時の全画像をdisposeします。全64枚のGPU常駐や無制限cacheは使いません。Canvasの `data-textures` を反復操作の回帰テストに使用します。

### 提供された64枚の扱い

silver_white → silver、ash_gray → ash、blond → blonde、dark_brown → dark-brown、milk_tea_beige → beige、red → red、blue_black → black、pink → pink。01正面、02右斜め前、03右側面、04右斜め後、05背面、06左斜め後、07左側面、08左斜め前の順です。取り込み処理・クロップ値は `scripts/import-hair-assets.mjs` に明記。髪の色を生成し直す処理や高解像度の捏造は行っていません。

### Phase 4で改善する点

1. STYLE代表写真8点は高解像度化済み。360° / COLOR / BOOKINGをSTYLE別にする場合は、実作品ごとに同一カメラ・照明・位置で撮影した8方向×使用可能色を用意し、現在の共通シーケンスを置き換える。
2. TOP人物形成は写真からの点群へ置換済み。今後、本物の3D回転が必要な場合はGLBと髪領域マスクを用意する。
3. 実機iPhone Safariで長時間操作・メモリ圧迫・タブ復帰を計測する。今回のモバイル検証はChromeのタッチ端末エミュレーションであり、実機Safari確認の代替ではない。
4. 端末別の実測からFPS閾値・画像解像度・Tier判定を調整。必要になった時だけ圧縮GPU textureや軽いpostprocessingを検討する。
5. 実際のLINE / 予約API・スタッフ写真・サロン写真・正式な料金へ接続する。

## Phase 4：公開準備と運用

### 現在の公開状態

GitHubとVercelへ公開済みです。公開URLを設定し、デモサロン名はNŌIRとしています。実店舗の住所・電話・予約URLは未設定です。`indexable` の条件を満たすまでrobotsはnoindex / Disallow、sitemapは空、HairSalon / PersonのJSON-LDは出力しません。未設定項目は準備中と表示します。BreadcrumbListは各ページに出力します。実店舗運用に向けた残件は [最終確認・未完了項目](docs/FINAL_REVIEW.md) を参照してください。

### 環境変数・店舗情報

`.env.example` を `.env.local` にコピーし、実データを入力してください。`NEXT_PUBLIC_` は公開情報専用で、ブラウザへ含まれます。APIキーや秘密情報を置きません。変更後は再ビルドが必要です。

| 変数 | 用途 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | HTTPSの公開origin。canonical / OG / sitemapの基準 |
| `NEXT_PUBLIC_SALON_NAME` | サロン名。Header・Footer・SALON・Metadataの共通値 |
| `NEXT_PUBLIC_ADDRESS`, `POSTAL_CODE`, `LOCALITY`, `REGION`, `PHONE`（すべてNEXT_PUBLIC_接頭辞） | 店舗住所・郵便番号・市区町村・都道府県・電話 |
| `NEXT_PUBLIC_OPENING_HOURS`, `CLOSED`, `PARKING`, `PRICE_RANGE`（同上） | 営業時間・定休日・駐車場・価格帯 |
| `NEXT_PUBLIC_LINE_BOOKING_URL`, `NEXT_PUBLIC_WEB_BOOKING_URL` | 外部予約先 |
| `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_GOOGLE_MAP_URL`, `NEXT_PUBLIC_GOOGLE_BUSINESS_PROFILE_URL` | SNS・地図・GBPへのリンク |
| `NEXT_PUBLIC_SALON_VERIFIED=true` | データ・スタッフ・料金・素材を実店舗情報として確認済みにする |
| `NEXT_PUBLIC_SITE_PUBLISHED=true` | 検索公開の意思を設定する |

`src/config/site.ts` が単一の設定元です。logo / imageもこのファイルで変更できます。検索公開は両フラグに加え、公開HTTPS URL・住所・電話・予約URLの入力が必要です。サイト内NAPとGoogle Business Profile側の実データを同じ表記へ揃えてください。GBPアカウントへの書き込みは行っていません。

営業時間はSchema.orgの曜日・時刻表記を利用します（例 `Mo-Fr 11:00-20:00`）。複雑な営業時間は `openingHoursSpecification` への拡張を推奨します。[Schema.orgの形式](https://schema.org/openingHours)を参照してください。

### 予約URL

LINEの推奨設定は `https://line.me/R/oaMessage/@YOUR_ACCOUNT/`。`createLineBookingUrl` がアカウントIDと生成文をpercent-encodeします。STYLE・COLOR・STYLIST・MENUは既存のstateから取得し、未選択なら相談文になります。HTTPS以外や認証情報入りURLは無効として扱います。

公式URLはトーク画面の入力欄に予約文を用意するもので、自動送信や予約確定はしません。ネイティブLINE起動はiOS / Androidでの実機確認が必要です。PC側は予約文コピーとWEB予約を併設しています。[LINE公式仕様](https://developers.line.biz/ja/docs/messaging-api/using-line-url-scheme/)を参照してください。一般URLでは `text` queryを付ける構造ですが、受け取り側が対応するかは予約先ごとに確認してください。短縮リンクでは本文引き継ぎを保証しません。

URL未設定時は送信せず、生成文確認・コピー・準備中案内を表示します。LINE / WEBリンククリックのイベントと予約完了は別の指標です。

### SEO / Structured Data

`lib/seo.ts` がHOME・STYLE一覧／詳細・STYLIST詳細・MENU・SALON等のtitle / description / canonical / Open Graph / Twitter Cardを生成します。直接URLのHTMLに出力し、History APIでのモード移動でもDOM内Metadataを同期します。COLOR queryやANGLEをcanonicalへ持ち込みません。BOOKING / COLORは検索公開後もnoindexです。

`ServerContent.tsx` がSTYLE名・説明・担当・カラー・参考価格・メニュー・店舗情報をServer Renderします。JavaScriptなしでも主要情報と内部リンクを読めます。初期表示で別モードのHEROを挟まず、JS準備後に既存の操作UIへ切り替わります。不明なURLは404を維持します。

HairSalon（LocalBusinessのサブタイプ）・必要なPerson・BreadcrumbListをJSON-LDに出力し、`safeJsonLd` でHTML終端を無害化します。実在しない所在地・レビュー・星評価は生成しません。構文とSSRを自動検証していますが、GoogleのRich Results Testによる公開URL検査は公開後に行ってください。

各STYLEの `ogImage` で個別OG画像を指定できます。現在の8STYLEはSNS側の旧キャッシュを避けるため `/og/{slug}-v2.jpg`、共通は `/og/salon.jpg`。1200×630の9画像を生成済みです。サロン名・画像・STYLE追加後は `pnpm assets:production` を実行し、必要ならスクリプト内OG対象を追加してください。

### 画像追加・形式・先読み

既存のSTYLE / COLOR / STYLIST / MENU追加方法は上のデータ編集手順を引き続き利用します。画像置換後は `pnpm assets:production` で画像variantと `data/imageManifest.json` を生成してください。

- 360°DOM画像はpictureによるAVIF → WebP → JPEGの形式選択。読込失敗時は共通placeholder。
- 360°素材は96 / 320 / 640 / 1024 / 1600を元画像幅で上限処理。現在の360°素材は約140pxなので96pxと原寸だけです。Tablet / Desktop向けに架空の高解像度variantを作りません。
- STYLE代表写真はWebGL切替・予測先読みと同じ圧縮済みWebP URLを使い、二重取得を避けます。TOPはAVIF / WebP sprite、CONCEPTはNext Imageで配信します。
- 現在角度→近接±1→操作が2.5秒止まった時だけ現在色の残り角度を先読みします。TRYはユーザー操作時に優先。次候補は1枚だけで、他色全体をロードしません。
- Save-Data / 2Gでは予測先読みと重いHEROを止め、Lowを選択。通常通信の予測URL記録も32件までです。
- 画像が遅い間はplaceholderを表示し、BOOK操作をブロックしません。

### 性能・描画・安定性

`ParticleCanvas` / `LensCanvas` / `TransitionCanvas`を独立したdynamic importへ分割しました。BOOKING・STYLIST・MENU・SALONも必要時に読み込み、ナビゲーションのhover / focusで先読みできます。従来の `Scenes.tsx` 一括入口と未使用のdrei依存を削除しました。読み込み中は案内を表示し、画面データの取得失敗時は再読み込みから復旧できます。先読みの失敗は操作を妨げません。

Canvasはdemand方式。レンズはpointer変化・追従中・APPLY中、画像flowは遷移中だけinvalidateします。停止中にフル速度で描画しません。人物形成中だけ最大60FPS、終了後はCanvasを破棄。SALON・非表示タブ・画面外では停止します。有限のGSAPだけを使い、cleanupでtweenとlistenerを解除します。カスタムカーソルもタッチ端末では描画しません。

モバイルはMedium / Lowから開始し、DPR最大1.25、Opening粒子最大700、Lowは400。postprocessingなし、比較はDOM range。PCの人物形成は6000 / 3000 / 1000点です。FPS適応は意図的な30FPS制限と負荷による遅延を区別します。

Textureは最大4件のLRU。current / tryを保護してrecentを再利用し、未使用・上限超過・失敗・アンマウントを処理します。GLSLコンパイル失敗とcontext lossではCanvasだけを破棄してDOMへ移行します。

Webフォントはnext/fontで自己配信し、実行時Google Fonts CSS取得を廃止。Barlow Condensedは300 / 400 / 500、DM Sansはvariableを使用。build時のフォント取得にはネットワーク接続が必要です。

### 改善前後の計測

ローカル本番ビルド、Chrome、40ms latency / 10Mbps、モバイルはCPU 4倍スロットリング。`docs/audit/before.json` と `after.json` に生データ、`pnpm audit:performance` に再計測手順があります。1回ずつのラボ計測で、実ユーザーのp75やフィールドINPではありません。

| 項目 | Phase 3 | Phase 4計測 |
|---|---:|---:|
| Desktop LCP | 920ms | 1000ms |
| Mobile相当 LCP | 876ms | 928ms |
| Desktop CLS | 0.00064 | 0 |
| Mobile相当 CLS | 0 | 0 |
| 操作event durationの最大値（Mobile相当） | 240ms | 208ms |
| HOMEで5.5秒までに受信したJS（encoded body） | 427,654 bytes | 431,271 bytes |

操作応答は約13%短縮。LCPの2.5秒・CLSの0.1目標はこの環境で満たします。操作時間は目標200msをわずかに超えており、フィールドINP達成とは断定しません。SEO・設定・画像manifestの追加で総JSは0.8%増えました。分割による依存分離と停止中GPU負荷削減を、転送量そのものの減少として表現しません。

| 監査結果 | 対応 / 検証 |
|---|---|
| High：初期ルートとSSRの主題が不一致、ページ別Metaなし | ServerContentとgenerateMetadata。No-JSとHTMLレスポンスで確認 |
| High：設定不能な予約CTA、仮NAPの分散 | 共通config・外部リンク・未設定fallback。URL encodingと生成リンクをテスト |
| Medium：常時Canvas / 使っていないPreload | demand / 30FPS / dynamic import。context loss・hidden・反復操作で検証 |
| Medium：画像・外部フォント | picture variant / next/font。LCP・CLSと低速読込を検証 |
| Medium：GPU画像を即破棄し再読込 | 4件のLRU。pin・eviction・遅延完了dispose・実GPU枚数を検証 |
| Low：計測接続箇所が未整備 | 型付きnoop analyticsを追加。例外が予約を止めないことを検証 |

### Analytics

`lib/analytics.ts` の `configureAnalytics(sink)` に同意管理済みのGA4等アダプターを接続します。既定はnoopで、外部通信・ユーザーID・入力個人情報の収集はありません。失敗してもUIへ例外を伝播させません。

イベント：`style_view`, `style_select`, `hair_rotate`, `color_try`, `color_apply`, `stylist_view`, `stylist_select`, `menu_view`, `booking_open`, `booking_line_click`, `booking_web_click`, `salon_open`。Store購読を `selectionAnalytics.ts` に集約し、color_apply → booking_open → booking_line_clickをstyleId / color / stylistId / menusで比較できます。`configured:false` は未設定CTAなので実コンバージョンから除外してください。

### QA・公開手順

1. `.env.local` とSTYLE / STYLIST / MENUを実データへ変更。NAPをGBPと照合し、写真と料金を確認。
2. `pnpm assets:production`、`pnpm typecheck`、`pnpm lint`、`pnpm build`。
3. 別ターミナルで `pnpm start`。テストの `TEST_BASE_URL` を実行ポートへ向け、`pnpm test` / `pnpm qa:browsers`。
4. Next.js対応Nodeホスト（Node 24）に同じ環境変数を設定。install → build → startを実行。Vercel等を使う場合もNext.js preset・同じ環境変数を使用。
5. Preview URLでは検索非公開のまま動作確認。正式情報確認後にverified / publishedをtrueで再ビルドし、正式ドメイン・HTTPS・canonicalを確認。
6. 公開URLでrobots / sitemap / OG、Search Console、Rich Results Test、実機LINE・WEB予約先を確認。ネイティブLINEは入力内容を確認して送信し、予約完了は予約先で確認。

Chrome / Edge / WebKit Desktop / iPhone WebKit相当 / Android Chrome相当で主要導線を確認し、axeのWCAG 2 A/AA・2.1 AA検査は各主要モードで違反0。390 / 430 / 768 / 1024 / 1440 / 1920pxの横overflowを確認。ネイティブdialogのフォーカス・Escape、safe-area-inset-bottom、reduced-motion、画像失敗、Save-Data、WebGL失敗、ブラウザBackも検証しています。`pnpm audit --prod` は実行時点で既知の脆弱性0件。

Safari本体・実機iPhone・実機Android・OSによるメモリ圧迫・ネイティブLINE起動は、このWindows環境では保証できません。WebKitエミュレーションとの違いを残さず報告します。Three.js / R3F由来のClock非推奨警告は依存側に残ります。画像は元解像度・構図差の制約があります。公開ドメインの実測CWVと予約完了率は公開後に計測してください。

### Phase 4追加ディレクトリ

`src/config/site.ts`、`lib/seo.ts`、`components/ServerContent.tsx`、`components/RouteMetadata.tsx`、`app/robots.ts`、`app/sitemap.ts`、`lib/bookingUrl.ts`、`lib/analytics.ts`、`lib/selectionAnalytics.ts`、`lib/modeModules.ts`、`lib/resourceCache.ts`、`hooks/useReducedData.ts`、`components/ui/HairImage.tsx`、`data/imageManifest.json`、`three/*/*Canvas.tsx`、`public/og`、`tests/production.spec.ts`、`scripts/prepare-production-assets.mjs`、`scripts/qa-browsers.mjs`、`scripts/audit-performance.mjs`、`.env.example`。
