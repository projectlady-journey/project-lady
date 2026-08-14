Project Lady / Phase3 旅データBOX v0.1
2026-08-14

目的
- Homeと交通が、別々の初期値ではなく「一つの旅データBOX」を参照する最小実装。
- 大阪・紀南3泊4日の旅を実データ1件としてSeed投入。
- Welcomeで変更した人数・旅の気分等も同じBOXへ保存。
- 交通画面の編集も同じBOXへ保存。
- 画面の現在地(UI state)は旅データとは分けて保持し、リロード復帰を継続。

今回実装したデータ
- trip: 旅ID / 旅タイトル / 開始日 / 終了日 / 出発地 / 目的地 / 人数モード / 旅テンション
- welcome: Welcome Flow回答
- transport: 4区間の交通情報
- meta: データ元 / 更新時刻

データ元
- 大阪・紀南3泊4日_旅の台帳_v0.11.4
- 既存HomeFlow v1.6.3相当コード

重要
- ExcelをWeb画面へコピーしたものではない。
- 現段階ではExcelとの自動同期・双方向同期は実装しない。
- localStorage内の正本は projectLadyJourneyBox_v01 の1本へ集約。
- UI現在地は projectLadyUiState_v01 として別保持。
- 旧 projectLadyJourneyProfile_v07 / projectLadyTransport_v01 が端末に残っている場合は初回のみ新BOXへ移行する。

民代表レビューで見てほしいこと
1. Homeに「大阪・紀南3泊4日の旅」「2026.11.19 — 2026.11.22」「大阪・紀南」が自然に出るか。
2. 交通を開いて編集→リロードして、同じ内容・同じ交通画面へ戻れるか。
3. Welcomeの回答を変えたあとHomeへ戻り、雰囲気の文言が反映されるか。
4. 既存の静けさ・写真ファーストを壊していないか。
