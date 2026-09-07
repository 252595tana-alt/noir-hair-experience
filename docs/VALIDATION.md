# Phase 1 検証記録

2026-09-05 / Windows / Node.js 24.19.0 / Next.js 16.3.4 / Google Chrome。

同一ソースのローカル検証コピーで実施。納品先のGoogle Driveフォルダでも依存関係インストール・TypeScript・ESLint・本番ビルドの成功を確認。本番起動は検証コピーのlocalhost:3001。

| 確認 | 結果 |
|---|---|
| TypeScript strict / tsc --noEmit | 成功 |
| ESLint | エラー0・警告0 |
| next build | 成功・静的ページ生成 |
| Playwright PC / Mobile / Tablet | 15/15成功 |
| HERO画像・コピー | PC / Mobileのスクリーンショット確認 |
| STYLE横切替・deep link | 矢印・タッチ・直接URLから確認 |
| 360° Viewer | マウスドラッグ・実タッチ入力・矢印キー・8角度・ループ |
| 8色切替 | 角度05のまま全8色へ変更 |
| MENU → BOOKING | WOLF / SILVER / TAKUYA / CUT + COLORを保持 |
| 見積もり | ¥14,300〜 / 150–180分を確認 |
| SALON | 開閉・Escape・URL復帰・色と角度保持・フォーカス復帰 |
| URL | 全対応パス200・不明なスタイル404・ブラウザ戻る |
| レスポンシブ | 1440×1000 / Pixel 7 / 820×1180で横はみ出しなし |
| reduced motion | 動きを減らした状態で全ルート表示・操作 |
| 初期画像取得 | COLOR画面で最大5URL以内・全64枚を一括取得しない |
| 本番起動 | localhost:3001で動作確認 |
| 小画面 | 320px幅で7ルートの横はみ出しなし |
| 縦スワイプ | ビューアー上でも通常スクロールが動き、角度は変化しない |
| 読み込み失敗 | フレーム取得を中断するとHERO画像へ復帰 |

修正した問題：タッチの暗黙的なpointer captureが子要素からビューアーへ移る際、子からバブルするlostpointercaptureでドラッグ状態が消える問題を修正。ビューアー自身が捕捉を失った場合だけ状態をリセットする。

外部予約・SNS・Google Mapは未接続で、準備中と表示します。実写64枚・実スタッフ・正式料金への差し替えは未実施。iOS実機での試験は実施していません。

# Phase 2 検証記録

2026-09-05。Phase 1の画面・レスポンシブを維持し、状態連携を追加。

- TypeScript strict / ESLint：エラー・警告なし。
- 本番ビルド：22静的ページを生成。STYLEおよびSTYLISTのdeep linkを含む。
- ブラウザ21テスト（PC・Mobile・Tablet各7件）＋ロジック3テスト＝24件。
- 旧Phase 1のドラッグ、実タッチスワイプ、8方向、角度ループ、キーボード、初期画像取得数を回帰確認。
- 画像未取得時は共通placeholderへ復帰。localStorageの不正ID・色・角度・メニューを検証して復元。

| 要件の確認順 | 検証した動作 |
|---|---|
| 1–3 | WOLFを選択、SILVERへ変更、ANGLE 05を選択 |
| 4–5 | TAKUYAへ移動し、TAKUYA’S WORKSからWOLFへ復帰 |
| 6–9 | MENUへ移動、TREATMENT追加で34,800円・300–330分に更新 |
| 10–11 | BOOKINGにWOLF / SILVER / TAKUYA / 4施術とsilver/05画像を表示 |
| 12–15 | CHANGE COLORからBLACKへ変更。自動BLEACHが外れ、19,800円・180–210分に更新 |
| 16–17 | SALON開閉・HOME往復・再読み込み後も選択を保持 |
| 18 | Back／ForwardでSTYLE↔COLOR↔STYLISTの画面だけを移動、最新選択を維持 |
| 19 | /style/long-wolf、/color?style=long-wolf&color=silver、/stylist/renを直接表示 |
| 20 | RESETをキャンセルして保持、確認後だけ初期化、再読み込み後も初期状態 |

追加：BOBへ移動すると非対応のSILVERをBLACKに置換し角度は維持。YUKIからRENへ指名変更すると指名料が550円下がる。OPTIONはSpaceキーで追加・削除可能。相談だけの場合も予約文を生成。未接続のLINE／WEBへ送信しない。

価格は6メニューと指名料のデモ設定による値。iOS実機Safariでの検証、実予約APIへの接続、撮影写真への差し替えは含まない。
# Phase 3 検証記録（2026-09-05）

