import { NextRequest, NextResponse } from "next/server";
import { pushMessage } from "@/lib/services/line";
import { search as gmailSearch } from "@/lib/services/gmail";
import { getUpcomingEvents } from "@/lib/services/calendar";
import { getMentions } from "@/lib/services/slack";
import { getWatermark, setWatermark, getDueReminders } from "@/lib/store/kv";
import { formatJST } from "@/lib/utils/date";
import { isServiceError } from "@/types/services";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = process.env.LINE_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "LINE_USER_ID not configured" }, { status: 500 });
  }

  const notifications: string[] = [];

  try {
    // 1. Check Gmail for new unread messages
    const gmailWatermark = await getWatermark("gmail");
    const emails = await gmailSearch("is:unread", 5);
    if (!isServiceError(emails) && Array.isArray(emails) && emails.length > 0) {
      const newEmails = emails.filter((e) => new Date(e.date).getTime() > gmailWatermark);
      if (newEmails.length > 0) {
        const lines = newEmails.map((e) => `  📧 ${e.from}: ${e.subject}`);
        notifications.push(`📬 新着メール ${newEmails.length}件:\n${lines.join("\n")}`);
        await setWatermark("gmail", Date.now());
      }
    }

    // 2. Check Calendar for upcoming events (within 15 min)
    const upcomingEvents = await getUpcomingEvents(15);
    const calWatermark = await getWatermark("calendar");
    const newEvents = upcomingEvents.filter(
      (e) => new Date(e.start).getTime() > calWatermark
    );
    if (newEvents.length > 0) {
      for (const event of newEvents) {
        let msg = `📅 まもなく開始: ${event.title}\n  ⏰ ${formatJST(event.start, "HH:mm")}`;
        if (event.meeting_url) {
          msg += `\n  🔗 ${event.meeting_url}`;
        }
        if (event.location) {
          msg += `\n  📍 ${event.location}`;
        }
        notifications.push(msg);
      }
      await setWatermark("calendar", Date.now());
    }

    // 3. Check Slack mentions
    const slackWatermark = await getWatermark("slack");
    const mentions = await getMentions(1); // last 1 hour
    if (!isServiceError(mentions) && Array.isArray(mentions) && mentions.length > 0) {
      const newMentions = mentions.filter(
        (m) => parseFloat(m.timestamp) * 1000 > slackWatermark
      );
      if (newMentions.length > 0) {
        const lines = newMentions.map(
          (m) => `  💬 #${m.channel_name || m.channel}: ${m.user}: ${m.text.slice(0, 100)}`
        );
        notifications.push(`🔔 Slackメンション ${newMentions.length}件:\n${lines.join("\n")}`);
        await setWatermark("slack", Date.now());
      }
    }

    // 4. Check due reminders
    const reminders = await getDueReminders();
    for (const reminder of reminders) {
      notifications.push(`⏰ リマインダー: ${reminder.message}`);
    }

    // Send notifications
    if (notifications.length > 0) {
      await pushMessage(userId, notifications.join("\n\n"));
      logger.info("Notifications sent", { count: notifications.length });
    }

    return NextResponse.json({ status: "ok", notifications: notifications.length });
  } catch (err) {
    logger.error("Notification check failed", { error: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
