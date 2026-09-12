# Outlook Calendar - Auto full-open schedule popup

- Outlook Calendarで予定をクリックした際に表示されるミニポップアップを、自動で全画面モーダルに切り替えます
    - ミニポップアップは情報量が少なく、結局モーダルを開き直す操作が必要になるためです

## 動作

- `#fluent-default-layer-host` 配下のDOM変更を監視し、変更のたびに「イベントを表示します」ボタンを探してクリックします
    - ボタンは `title` 属性の文字列で判定します
    - 表示言語は `html` 要素の `lang` で判定し、日本語（ja）・英語（en）に対応します。それ以外の言語では英語表記で判定します
- あわせて、以下のCSSを注入します
    - モーダルの高さを固定する（既定のモーダルは縦幅が狭く、内容が読みにくいため）
    - メンバー一覧ペインのスクロールバーが内容に重なる問題を、`padding-bottom` で回避する

## 有効になる画面

- `outlook.office.com/calendar/` 配下
- `outlook.office365.com/calendar/` 配下

## 設定

スクリプト先頭の `config` で変更できます。

| キー | 内容 | 既定値 |
| --- | --- | --- |
| `targetMutate` | DOM変更の監視対象セレクタ | `#fluent-default-layer-host` |
| `targetFullOpenTitle` | クリック対象ボタンの `title` 文字列（言語別） | ja: `イベントを表示します` / en: `View event` |
| `modalHeight` | モーダルの高さ | `900px` |

> [!NOTE]
> Outlookの画面更新でボタンの `title` 文字列やレイアウトホストのセレクタが変わると動作しなくなります。  
> その場合は `config` の値を実際のDOMに合わせて修正してください。