- 納品元：Google Drive内の美容室フォルダ。実行コピー：`C:\Users\syota\.codex\workspaces\noir-phase1-runtime`。
- TypeScript strict / ESLint：エラーなし。本番 `next build`：22ページ静的生成成功。
- 本番サーバー `http://localhost:3001` でPlaywright 43ケース：39成功、4件はモバイルで使用しないGPUレンズ専用テストのため対象外。
- Phase 2の24ケースを維持し、カラー確定の操作だけAPPLYへ更新。STYLE・COLOR・ANGLE・担当・メニュー・金額・時間・CHANGE・予約文・SALON・Back・Deep Link・RESET・画像エラーを確認。
- TRYだけでは確定色が変わらないこと、APPLY後の角度維持・BOOKING反映、PCレンズ、モバイル比較rangeのキーボードと実タッチイベントによるドラッグを確認。
- WebGL2無効化 / reduced-motion / Low TierでDOMスライダーから予約文生成まで成功。
- `WEBGL_lose_context` でコンテキスト消失を発生させ、DOM fallbackと状態保持を確認。
- SALON表示時とvisibilitychange（hidden値のテスト用切替）でrender停止・復帰を確認。
- 8角度・複数候補を連続変更後、`renderer.info.memory.textures` が2枚に収まることを確認。
- 低FPSの継続判定と粒子削減→Medium→Lowの順序を純粋ロジックで検証。
- 初回Opening・SKIP・再訪省略・deep link省略・4.5秒後の自動終了を確認。
- 375pxで縦タッチスクロールが回転と競合しないこと、320pxで主要7ルートが横にはみ出さないことを追加確認。
- GPU Shaderコンパイルを含む実ブラウザ操作でpageerrorなし。Three.js / R3F由来のClock非推奨警告は依存ライブラリ側のもの。

実機iPhone Safari、実機のメモリ圧迫、バックグラウンドからのOSによる強制復帰は未検証。Chromeでのタッチ端末エミュレーションおよび明示的なcontext lossテストの結果を、実機Safariの保証として扱わない。

提供ZIPの画像は低解像度で、一部の行に区切り線・隣カットが混入していた。原本を維持し、取り込みスクリプトで共通範囲へ切り出した。元画像の構図差と解像度制約は残る。

# Phase 4 検証記録（2026-09-05）

- Google Driveの納品元でTypeScript strict、ESLint、本番buildを実行し成功。24静的ページを生成。ローカル実行コピーでも同じ検査を通過。
- 本番サーバーで50ケース中46成功、4件はMobile / Tabletで使用しないGPUレンズ専用のため対象外。追加テストのCSS Modules読込問題はテスト方法を修正し、logic 11件を再実行して全件成功。
- Chrome Desktop、Edge Desktop、WebKit Desktop、iPhone WebKit相当、Android Chrome相当の5プロファイルで選択→COLOR→BOOKING→SALON→Backを確認。7主要ルートのaxe WCAG 2 A/AA・2.1 AA自動検査で違反0、pageerror 0。詳細は `audit/browser-qa.json`。
- 390 / 430 / 768 / 1024 / 1440 / 1920px、および320pxで横overflowなし。375pxの実タッチイベントで縦スクロールが髪の回転と競合しないことを確認。
- 低速画像のplaceholder、画像取得失敗、Save-Data、WebGL無効、context loss、hidden / SALON停止、LRU上限4と遅延disposeを確認。
- JavaScript無効でもSTYLE詳細、担当、MENU、SALON情報とリンクが利用可能。各ルートのSSR Metadata、404、検索非公開時のrobotsを検証。
- 一時的なテスト用設定を別のdevサーバーに与え、LINE / WEB予約リンクとrel属性、LINEのアカウント・本文エンコードを実ブラウザで確認。外部遷移やメッセージ送信は行っていない。テスト設定を納品環境へ保存していない。
- `pnpm audit --prod`：既知の脆弱性0件（検査時点）。
- 本番画面のPC / Mobileスクリーンショットを `screenshots/` に更新。

性能は `audit/before.json` / `after.json` のローカルChrome各1回のラボ計測。Mobile相当LCP 876→928ms、CLS 0→0、操作event duration最大240→208ms。HOMEのJS受信量427,654→431,271 bytes。LCP / CLSはこの環境で目標内だが、200msの操作目標は未達。これは実ユーザーのフィールドINPではない。

