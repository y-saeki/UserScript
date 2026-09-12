# No Zoom on iOS

- ChatGPTで、iOSの入力欄フォーカス時に発生する自動ズームを抑止します
    - iOSでは、フォントサイズの小さい入力欄にフォーカスすると画面が自動的に拡大されます

## 動作

- viewportの `meta` タグに `user-scalable=no` を追加します
    - `meta[name="viewport"]` が存在しない場合は、新規に作成して `head` に追加します
    - すでに `user-scalable=no` が含まれている場合は何もしません
- `head` の子要素の変更を監視し、画面遷移でviewport設定が差し替えられた場合も再適用します

> [!WARNING]
> `user-scalable=no` はピンチ操作による手動ズームも抑止する指定です。  
> ただし、これを尊重するかはブラウザの実装に依存します。

## 有効になる画面

- `https://chat.openai.com/` 配下のすべてのページ

> [!NOTE]
> `@match` は `chat.openai.com` のみです。`chatgpt.com` では動作しません。

## 設定

- 設定項目はありません
