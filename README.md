# AI Secretary

LINE Bot を入口として Gmail・Google カレンダー・Slack・Notion を AI（Claude）で統合する AI 秘書アプリケーション。

## 機能

### LINE → 各サービス連携
- LINEで自然言語で指示するだけで各サービスを操作
- 「メールチェックして」「明日14時に会議入れて」「Slackに投稿して」

### Gmail連携
- メール検索・閲覧・送信（確認フロー付き）
- AIによる返信ドラフト自動生成

### Googleカレンダー連携
- 予定の一覧・作成・空き時間検索
- 会議前のリマインド通知（参加URL付き）

### Slack連携
- メッセージ投稿・検索・メンション確認・チャンネル要約

### Notion連携
- ページ/メモ作成・検索・タスク管理・会議アジェンダ自動生成

### 自動通知・サマリー
- **日次サマリー**: 毎朝7時(JST)に今日の予定・未読メール・天気をLINEに送信
- **通知チェック**: 5分毎にGmail新着・カレンダーリマインダー・Slackメンションを確認
- **週次レポート**: 毎週日曜に1週間のアクティビティレポート
- **リマインダー**: 指定時間後にLINE通知
- 天気予報・画像解析

## 技術スタック

- **Framework**: Next.js 14 (App Router) + TypeScript
- **AI Engine**: Claude API (Anthropic) with tool_use
- **Deploy**: Vercel (Serverless + Cron Jobs)
- **State**: Vercel KV (Redis)

## セットアップ

```bash
npm install
cp .env.example .env.local
# 各サービスの認証情報を .env.local に設定
npm run dev
```

各サービスの詳細な設定方法は `.env.example` のコメントを参照してください。

## プロジェクト構成

```
src/
├── app/api/
│   ├── webhook/line/           # LINE Webhook受信
│   ├── auth/google/            # Google OAuth2フロー
│   └── cron/                   # 定期実行ジョブ
├── lib/
│   ├── ai/                     # Claude API統合 (20+ツール)
│   ├── services/               # Gmail, Calendar, Slack, Notion, Weather
│   ├── auth/                   # Google OAuth2
│   ├── store/                  # Vercel KV (会話履歴・トークン)
│   └── utils/                  # 日本語日付パース等
└── types/                      # TypeScript型定義
```
