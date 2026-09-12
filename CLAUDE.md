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
│   │   └── github-kill-shortcut-on-notifications.user.js
│   │   └── CLAUDE.md
│   │   └── spec.md
│   │   └── README.md
│   └── zenhub-sub-issues-estimate-display
│        └── zenhub-sub-issues-estimate-display.user.js
├── Outlook/
│   └── Calendar/
│        └── auto-uncheck-email-organizer
│             └── auto-uncheck-email-organizer.user.js
├── YouTube/
│   └── app-style-bottom-tab-bar
│        └── youtube-app-style-bottom-tab-bar.user.js
```

### 命名規則

- サイトディレクトリ名は、サイト名をそのまま用いる（例: `Github` , `YouTube` , `Outlook`）
    - 1サイト内で機能領域が分かれる場合は、その下に分類ディレクトリを作ってよい（例: `Outlook/Calendar/`）
- UserScriptディレクトリ名は、機能を表すkebab-caseとする
    - 親ディレクトリで表現済みのサイト名は、原則として含めない
- .user.js のファイル名は `<サイト名>-<UserScriptディレクトリ名>.user.js` とする
    - ディレクトリ名にサイト名以外の固有名（例: `zenhub`）が含まれる場合は、サイト名を重ねず、ディレクトリ名と同名としてよい

### 付随ドキュメント

- `README.md` : 各UserScriptディレクトリに配置する
    - 内容は日本語で記述し、概要・動作・設定・セットアップ手順を簡潔にまとめる
- `spec.md` : 実装が複雑で仕様の明文化が必要な場合のみ作成する（任意）
- `CLAUDE.md` : そのUserScript固有の開発ルールがある場合のみ作成する（任意）
    - ルートの本ファイルの内容を、そのディレクトリ内に限り上書きする

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

### 記載順

ヘッダの項目は、既存スクリプトに合わせて以下の順に記載する。

1. @name
1. @namespace
1. @icon
1. @match （必要に応じて @exclude , @run-at , @connect を後続させる）
1. @grant
1. @noframes
1. @version
1. @author
1. @supportURL
1. @description

### 各項目の既定値

- @namespace
    - 特段の理由がなければ `Violentmonkey Scripts` とする
- @grant
    - GM APIを使用しない場合は `none` とする
- @icon
    - Github: `https://github.githubassets.com/favicons/favicon.svg`

## バージョニング

- semantic versioning（形式: MAJOR.MINOR.PATCH）に従い、3桁すべてを記載する
    - 新規追加時の初版は `0.1.0` とする
- コードを変更した場合は、変更と同時にpatch versionを1上げる
    - バグ修正、仕様変更、機能追加など、あらゆるコード変更が対象
- ユーザーから「正常に動作した」と伝えられた場合は、minor versionを1上げ、patch versionを0にリセットする
- major versionは、ユーザーから明示的な指示があった場合のみ1上げ、minor/patch versionを0にリセットする

## Check the official documentation

Anything that depends on how an external framework, library or API actually behaves —
configuration fields, what a call returns, which APIs exist — is settled by reading the
current official documentation, not by recalling it. Versions move, and a habit that was
correct a few releases ago may no longer be. When a specific version is pinned, check that
version's documentation.

## Write issues and pull requests in Japanese

GitHub issues and pull requests — titles and bodies alike — are written in Japanese.
This applies to issues you file, pull requests you open, and edits to existing ones.

Inside the codebase: code, identifiers, code comments and commit messages are English,
while user-facing documentation (`README.md`, `docs/`) and strings shown to the user are
Japanese.

## Link pull requests to the issue they close

A pull request that comes from an issue opens its body with a closing reference to that
issue, on its own line, before anything else:

```
Closes #11
```

Prefer `Closes`; `Fixes` and `Resolves` behave the same way. Write the keyword in English
even though the rest of the body is Japanese — GitHub only recognises the English form, so
this is the one exception to the rule above.

The keyword only works for issues in the same repository, and it closes the issue when the
pull request is merged. Reference an issue that should stay open — or one in another
repository — without a keyword instead (`Refs #12`). A pull request with no originating
issue gets no such line.

## Keep the pull request body in step with the branch

A pull request body describes the branch as it stands, not as it stood when the pull
request was opened. After pushing further commits to a branch that already has one, re-read
the body and update it — the title too, when the scope of the change moved. Renames,
reversed decisions and work added on review feedback all belong there; a typo fix or a
formatting-only commit usually changes nothing worth writing down.

This holds however the pull request was created, including ones opened from the Claude Code
UI rather than by you.

## Do not commit secrets

API keys, tokens and credentials never enter the repository. Read them from environment
variables, and commit an `.env.example` listing the required names with empty or dummy
values instead of the real `.env`.
