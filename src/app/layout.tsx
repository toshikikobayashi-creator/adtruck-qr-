import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Secretary",
  description: "LINE / Gmail / Google Calendar / Slack / Notion を統合したAI秘書",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
