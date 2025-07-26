# 🍪 Cookie-JA

**日本の法令に準拠したクッキー同意管理ライブラリ**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Built%20with-Turborepo-blueviolet.svg)](https://turbo.build/)

2025年改正個人情報保護法（APPI）と電気通信事業法に対応した、最も使いやすい日本向けクッキー同意バナーライブラリです。

## 🎯 3ステップでかんたんに導入できる

### ステップ 1️⃣: スクリプトタグを追加

HTMLの `<head>` または `<body>` 終了タグ前に1行追加するだけ：

```html
<script
  src="https://cdn.jsdelivr.net/npm/@cookie-ja/widget@latest/dist/cookie-ja.umd.js"
  data-site-id="your-site-id"
  defer
></script>
```

### ステップ 2️⃣: サイトIDを設定

`your-site-id` をあなたのウェブサイト名に変更：

```html
<script
  src="https://cdn.jsdelivr.net/npm/@cookie-ja/widget@latest/dist/cookie-ja.umd.js"
  data-site-id="my-awesome-site"
  defer
></script>
```

### ステップ 3️⃣: 完了！

ページをリロードすると、APPI準拠のクッキー同意バナーが自動で表示されます。

<details>
<summary>🔧 オプション設定（必要に応じて）</summary>

```html
<!-- より詳細な設定例 -->
<script
  src="https://cdn.jsdelivr.net/npm/@cookie-ja/widget@latest/dist/cookie-ja.umd.js"
  data-site-id="my-site"
  data-language="ja"
  data-theme="light"
  data-position="bottom"
  data-webhook-url="https://your-webhook.workers.dev/collect"
  defer
></script>
```

- `data-language`: `"ja"` (日本語) または `"en"` (English)
- `data-theme`: `"light"`, `"dark"`, または `"auto"`
- `data-position`: `"bottom"`, `"top"`, または `"center"`
- `data-webhook-url`: 同意ログを保存したい場合のエンドポイント

</details>

---

## ✨ 特徴

- 🇯🇵 **APPI準拠**: 2025年改正個人情報保護法と電気通信事業法14条2に対応
- ⚡ **簡単導入**: `<script>` タグ一つで即座に利用開始
- 🎨 **カスタマイズ**: CSS Variables でブランドに合わせたデザイン
- 🌍 **多言語**: 日本語・英語対応（追加言語も簡単に拡張）
- 📱 **レスポンシブ**: あらゆるデバイスで美しく表示
- ⚙️ **多フレームワーク**: React、Vue、WordPress、プレーンJSすべてサポート
- 🔒 **プライバシー重視**: 同意ログのハッシュ化とエクスポート機能
- 🚀 **高パフォーマンス**: Edge配信による高速読み込み

## 🚀 クイックスタート

### HTMLサイトでの使用

```html
<script
  src="https://cdn.jsdelivr.net/npm/@cookie-ja/widget@latest/dist/cookie-ja.umd.js"
  data-site-id="your-site-id"
  data-webhook-url="https://your-worker.workers.dev/collect"
  data-language="ja"
  data-theme="light"
  data-position="bottom"
  defer
></script>
```

### React/Next.jsでの使用

```bash
npm install @cookie-ja/react
```

```tsx
import { CookieConsentProvider, CookieBanner } from '@cookie-ja/react';

function App() {
  return (
    <CookieConsentProvider
      config={{
        siteId: 'your-site-id',
        webhookUrl: 'https://your-worker.workers.dev/collect',
        language: 'ja',
      }}
    >
      <YourApp />
      <CookieBanner />
    </CookieConsentProvider>
  );
}
```

## 📦 パッケージ

| パッケージ          | 説明                     | NPMバッジ                                                                                                     |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `@cookie-ja/core`   | 共通ロジックと型定義     | [![npm](https://img.shields.io/npm/v/@cookie-ja/core.svg)](https://www.npmjs.com/package/@cookie-ja/core)     |
| `@cookie-ja/react`  | React Hooks & Components | [![npm](https://img.shields.io/npm/v/@cookie-ja/react.svg)](https://www.npmjs.com/package/@cookie-ja/react)   |
| `@cookie-ja/widget` | Vanilla JS UMD Widget    | [![npm](https://img.shields.io/npm/v/@cookie-ja/widget.svg)](https://www.npmjs.com/package/@cookie-ja/widget) |

## 🛠 開発環境のセットアップ

### 前提条件

- Node.js 18+
- npm 8+

### インストール

```bash
# リポジトリクローン
git clone https://github.com/your-org/cookie-ja.git
cd cookie-ja

# 依存関係のインストール
npm install

# 全パッケージのビルド
npm run build

# 開発サーバー起動
npm run dev
```

### モノレポ構造

```
cookie-ja/
├── packages/
│   ├── core/            # 共通ロジック・型定義
│   ├── react/           # React Hooks & Provider
│   ├── web-component/   # UMD Widget
│   └── vue/             # Vue 3 Composables (計画中)
├── apps/
│   ├── demo/            # デモページ
│   ├── wizard/          # 設定ジェネレータ (計画中)
│   └── dashboard/       # 管理ダッシュボード (計画中)
├── edge/
│   └── adapters/
│       ├── cloudflare/  # Cloudflare Workers
│       ├── supabase/    # Supabase Edge Functions (計画中)
│       └── vercel/      # Vercel Edge Functions (計画中)
└── docs/                # ドキュメント (計画中)
```

## ⚙️ 設定オプション

```typescript
interface CookieConsentConfig {
  siteId: string; // 必須: サイト識別子
  version?: string; // バージョン (デフォルト: '1.0.0')
  language?: 'ja' | 'en'; // 言語 (デフォルト: 'ja')
  theme?: 'light' | 'dark' | 'auto'; // テーマ (デフォルト: 'light')
  position?: 'bottom' | 'top' | 'center'; // 位置 (デフォルト: 'bottom')
  layout?: 'box' | 'bar' | 'cloud'; // レイアウト (デフォルト: 'box')
  webhookUrl?: string; // 同意ログ送信先

  // ボタン表示制御
  acceptAllButton?: boolean; // (デフォルト: true)
  rejectAllButton?: boolean; // (デフォルト: true)
  managePreferencesButton?: boolean; // (デフォルト: true)

  // イベントハンドラ
  onAccept?: (consent: ConsentData) => void;
  onReject?: (consent: ConsentData) => void;
  onChange?: (consent: ConsentData) => void;
}
```

## 🎨 カスタマイズ

CSS Variables でデザインをカスタマイズできます：

```css
:root {
  --cookie-banner-bg: #ffffff;
  --cookie-banner-text: #333333;
  --cookie-banner-border: #e0e0e0;
  --cookie-banner-radius: 8px;
  --cookie-banner-primary: #3182ce;
  --cookie-banner-primary-hover: #2c5aa0;
  --cookie-banner-secondary: #e2e8f0;
  --cookie-banner-secondary-hover: #cbd5e0;
}
```

## 🔧 Cloudflare Workers セットアップ

同意ログを保存するためのCloudflare Workersを設定：

```bash
cd edge/adapters/cloudflare

# Wranglerでログイン
npx wrangler login

# KV Namespaceを作成
npx wrangler kv:namespace create "COOKIE_CONSENT_KV"
npx wrangler kv:namespace create "RATE_LIMIT_KV"

# wrangler.tomlにNamespace IDを設定
# (表示されたIDをコピー)

# Workers をデプロイ
npm run deploy
```

## 📊 同意ログの確認

```bash
# CSVエクスポート
curl "https://your-worker.workers.dev/export?siteId=your-site-id&month=2024-12&format=csv" \
  -H "Authorization: Bearer your-secret"

# JSON形式
curl "https://your-worker.workers.dev/export?siteId=your-site-id&month=2024-12" \
  -H "Authorization: Bearer your-secret"
```

## 🧪 テスト

```bash
# 全パッケージのテスト実行
npm test

# 型チェック
npm run type-check

# リンター
npm run lint
```

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🤝 コントリビューション

Issue・Pull Requestを歓迎します！

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feat/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feat/amazing-feature`)
5. Pull Requestを開く

## 📞 サポート

- 📖 [ドキュメント](https://cookie-ja.dev)
- 💬 [Discord コミュニティ](https://discord.gg/cookie-ja)
- 🐛 [Issue 報告](https://github.com/your-org/cookie-ja/issues)
- 📧 [メール](mailto:support@cookie-ja.dev)

---

**Cookie-JA**: 🇯🇵 Made for Japan, Built for the World
