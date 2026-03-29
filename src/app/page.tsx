export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          AI Secretary
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          LINE / Gmail / Google Calendar / Slack / Notion を統合したAI秘書
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Feature icon="💬" title="LINE連携" description="LINEで話しかけるだけで各サービスを操作" />
          <Feature icon="📧" title="Gmail" description="メール検索・閲覧・送信・返信ドラフト生成" />
          <Feature icon="📅" title="カレンダー" description="予定確認・作成・空き時間検索" />
          <Feature icon="💼" title="Slack" description="投稿・検索・メンション確認・チャンネル要約" />
          <Feature icon="📝" title="Notion" description="メモ作成・タスク管理・アジェンダ生成" />
          <Feature icon="🤖" title="AI分析" description="自然言語指示・画像解析・日次サマリー" />
        </div>

        <div className="space-y-3">
          <StatusBadge label="Webhook" path="/api/webhook/line" />
          <StatusBadge label="Google認証" path="/api/auth/google" />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm text-left">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

function StatusBadge({ label, path }: { label: string; path: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 rounded-full px-4 py-2 shadow-sm text-sm mr-2">
      <span className="w-2 h-2 bg-green-400 rounded-full" />
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <code className="text-xs text-gray-400">{path}</code>
    </div>
  );
}
