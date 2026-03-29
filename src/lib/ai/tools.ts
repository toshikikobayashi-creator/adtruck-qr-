import Anthropic from "@anthropic-ai/sdk";

export const allTools: Anthropic.Tool[] = [
  // ===== Gmail =====
  {
    name: "gmail_search",
    description: "Gmailの受信トレイを検索する。「メールチェック」「〇〇からのメール」「未読メール」などに使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Gmail検索クエリ (例: 'is:unread', 'from:tanaka', 'subject:見積もり')" },
        max_results: { type: "number", description: "返すメール数の上限 (デフォルト: 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "gmail_read",
    description: "特定のメールの全文を読む。メールIDで指定。",
    input_schema: {
      type: "object" as const,
      properties: {
        message_id: { type: "string", description: "GmailメッセージID" },
      },
      required: ["message_id"],
    },
  },
  {
    name: "gmail_send",
    description: "メールを送信する。「〇〇にメール送って」「返信して」などに使用。必ず送信前にユーザーに確認すること。",
    input_schema: {
      type: "object" as const,
      properties: {
        to: { type: "string", description: "宛先メールアドレス" },
        subject: { type: "string", description: "件名" },
        body: { type: "string", description: "本文（プレーンテキスト）" },
        thread_id: { type: "string", description: "返信時のスレッドID（オプション）" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "gmail_draft_reply",
    description: "メールの返信ドラフトを自動生成する。元のメール内容を読み取り、AIが返信案を作成。",
    input_schema: {
      type: "object" as const,
      properties: {
        message_id: { type: "string", description: "返信元のGmailメッセージID" },
        instructions: { type: "string", description: "返信の方向性（例: 「丁寧にお断りする」「日程を提案する」）" },
      },
      required: ["message_id"],
    },
  },

  // ===== Google Calendar =====
  {
    name: "calendar_list_events",
    description: "カレンダーの予定を一覧表示。「今日の予定」「明日のスケジュール」「今週の会議」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "日付 (YYYY-MM-DD)。省略時は今日。" },
        days: { type: "number", description: "何日分を表示するか (デフォルト: 1)" },
      },
    },
  },
  {
    name: "calendar_create_event",
    description: "カレンダーに予定を作成。「会議を入れて」「予定を追加」に使用。必ず作成前にユーザーに確認すること。",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "予定のタイトル" },
        start_time: { type: "string", description: "開始日時 (ISO 8601)" },
        end_time: { type: "string", description: "終了日時 (ISO 8601)" },
        description: { type: "string", description: "説明" },
        attendees: { type: "array", items: { type: "string" }, description: "参加者のメールアドレス" },
        location: { type: "string", description: "場所" },
      },
      required: ["title", "start_time", "end_time"],
    },
  },
  {
    name: "calendar_find_free_time",
    description: "空き時間を検索。「いつ空いてる？」「会議の時間を探して」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "日付 (YYYY-MM-DD)" },
        duration_minutes: { type: "number", description: "必要な時間（分）" },
      },
      required: ["date"],
    },
  },

  // ===== Slack =====
  {
    name: "slack_post_message",
    description: "Slackチャンネルにメッセージを投稿。「Slackに投稿」「チームに伝えて」に使用。必ず投稿前にユーザーに確認すること。",
    input_schema: {
      type: "object" as const,
      properties: {
        channel: { type: "string", description: "チャンネル名（#なし）またはチャンネルID" },
        text: { type: "string", description: "投稿するメッセージ" },
      },
      required: ["channel", "text"],
    },
  },
  {
    name: "slack_search",
    description: "Slackメッセージを検索。「Slackで何があった？」「〇〇について」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "検索クエリ" },
        channel: { type: "string", description: "チャンネルで絞り込み（オプション）" },
      },
      required: ["query"],
    },
  },
  {
    name: "slack_get_mentions",
    description: "Slackでのメンションを取得。「Slackのメンション確認」「誰か話しかけてる？」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        since_hours: { type: "number", description: "何時間前まで遡るか (デフォルト: 24)" },
      },
    },
  },
  {
    name: "slack_summarize_channel",
    description: "Slackチャンネルの最近のメッセージを取得して要約の材料にする。「#generalの要約」「チャンネルで何があった？」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        channel: { type: "string", description: "チャンネル名またはID" },
        since_hours: { type: "number", description: "何時間前まで遡るか (デフォルト: 24)" },
      },
      required: ["channel"],
    },
  },

  // ===== Notion =====
  {
    name: "notion_create_page",
    description: "Notionにページ/メモを作成。「Notionに保存」「メモ作成」「議事録作成」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "ページタイトル" },
        content: { type: "string", description: "ページ本文（Markdown形式）" },
        database_id: { type: "string", description: "データベースID（省略時はデフォルトDB）" },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "notion_search",
    description: "Notionページを検索。「Notionで探して」「ノートを検索」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "検索クエリ" },
      },
      required: ["query"],
    },
  },
  {
    name: "notion_query_database",
    description: "Notionデータベースをクエリ。「タスク一覧」「プロジェクト表示」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        database_id: { type: "string", description: "データベースID" },
        filter: { type: "object", description: "Notionフィルターオブジェクト" },
      },
      required: ["database_id"],
    },
  },
  {
    name: "notion_update_task",
    description: "Notionのタスクを更新。「タスク完了にして」「ステータス変更」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        page_id: { type: "string", description: "ページID" },
        status: { type: "string", description: "新しいステータス (例: 'Done', 'In Progress')" },
        title: { type: "string", description: "新しいタイトル（オプション）" },
      },
      required: ["page_id"],
    },
  },
  {
    name: "notion_create_agenda",
    description: "会議のアジェンダテンプレートをNotionに作成。カレンダーのイベント情報を基に自動生成。",
    input_schema: {
      type: "object" as const,
      properties: {
        event_title: { type: "string", description: "会議タイトル" },
        event_date: { type: "string", description: "会議日時" },
        attendees: { type: "array", items: { type: "string" }, description: "参加者" },
      },
      required: ["event_title", "event_date"],
    },
  },

  // ===== Utility =====
  {
    name: "set_reminder",
    description: "リマインダーを設定。「3時間後にリマインドして」「30分後に教えて」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        message: { type: "string", description: "リマインドするメッセージ" },
        delay_minutes: { type: "number", description: "何分後にリマインドするか" },
      },
      required: ["message", "delay_minutes"],
    },
  },
  {
    name: "get_weather",
    description: "天気予報を取得。「今日の天気」「東京の天気」に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        city: { type: "string", description: "都市名 (デフォルト: Tokyo)" },
      },
    },
  },
  {
    name: "analyze_image",
    description: "画像を分析して内容を説明する。LINEで送られた画像の解析に使用。",
    input_schema: {
      type: "object" as const,
      properties: {
        image_url: { type: "string", description: "画像のURL" },
        instruction: { type: "string", description: "分析の指示（例: 「テキストを抽出して」「内容を要約して」）" },
      },
      required: ["image_url"],
    },
  },
];
