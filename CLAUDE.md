# UserScript

- UserScriptの開発を行うrepositoryです

## ディレクトリ

- 適用するサイトごとにディレクトリを作成する
- その内部で、1つのUserScriptごとに1ディレクトリを作成する

以下はディレクトリ構造の例示である。

```
UserScript/
├── CLAUDE.md
├── README.md
├── Github/
│   ├── kill-shortcut-on-notifications
│   │   └── kill-shortcut-on-notifications.user.js
│   │   └── CLAUDE.md
│   │   └── SPEC.md
│   │   └── README.md
│   └── zenhub-sub-issues-estimate-display
│        └── zenhub-sub-issues-estimate-display.user.js
├── YouTube/
│   └── app-style-bottom-tab-bar
│        └── app-style-bottom-tab-bar.user.js
```

## ヘッダ

.user.js のヘッダには以下の項目を記載する。  
特に具体的な指定がないものは、一般的な内容を記入すればよい。

- @name
    - スクリプトの名称を平易な英文で記入する
    - 名称にはできる限り、適用先のサイト名を含める
    - バージョン番号など、頻繁に更新される値・文言の使用は禁止
- @version
    - semantic versioningに従う
- @namespace
- @match
- @icon
    - 適用先サイトのfavicon urlを記載する
- @description
- @author
    - `y-saeki w/ AI Agent` とする
- @supportURL
    - `https://github.com/y-saeki/UserScript` とする
- @updateURL , @downloadURL
    - デフォルトは空欄、すでに記入されている場合はそのままとする
    - 値は一致させておくこと
- @noframes
- ほか、必要な項目があれば、適宜最小限の範囲で追加すること