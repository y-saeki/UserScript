# Outlook Calendar - Auto uncheck "Email organizer"

- 会議出欠の応答時に表示される「開催者にメールを送信する」チェックボックスを、自動的にオフにします

## 動作

- `#fluent-default-layer-host` 配下のDOM変更を監視し、対象のチェックボックスを探してオンであればクリックします
    - 表示言語は `html` 要素の `lang` で判定し、日本語（ja）・英語（en）に対応します。それ以外の言語では英語表記で判定します
    - ポップアップとモーダルでDOM構造が異なるため、両方の形式を判定します
        - ポップアップ: `for` 属性を持つ `label` から、対応する `input` を取得する
        - モーダル: `for` 属性を持たない `label` の親要素配下から、`button` を取得する
    - オン/オフの判定は、`input` なら `checked`、`button` なら `aria-checked` で行います
- 一度クリックした要素には `data-auto-clicked` 属性を付与し、再度オフにすることはありません
    - 意図的にオンへ戻した場合に、それを打ち消さないためです
- クリック処理中は監視を一時停止し、自身の操作による変更に反応しないようにしています

## 有効になる画面

- `outlook.office.com/calendar/` 配下
- `outlook.office365.com/calendar/` 配下

## 設定

スクリプト先頭の `config` で変更できます。

| キー | 内容 | 既定値 |
| --- | --- | --- |
| `targetMutate` | DOM変更の監視対象セレクタ | `#fluent-default-layer-host` |
| `targetCheckboxLabel` | 対象チェックボックスのラベル文字列（言語別） | ja: `開催者にメールを送信する` / en: `Email organizer` |
