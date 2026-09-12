# Tab Indent on Github Textarea

- Github上のtextarea内で、Tabキーによるインデント（スペース挿入）を可能にします
    - デフォルトではフォーカス移動が発生し、インデントを入力できません

## 動作

| 操作 | 挙動 |
| --- | --- |
| Tab | カーソル位置にスペースを挿入する |
| Shift + Tab | カーソル直前、またはカーソル行頭のスペースを削除する |
| テキスト選択中のTab / Shift + Tab | 何もしない（Github標準のインデント機能に委ねる） |
| IME変換中のTab | 何もしない（変換候補の選択を妨げない） |

- Ctrl+Zによるundo履歴は維持されます

## 有効になる画面

`https://github.com/<owner>/<repo>/` 配下の、以下のいずれかで始まるパス。

- `issues` / `pull` / `wiki` / `edit` / `compare`

> [!NOTE]
> `@match` は `https://github.com/*` とし、対象画面の判定はスクリプト内で行っています。  
> Githubはページ遷移の多くをclient-side navigationで行いますが、UserScriptは実際のページ読み込み時にしか注入されないため、`@match` を対象画面に絞ると、他の画面から遷移してきた場合にスクリプトが動作しません。

## 設定

- インデント幅は、スクリプト先頭の `tabSize` で変更できます（デフォルト: 4）
