# Tab Indent on Github Textarea

- Github上のtextarea内で、Tabキーによるインデント（半角スペース挿入）を可能にします
    - デフォルトではフォーカス移動が発生し、インデントを入力できません

## 動作

| 操作 | 挙動 |
| --- | --- |
| Tab | カーソル位置にスペースを挿入する |
| Shift + Tab | カーソル直前、またはカーソル行頭のスペースを削除する |
| テキスト選択中のTab / Shift + Tab | 何もしない（Github標準のインデント機能に委ねる） |
| IME変換中のTab | 何もしない（変換候補の選択を妨げない） |
| 補完候補の表示中のTab | 何もしない（`@mention` などの候補選択を妨げない） |

- Ctrl+Zによるundo履歴は維持されます

## 有効になる画面

`https://github.com/<owner>/<repo>/` 配下の、以下のいずれかで始まるパス。

- `issues` / `pull` / `wiki` / `edit` / `compare`

> [!NOTE]
> `@match` は `https://github.com/*` とし、対象画面の判定はスクリプト内で行っています。  
> Githubはページ遷移の多くをclient-side navigationで行いますが、UserScriptは実際のページ読み込み時にしか注入されないため、`@match` を対象画面に絞ると、他の画面から遷移してきた場合にスクリプトが動作しません。

## 設定

- インデント幅は、スクリプト先頭の `tabSize` で変更できます（デフォルト: 4）

## 動作しない場合

ブラウザのdevtools consoleで以下を実行し、実際に読み込まれているバージョンを確認してください。

```js
window.tabIndentOnGithubTextarea
```

`undefined` が返る場合、そのページでスクリプトが読み込まれていません。UserScriptマネージャ側のインストール状況を確認してください。

## 実装メモ

キーイベントの取り回しは [Refined Github の tab-to-indent](https://github.com/refined-github/refined-github/blob/main/source/features/tab-to-indent.tsx) と、その依存である [indent-textarea](https://github.com/fregante/indent-textarea) / [text-field-edit](https://github.com/fregante/text-field-edit) の実装に倣っています。

- textareaの編集は `document.execCommand()` 経由で行う
    - `textarea.value` への直接代入はReactのstateに反映されず、次のrenderで取り消される
    - undo履歴と `input` イベントも維持される
- キーイベントはcaptureフェーズで受け、処理した場合は `stopImmediatePropagation()` する
    - Github側がTabを先に処理してフォーカスを移動するため

Refined Githubを使わず自前で持っている理由は、Tabキーでtab文字ではなく半角スペースを挿入したいためです。
