Project Lady v1.5 / Navigation v0.1
2026-08-08

基盤
- v1.4 Transport v0.4 正常動作版ZIPから積み上げ

今回の工事
- リロード時の「現在地」管理を画面ごとに統一
- Home / 交通 / 旅先を考える だけでなく、
  Welcome Flow / Welcome Back / 未実装ページ（ホテル・旅程・持ちもの・Memo・旅ログ）も現在地として保存
- 「旅のはじまりを見直す」途中でリロードしても、勝手にWelcome Backへ戻さない
- 未実装ページでリロードしてもHomeやWelcome Backへ飛ばさず、そのページへ復帰
- 旧版の状態データが残っている場合は安全側でWelcome Backへフォールバック
- 旅データそのものの保存仕様は変更しない

今回の目的
スマホで意図せず再読み込みが起きても、
「今いた場所」が分からなくならないようにする。

GitHub
ZIP展開 → 中身をUpload files → Commit changes
