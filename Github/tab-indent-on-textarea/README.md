# Tab Indent on Github Textarea

- Github上のtextarea内で、Tabキーによるインデント（スペース挿入）を可能にします
    - デフォルトではフォーカス移動が発生し、インデントを入力できません

## 動作

| 操作 | 挙動 |
| --- | --- |
| Tab | カーソル位置にスペースを挿入する |
| Shift + Tab | カーソル直前、またはカーソル行頭のスペースを削除する |
| テキスト選択中のTab / Shift + Tab | 何もしない（Github標準のインデント機能に委ねる） |

## 対象ページ

- issues / pull request / wiki / ファイル編集 / compare の各画面

## 設定

- インデント幅は、スクリプト先頭の `tabSize` で変更できます（デフォルト: 4）
