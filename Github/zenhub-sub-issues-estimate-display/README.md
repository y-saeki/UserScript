# Zenhub Sub-issues Estimate Display

- Github issueのSub-issues list内に、各issueのestimateを表示します

## 初回セットアップ

1. https://app.zenhub.com/settings/tokens で GraphQL Personal API Key を発行します
1. UserScriptを有効にし、github issueを開きます
1. API Keyの要求ダイアログが表示されます。1.で発行したAPI Keyを入力してください

API Keyは、[GM API](https://wiki.greasespot.net/GM.setValue)によって永続化されます。  
リロードやブラウザ再起動をしても、再入力する必要はありません。

## 詳細仕様

[spec.md]を参照してください。