未確認・公開前の残件：実店舗情報・正式料金・高解像度実作品・予約URLの設定、Safari本体と実機iPhone / Android、ネイティブLINE起動、OSのメモリ圧迫、公開ドメインのCWV / Rich Results / 予約完了確認。現状はデモのため検索非公開設定。実店舗確認フラグと公開フラグを設定するまでHairSalon / Personの実店舗schemaを出力しない。WebKitエミュレーションを実機Safariでの検証として扱わない。

# TOP人物形成の修正（2026-09-05）

以前のOpeningは楕円形と簡易的な髪の点群で、写真も最初から表示されており、人物形成として不十分だった。HERO原画像から6,000点の位置・色を採り、散開→人物点群→写真へ変更。粒子と写真のcrop / scaleを同じ計算に揃えた。初回再生に加え、右下の↻で再確認できる。

- WebGL準備ができてから3.25秒の演出を開始。スマホは700点以下。
- 点群が欠落・遅延した場合は写真へ復帰し、失敗を再生済みとして保存しない。
- reduced-motion / Save-Data / WebGL不可では写真と操作を表示。
- 形成中のcontext loss、SKIP、再生、Deep LinkをPC / Mobile / Tabletで確認。
- 顔・髪・肩が現れる中間フレームと最終写真を実ブラウザのスクリーンショットで確認。
- この変更後のCWVは旧Phase 4の測定値とは別途確認が必要。
- 修正後の本番ビルドに対する全64ケースは60成功・4対象外。対象外はMobile / Tabletで使用しないGPUレンズ専用テスト。TypeScript strict、ESLint（警告も0件）、本番buildも成功。
- Chrome PC・Pixel 7相当・iPhone WebKit相当の3プロファイルで、散開→人物点群→写真を撮影。再生・SKIP・横overflowなし・pageerror 0を確認。実機スマホの検証とは区別。
- Vercel公開版でも同じ3プロファイルで人物形成と再生・SKIPを確認。公開画面の人物点群はPC 6,000点・スマホ相当700点。公開確認スクリプトの粗いポーリングで短い中間状態を取り逃したため、描画フレームごとの監視へ変更して再検証した。

# TOP演出ブラッシュアップ（2026-09-05）

- 初期点群を全画面の均一な散開から、左右の髪先を起点に曲線で流れ込む配置へ変更。青紫から写真色へ移る二層の光点と、輪郭完成時の単発パルスを追加。
- 点群生成を輪郭・顔・髪優先のLOD順へ変更。6,000点は重複0、先頭700点も重複0、同じHEROからの再生成はbyte単位で一致。
- 写真は薄いぼけた下絵から解像し、形成中はBE YOU.と360°を静かに表示。SKIPは文字量と面積を減らし、↻の再生操作、reduced-motion、Save-Data、失敗時fallbackは維持。
- TypeScript strict、ESLint（警告0件）、本番build成功。全64ケースは60成功・4対象外。Chrome PC・Pixel 7相当・iPhone WebKit相当で人物形成、再生、SKIP、横overflowなし、pageerror 0を確認。
- ローカルChrome各1回のラボ計測はPC LCP 400ms / CLS 0 / 操作event duration最大64ms、Mobile CPU 4倍 LCP 416ms / CLS 0 / 操作event duration最大208ms。JS受信量は433,174 bytes。Mobileの操作目標200msは8ms未達で、フィールドINPや実機保証ではない。

# TOP 360°ターンテーブル（2026-09-05）

- 既存HEROを参照して同一の成人女性モデル、髪型、衣装、照明による8方向画像を内蔵image_genで作成。初稿の左右斜め後ろの順序を直し、不足した左斜め前を再生成。4列×2行のspriteを1776×888へ正規化し、AVIF 79,004 bytes / WebP 165,520 bytesで配置。
- TOPの人物領域を直接ドラッグ／スワイプ可能。隣接角度をクロスフェードし、リリース時に短い慣性を加えて45°単位へスナップ。左右キー、Homeキー、360°ボタンでも操作可能。
- `selectedAngle` を共通Storeへ保存し、TOPで選んだ角度をSTYLE / COLORの360°ビューへ引き継ぐ。SALON、HOME再訪、再読み込みでも既存の永続化仕様を維持。
- スマホは横方向を判定してからpointer captureし、縦スワイプでは角度を変えない。role=slider、角度名、aria値、focus-visibleを設定。
- Opening点群を新しい正面フレームから再生成。PC / Mobileの形成中と完成時を目視し、正面写真と粒子の位置が一致することを確認。
- Chrome 1440×1000、Pixel 7相当、Tablet 820×1180でドラッグ／タッチ／キー／縦スクロール／STYLE引き継ぎを確認。横overflow・pageerrorは0。
- TypeScript strict、ESLint警告0、本番build成功。全67ケースは63成功・4対象外。
- ローカルChrome 1回のラボ計測はPC LCP 524ms / CLS 0 / 操作event duration最大64ms、Mobile CPU 4倍 LCP 676ms / CLS 0 / 操作event duration最大240ms。JS受信量434,270 bytes。Mobile値は目標200msを超えるため、公開後の実機field INP確認が必要。

