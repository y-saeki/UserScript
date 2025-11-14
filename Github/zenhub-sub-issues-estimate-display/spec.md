# Zenhub Sub-issues Estimate Display 仕様書

## 概要

GitHubのissueページで、Sub-issuesのZenhub estimateを表示するUserScriptです。  
直下の子issueと、アコーディオン展開時に表示される孫issueのestimateを自動的に取得・表示します。

## 動作環境

- **対象URL**: `https://github.com/*/*/issues/*`
- **実行環境**: Tampermonkey等のUserScriptマネージャー

## 主要機能

### 1. Sub-issuesのEstimate表示

- GitHubのissueページで、Sub-issuesセクションに存在する各issueのZenhub estimateを表示
- ページ読み込み直後の時点では、直下の子issueのみを対象として表示
- 各issueのリンクの先頭に、円形バッジとして表示

### 2. バッチ処理による効率的な取得

- 複数のissueのestimateを並列取得（バッチサイズ: 10件）
- GraphQL APIを使用して、一度のリクエストで複数issueの情報を取得

### 3. 動的な展開対応

- 孫issueを持つissue（Epic）のアコーディオン展開を監視し、展開時に孫issueのestimateを自動取得・表示
- MutationObserverを使用してDOM変更を検知

### 4. 孫issueを持つissueの処理

- 孫issueを持つissue（Epic）にはestimate値を表示せず、「?」を表示
- APIリクエストをスキップしてパフォーマンスを最適化

## API設定

### Zenhub API Key

- **取得方法**: https://app.zenhub.com/settings/tokens
- **保存方法**: UserScriptのストレージ（GM_setValue/GM_getValue）に保存
- **設定タイミング**: 初回実行時、またはAPI Keyが無効な場合にプロンプト表示
- **リセット方法**: ブラウザコンソールで `window.resetZenhubApiKey()` を実行

### APIエンドポイント

- **URL**: `https://api.zenhub.com/public/graphql`
- **認証**: Bearer Token（Personal API Key）
- **リクエスト方法**: POST（GraphQL）

## 表示仕様

### Estimateバッジ

- **形状**: 円形バッジ
- **サイズ**: 18px × 18px
- **色**: 
  - 通常: 青（#4660f9）
  - Epic: グレー（#dfe4e9、grayscaleフィルタ適用）
- **位置**: issueリンクの先頭
- **フォント**: 12px、tabular-nums（等幅数字）
- **ツールチップ**: 
  - 通常: `Zenhub Estimate: {値}`
  - Epic: `Zenhub Estimate: - (Epic)`

### ローディング表示

- **形状**: 回転するスピナー
- **サイズ**: 14px × 14px
- **色**: 青（#0969da）
- **アニメーション**: 0.8秒で1回転

## 技術仕様

### リポジトリID取得

以下の順序でリポジトリIDを取得：

1. DOMから取得
   - `[data-repository-id]` 属性
   - `meta[name="octolytics-dimension-repository_id"]`
   - `window.__PRIMER_DATA__.repository.id`
2. GitHub APIから取得（フォールバック）
   - `https://api.github.com/repos/{owner}/{repo}`

### Sub-issues抽出

- **対象**: `[data-testid="sub-issues-issue-container"]` 内の要素
- **階層判定**: `aria-level` 属性とDOM構造を組み合わせて判定
- **直下の子issue**: ルート`ul[role="tree"]`の直接の子孫のみ
- **孫issue**: 親li要素内の`aria-level`が親+1の要素

### GraphQLクエリ

```graphql
query getIssueInfoBatch($repositoryGhId: Int!) {
  issue_1: issueByInfo(repositoryGhId: $repositoryGhId, issueNumber: 1) {
    number
    estimate {
      value
    }
  }
  issue_2: issueByInfo(repositoryGhId: $repositoryGhId, issueNumber: 2) {
    number
    estimate {
      value
    }
  }
  # ... 最大10件まで
}
```

### エラーハンドリング

- **API Key未設定**: プロンプト表示（キャンセル時は警告ログ）
- **API Key無効**: ストレージをクリアし、アラート表示
- **APIエラー**: コンソールにエラーログ出力
- **リポジトリID取得失敗**: コンソールにエラーログ出力、処理中断

## 初期化と実行タイミング

### 初回実行

- ページ読み込み完了後1秒待機して実行
- `DOMContentLoaded` イベントを監視

### SPAナビゲーション対応

- `MutationObserver` でURL変更を監視
- issueページへの遷移時に自動実行（1秒待機）

## パフォーマンス最適化

- バッチ処理: 10件ずつ並列取得
- 孫issue判定: 事前に判定してAPIリクエストをスキップ
- 重複防止: 既にバッジが表示されているissueはスキップ
- イベントリスナー: 重複登録を防止（data属性で管理）

## ユーザー操作

### API Keyリセット

ブラウザコンソールで以下を実行：

```javascript
window.resetZenhubApiKey()
```

実行後、ページをリロードすると再度API Keyの入力を求められます。

## 制限事項

- 直下の子issueのみを対象（孫issueは展開時に表示）
- バッチサイズは10件固定
- アコーディオン展開の検知は最大2秒待機
- GitHubのDOM構造に依存（クラス名や属性が変更されると動作しない可能性）

## 依存関係

- **Tampermonkey API**: 
  - `GM_xmlhttpRequest`
  - `GM_getValue`
  - `GM_setValue`

## セキュリティ

- API KeyはUserScriptのストレージに保存（暗号化されていないため注意）
- `@connect` ディレクティブで接続先を制限（`api.zenhub.com`）

