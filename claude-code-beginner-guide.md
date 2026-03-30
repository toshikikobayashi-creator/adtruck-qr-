# Claude Code 初心者ガイド

> 経営管理の「あるある業務」が劇的に変わる ― 実際の企業事例で解説

---

## このガイドについて

- **対象**: プログラミング初心者・非エンジニアの方も歓迎
- **目的**: Claude Codeで何ができるのか、実例を交えてわかりやすく解説
- **スライド資料**: [Gammaで生成したプレゼン資料はこちら](https://gamma.app/docs/l9qjxbrhp63kcis)

---

## 1. Claude Code って何？

**ひとことで言うと「AIの協力者」です。**

あなたが日本語で指示を出すだけで、AIが実際にコードを書き、ファイルを作り、バグを直してくれます。
ターミナル（黒い画面）で動くAIアシスタントで、Anthropic社が開発した公式ツールです。

### 従来のAIチャットとの違い

| 従来のチャットAI | Claude Code |
|---|---|
| コードを**提案**してくれる | コードを**書いて実行**してくれる |
| コピー＆ペーストが必要 | ファイルを直接編集してくれる |
| 1ファイルずつの対応 | プロジェクト全体を理解して対応 |

### どこで使えるの？

主要な利用環境:

1. **ターミナル（CLI）** - 一番基本的で高速な使い方
2. **VS Code 拡張機能** - エディタ内で直接操作
3. **デスクトップアプリ** - Mac/Windows対応のビジュアルUI
4. **Web アプリ（claude.ai/code）** - インストール不要、ブラウザから
5. **JetBrains IDE** - IntelliJ, PyCharmなどで利用可能

さらに Slack 連携、GitHub Actions/CI での自動化にも対応しています。

---

## 2. 経営管理の「あるある課題」をClaude Codeはこう解決する

### 課題① 週次・月次レポート作成に時間がかかりすぎる

**経営管理あるある**: 毎週・毎月、各部門のKPIデータをExcelに集め、グラフを作り、サマリーを書く。これだけで半日〜丸1日が消える。

```
あなた: 「各部門の売上・顧客対応件数・在庫状況のCSVから週次経営サマリーを作って」

Claude Code がやったこと:
  1. CSVデータを自動で読み取り・集計
  2. 前週比・前年比を算出
  3. 異常値や注目ポイントを自動検出
  4. 経営サマリーレポートを自動生成
```

| | Before | After |
|---|---|---|
| 週次レポート作成 | **3時間** | **約10分**（最終確認のみ） |
| やること | データ収集→集計→グラフ作成→文章作成 | Claude Codeに指示→確認して送信 |

> 出典: [Uravation - Claude Codeで業務自動化した事例3選](https://uravation.com/media/claude-code-automation-case-studies-2026/)

---

### 課題② 予実分析に毎回時間を取られる

**経営管理あるある**: 予算と実績の差異を毎月分析して、どの費目・どの事業部が乖離しているか報告する。地道な作業の繰り返し。

| 企業・ツール | Before | After | 削減率 |
|---|---|---|---|
| 上場企業（管理会計） | 予実分析に**1日** | **1時間**で完了 | 87%削減 |
| Claude for Excel活用 | 財務モデル作成**8時間** | **30分** | 93%削減 |
| 企業分析レポート | **2日間** | **3時間** | 87%削減 |

Claude Codeに「今月の予算と実績の差異を分析して、乖離が大きい費目トップ5を理由付きでまとめて」と指示するだけ。

> 出典: [Claude in Excelとは？経営データ分析・財務シミュレーションを変えるAIアドイン](https://start-link.jp/hubspot-ai/ai/genai-work/claude-excel-business-guide)

---

### 課題③ 「今期あといくら使える？」にすぐ答えられない

**経営管理あるある**: 経営会議で突然「今の余剰資金はいくら？」と聞かれ、freeeやスプレッドシートを開いて計算し始める…

**実際の事例**: プログラミング未経験の経営企画担当者が、Claude CodeとfreeeのAPIを連携させて「毎朝8時に自動でfreeeのデータが流れ込み、余剰資金が一目でわかるダッシュボード」を構築。

**結果**: 経営会議での質問に**5秒で回答**できるようになった。

> 出典: [Rimo - Claude Codeとfreeeを使った経理ダッシュボード構築](https://rimo.app/@rimo/claude-code-dashboad)

---

### 課題④ Salesforce等のデータ集計・分析が属人的

**経営管理あるある**: CRMのデータを見たいのに、毎回エンジニアやデータ担当に依頼しないと数字が出てこない。

**Rimo社の事例**: Salesforce CLIを入れて、Claude CodeがSalesforceのデータを直接読みに行ける仕組みを構築。

- **担当者別の成績実績** → 自然言語で質問するだけ
- **月次の予実・先月比較** → マネージャーミーティング前に自動集計
- **広告分析** → **3〜5時間 → 体感7分**に短縮

> 出典: [Rimo - Claude Code for Business Users](https://rimo.app/@rimo/claude-code-for-business-users)

---

### 課題⑤ 経営会議資料の準備が大変

**経営管理あるある**: 会議前にカレンダーから参加者確認、各部門の進捗収集、KPIまとめ、アジェンダ作成…準備だけで何時間もかかる。

**Claude Codeなら**: 5体のAIエージェントチームが並列で動きます:

| エージェント | 役割 |
|---|---|
| データ収集担当 | スプレッドシートからKPI・財務データを取得 |
| 進捗確認担当 | Notionから各部門の進捗を収集 |
| コミュニケーション分析担当 | Slackから重要な議論を抽出 |
| 分析担当 | 課題を自動分類・スコアリング |
| レポート作成担当 | ブリーフィング資料をワンコマンドで生成 |

> 出典: [Claude CodeはAIネイティブ経営のための最適ツール](https://posts-tokyo.com/articles/claude-code-ai-native-management)

---

### 課題⑥ 提案書・報告書の作成に時間がかかる

| 事例 | Before | After | 効果 |
|---|---|---|---|
| SaaS企業・営業5名チーム | 提案書作成 **4.2時間** | **45分** | 89%削減、週の提出数3倍 |
| ServiceNow（29,000人） | 営業準備に数時間 | **最大95%削減** | 全社展開済み |
| 楽天 | 財務ワークフロー**1日** | **1時間** | 8倍の生産性 |
| 商談準備（営業担当） | **30分** | **2分** | コード知識不要 |

> 出典: [日経クロストレンド - 「Claude Code」を実務で使う超実践法](https://xtrend.nikkei.com/atcl/contents/18/00791/00014/)、[X - 池田朋弘氏](https://x.com/pop_ikeda/status/2035152169708789804)

---

### おまけ: この資料自体がClaude Codeで作られています

**MCP（外部ツール連携）** でGamma・GitHub・Web検索と連携し、エージェントチームが並列作業:

| 連携先 | この資料での活用 |
|---|---|
| **Gamma** | プレゼン資料を自動生成 |
| **GitHub** | ブランチ管理・コミット・プッシュを代行 |
| **Web検索** | 経営管理向け企業事例をリアルタイム収集 |

MCP = Claude Code を外部ツールにつなぐ仕組み。freee、Salesforce、Slack、Notion、Google Calendar 等と連携可能です。

---

## 3. 使い方はカンタン3ステップ

### Step 1: インストール（約5分）

```bash
# macOS / Linux
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

### Step 2: プロジェクトフォルダで起動

```bash
cd my-project
claude
```

### Step 3: 日本語で指示するだけ！

```
「ログイン機能を追加して」
「テストを実行して」
「このコードを説明して」
「READMEを日本語で作って」
```

プログラミングの知識がなくても、自然言語で話しかけるだけで使えます。

---

## 4. 知っておくと便利な機能

### CLAUDE.md（設定ファイル）

プロジェクトのルートに置くと、毎回自動で適用される「AI への指示書」:

```markdown
# プロジェクトルール
- 出力は日本語
- フレームワークは React
- テストは必ず作成すること
```

### スキル（/ コマンド）

よく使う操作をワンコマンドで:
- `/commit` → コミット作成
- `/simplify` → コード品質改善
- `/help` → 使い方確認

### フック

特定のタイミングで自動処理:
- ファイル保存時に自動フォーマット
- コミット前にリントチェック

### パーミッションモード

用途に応じて選ぶ安全設定:

| モード | 説明 | おすすめの人 |
|---|---|---|
| default | 実行前に必ず確認 | **初心者はここから** |
| acceptEdits | ファイル編集は自動許可 | 慣れてきた人 |
| plan | 読み取り専用で計画だけ作成 | 大規模変更の計画時 |
| auto | AIが安全性を判断 | Team プラン利用者 |

---

## 5. 経営管理の業務はどれくらい楽になる？（実データまとめ）

> 以下は実際の企業事例に基づく数値です。効果はタスクや環境により異なります。

| 経営管理の業務 | Before | After | 削減率 |
|---|---|---|---|
| 週次経営サマリー作成 | 3時間 | **約10分** | 94% |
| 予実分析（管理会計） | 1日 | **1時間** | 87% |
| 財務モデル作成 | 8時間 | **30分** | 93% |
| 企業分析レポート | 2日間 | **3時間** | 87% |
| 提案書・報告書作成 | 4.2時間 | **45分** | 89% |
| 営業準備（ServiceNow） | 数時間 | **数分** | 最大95% |
| 広告分析（Rimo社） | 3〜5時間 | **体感7分** | 95%超 |
| 財務ワークフロー（楽天） | 1日 | **1時間** | 87% |
| 経営会議での質問対応 | 調査に数十分 | **5秒** | - |

### 経営管理担当者にとっての最大のメリット

1. **「作業者」から「判断者」へ** - データ集計・整形はAIに任せ、分析と意思決定に集中
2. **属人化の解消** - スキル機能で手順を定型化、誰でも同じ品質のレポートを出せる
3. **リアルタイム経営** - freee・Salesforce等との自動連携で常に最新データにアクセス
4. **コスト削減** - 複数の高額SaaS（Zapier $250/月、BIツール $75/月等）を月額$20で代替可能

---

## 6. 安全に使うためのポイント

- **デフォルトで実行前に確認が入る** - 勝手にファイルを消したりしません
- **段階的に権限を広げられる** - 慣れるまでは default モードで安全に
- **危険な操作は必ず警告** - ファイル削除やforce pushなどは事前に確認
- **CLAUDE.md で禁止事項も定義可能** - 「本番環境のデータには触らない」等

**初心者のおすすめ**: まずは `default` モードで始めましょう！

---

## 7. 今日から始めよう！

### まずやること

1. **[claude.ai](https://claude.ai)** でアカウント作成（月額 $20 の Pro プランから利用可能）
2. インストールして **「こんにちは」** と話しかけてみる
3. **小さなタスクから試す**: 「このファイルを説明して」「変数名をわかりやすくして」

### 困ったら

- `/help` でClaude Code自身に使い方を聞ける
- 「このコードを説明して」で**学習ツール**としても使える
- [公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code/overview)

---

> **メッセージ**: プログラミングの知識がなくても大丈夫。
> Claude Code はあなたの「AI協力者」として、一緒に成長してくれます。

---

## 参考資料

### シリョサク（資料作成メソッド）

この資料はシリョサクの原則に基づいて構成されています:

- **1スライド1メッセージ**: 各セクションで伝えたいことは1つに絞る
- **2階建ての説明**: まず全体像（何ができるか）→ 次に具体例（実際どうやるか）
- **余白を活かす**: 情報を詰め込みすぎない
- **視線の導線**: テーブルやステップで視線を自然に誘導

### 事例の出典

- [Uravation - Claude Codeで業務自動化した事例3選｜請求書・メール・レポート](https://uravation.com/media/claude-code-automation-case-studies-2026/)
- [Rimo - Claude Codeとfreeeを使った経理ダッシュボード構築](https://rimo.app/@rimo/claude-code-dashboad)
- [Rimo - Claude Code for Business Users（Salesforce連携事例）](https://rimo.app/@rimo/claude-code-for-business-users)
- [POSTS - Claude CodeはAIネイティブ経営のための最適ツール](https://posts-tokyo.com/articles/claude-code-ai-native-management)
- [StartLink - Claude in Excelとは？経営データ分析・財務シミュレーション](https://start-link.jp/hubspot-ai/ai/genai-work/claude-excel-business-guide)
- [StartLink - 非エンジニアがClaude Codeでできること](https://start-link.jp/hubspot-ai/ai/claude-code-practice/claude-code-non-engineer-use-cases)
- [日経クロストレンド - 「Claude Code」を実務で使う超実践法 非エンジニアこそ生産性に差](https://xtrend.nikkei.com/atcl/contents/18/00791/00014/)
- [note - 「Claude Code」が変えるマネジメントの常識](https://note.com/motohiro0215/n/n16ac36a7e5d0)
- [ファネルAi - Claude Cowork Financeプラグインが経理を変える](https://funnel-ai.jp/media/claude-cowork-finance-ai/)

### 参考リンク

- [シリョサクのPowerPoint資料の作り方](https://shiryosaku.co.jp/blog/powerpoint-method-overview)
- [Claude Code 初心者完全ガイド（2026年最新）](https://www.aquallc.jp/claude-code-beginners-guide/)
- [DevelopersIO - Claude Codeを知る（2026年版）](https://dev.classmethod.jp/articles/shoma-2026-claude-code-know-use-leverage/)
- [SIOS Tech Lab - Claude Codeを初心者に伝えること](https://tech-lab.sios.jp/archives/52058)
- [Qiita - 今のClaude Codeができること](https://qiita.com/kyuko/items/77e9e022860b57e4bd4d)