# STYLE COLLECTION専用写真（2026-09-05）

- LONG / WOLF / PERM / BOB / SHORT / BLEACH / LAYER / CREATIVEを、縦線・くびれ・波・水平線・首元の余白・高明度・翼状レイヤー・非対称という別々のシルエットで制作。
- 既存HEROをidentityとキャンペーントーンの参照にし、黒背景・黒衣装・シルバーと淡い青紫のリムライトを統一。内蔵imagegenを使用し、全画像を1024×1536px WebPへ変換。
- STYLE通常表示を全件coverへ統一し、旧140px画像の引き伸ばしと黒帯を解消。STYLIST作品カード、StyleFlow、STYLE別OGも同じ代表写真へ接続。
- DOM表示・予測先読み・WebGL切替で同じ圧縮済みWebP URLを共有。LONG→WOLF実測で各画像の実転送は1回、再利用はキャッシュヒット。STYLE別OGは`/og/{slug}-v2.jpg`へversioning。
- 360° / COLOR / BOOKINGは提供された共通64フレームを維持。STYLE別360°へ進める際は各STYLE×使用可能色×8角度の撮影素材が必要。
- 8画像の一意性、1024×1536px、WebP形式を自動検証。本番ビルド全68ケースは64成功・4対象外。5ブラウザ環境でpageerror 0、axe違反0、8 STYLEページと8画像はすべてHTTP 200・placeholder未使用。

# Hair Unwoven Gallery（2026-09-06）

HOMEのCinematic Hair Journey直下に4作品のGalleryを配置。単一BufferGeometryを共有する2描画で、写真が帯状にほどけて次の写真へ移る。DOMの作品情報・VIEW／BOOKと既存のSTYLE／予約Storeを接続した。

## 追加分の検証結果（確認時点）

| 確認 | 結果 |
|---|---|
| TypeScript typecheck | 成功 |
| ESLint | 成功・error / warning 0 |
| 本番build | 成功 |
| `tests/hair-unwoven.spec.ts` / Desktop | 10成功・1対象外 |
| `tests/hair-unwoven.spec.ts` / Mobile | 9成功・2対象外 |
| `tests/hair-unwoven.spec.ts` / Tablet | 9成功・2対象外 |
| 全体Playwright 101ケース | 92成功・9対象外・失敗0 |
| Chrome / Edge / WebKit / iPhone emulation / Android emulation | pageerror 0・axe違反0 |
| 静止状態（stable）の目視 | 写真・作品情報・操作を確認 |
| 遷移中（ribbon）の目視 | 写真が帯へほどける中間表現を確認 |

Desktopの対象外1件はMobile／Tablet projectで実行する実タッチの縦横スワイプテスト。Mobile／Tabletの対象外2件は、Desktopで実行するマウス・wheelとGPU lifecycle診断。Gallery追加分と全体回帰テストを分けて集計した。

追加テストでは、4作品の循環、PREVIOUS／NEXTと左右キー、wheel、マウスドラッグ、連続入力後の操作、全作品のVIEW／BOOK mapping、編集名、カラー互換性・ANGLE・OPTION・担当の引き継ぎ、Reduced Motion、WebGL不可時のDOM導線、縦スクロールと横スワイプ、画面遷移後のCanvas撤去とBack、SALON／画面外での停止、resize、Texture上限4、context lossを確認した。

iPhone WebKitとAndroid Chromeはエミュレーションで確認済み。物理端末上のGPU性能と実際のSafari／Chromeタッチ挙動は、公開後の実機確認を残す。

# Cinematic Hair Journey 検証記録（2026-09-08）

- TypeScript strict / `pnpm typecheck`：成功。
- ESLint / `pnpm lint`：エラー・警告なし。
- Production build / `pnpm build`：成功。
- Journey専用Playwright：10成功・5対象外・失敗0。
- 全体Playwright 125ケース：109成功・16対象外・失敗0。
- Desktop Chrome、Pixel 7相当、Tablet相当：各Chapter、WebGL、FINAL CTA、resize、fallback、横幅を確認。
- Safari、iPhone Safari、Android Chromeの実機確認は未実施。
