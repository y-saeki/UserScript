# Tab Indent on Github Textarea

- Github上のtextarea内で、Tabキーによる行のインデント（半角スペース）を可能にします
    - デフォルトではフォーカス移動が発生し、インデントを入力できません

## 動作

| 操作 | 挙動 |
| --- | --- |
| Tab | カーソル行の行頭にスペースを挿入する（カーソル位置に関わらず、常に行全体をインデント） |
| 範囲選択中のTab | 選択範囲が掛かっている全ての行をインデントする |
| Shift + Tab | カーソル行の行頭のインデントを1段階削除する |
| 範囲選択中のShift + Tab | 選択範囲が掛かっている全ての行のインデントを1段階削除する |
| IME変換中のTab | 何もしない（変換候補の選択を妨げない） |
| 補完候補の表示中のTab | 何もしない（`@mention` などの候補選択を妨げない） |

- カーソル位置・選択範囲は、テキストに対する相対位置が維持されます
- Shift + Tabは、スクリプトが挿入したスペースに加えて、タブ文字1つも1段階として削除します
- 選択範囲の末尾が改行直後にある場合、その次の行はインデント対象になりません
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

キーイベントの取り回しと選択範囲の処理は、[Refined Github の tab-to-indent](https://github.com/refined-github/refined-github/blob/main/source/features/tab-to-indent.tsx) と、その依存である [indent-textarea](https://github.com/fregante/indent-textarea) / [text-field-edit](https://github.com/fregante/text-field-edit) の実装に倣っています。

- textareaの編集は `document.execCommand()` 経由で行う
    - `textarea.value` への直接代入はReactのstateに反映されず、次のrenderで取り消される
    - undo履歴と `input` イベントも維持される
- キーイベントは `window` のcaptureフェーズで受け、処理した場合は `stopImmediatePropagation()` する
    - Github側がTabを先に処理してフォーカスを移動するため

Refined Githubとの差異は以下の2点です。

- タブ文字ではなく半角スペースを挿入する（このスクリプトが存在する理由）
- カーソルのみ（範囲選択なし）の場合も、カーソル位置への挿入ではなく行全体をインデントする
    - Refined Githubは、1行内の範囲選択時は選択テキストをタブ文字で置換しますが、このスクリプトは選択テキストを保持して行をインデントします
