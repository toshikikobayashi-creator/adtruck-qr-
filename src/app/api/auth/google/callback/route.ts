import { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/lib/auth/google-oauth";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
  }

  try {
    await handleCallback(code);
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h1>✅ Google認証が完了しました</h1>
            <p>Gmail・Googleカレンダーとの連携が有効になりました。</p>
            <p>このページを閉じて、LINEに戻ってください。</p>
          </div>
        </body>
      </html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    logger.error("Google OAuth callback failed", { error: String(err) });
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h1>❌ 認証に失敗しました</h1>
            <p>${String(err)}</p>
            <p><a href="/api/auth/google">もう一度試す</a></p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
