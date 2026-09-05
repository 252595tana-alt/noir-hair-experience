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
