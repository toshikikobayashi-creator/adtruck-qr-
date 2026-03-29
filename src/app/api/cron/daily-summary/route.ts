import { NextRequest, NextResponse } from "next/server";
import { pushMessage } from "@/lib/services/line";
import { search as gmailSearch } from "@/lib/services/gmail";
import { listEvents } from "@/lib/services/calendar";
import { getMentions } from "@/lib/services/slack";
import { getWeather } from "@/lib/services/weather";
import { getDueReminders } from "@/lib/store/kv";
import { generateSummary } from "@/lib/ai/claude-client";
import { todayJST } from "@/lib/utils/date";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = process.env.LINE_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "LINE_USER_ID not configured" }, { status: 500 });
  }

  try {
    // Fetch all data in parallel
    const [events, emails, slackMentions, weatherData, reminders] = await Promise.allSettled([
      listEvents(todayJST(), 1),
      gmailSearch("is:unread", 10),
      getMentions(12),
      getWeather(),
      getDueReminders(),
    ]);

    const summary = await generateSummary({
      type: "daily",
      events: events.status === "fulfilled" ? events.value : null,
      emails: emails.status === "fulfilled" ? emails.value : null,
      slackMentions: slackMentions.status === "fulfilled" ? slackMentions.value : null,
      weather: weatherData.status === "fulfilled" ? weatherData.value : null,
    });

    // Send daily summary
    await pushMessage(userId, `🌅 おはようございます！\n\n${summary}`);

    // Send due reminders
    if (reminders.status === "fulfilled" && reminders.value.length > 0) {
      for (const reminder of reminders.value) {
        await pushMessage(userId, `⏰ リマインダー: ${reminder.message}`);
      }
    }

    logger.info("Daily summary sent");
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    logger.error("Daily summary failed", { error: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
