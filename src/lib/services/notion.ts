import { Client } from "@notionhq/client";
import { logger } from "../utils/logger";
import type { NotionPage, ServiceResult } from "../../types/services";

function getClient() {
  return new Client({ auth: process.env.NOTION_API_KEY });
}

export async function createPage(
  title: string,
  content: string,
  databaseId?: string
): Promise<ServiceResult<{ pageId: string; url: string }>> {
  try {
    const notion = getClient();
    const dbId = databaseId || process.env.NOTION_DATABASE_ID;

    const children = markdownToBlocks(content);

    if (dbId) {
      // Create as database entry
      const res = await notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          title: { title: [{ text: { content: title } }] },
        },
        children,
      });
      logger.info("Notion page created in DB", { pageId: res.id });
      return { pageId: res.id, url: (res as { url?: string }).url || `https://notion.so/${res.id.replace(/-/g, "")}` };
    } else {
      // Create as standalone page
      const res = await notion.pages.create({
        parent: { page_id: process.env.NOTION_PARENT_PAGE_ID || "" },
        properties: {
          title: { title: [{ text: { content: title } }] },
        },
        children,
      });
      return { pageId: res.id, url: (res as { url?: string }).url || `https://notion.so/${res.id.replace(/-/g, "")}` };
    }
  } catch (err) {
    logger.error("Notion createPage failed", { title, error: String(err) });
    return { error: true, code: "NOTION_CREATE_FAILED", message: String(err) };
  }
}

export async function search(query: string): Promise<ServiceResult<NotionPage[]>> {
  try {
    const notion = getClient();
    const res = await notion.search({
      query,
      page_size: 10,
      sort: { direction: "descending", timestamp: "last_edited_time" },
    });

    const pages: NotionPage[] = res.results
      .filter((r): r is Extract<typeof r, { object: "page" }> => r.object === "page")
      .map((page) => ({
        id: page.id,
        title: extractTitle(page),
        url: (page as { url?: string }).url || "",
        last_edited: (page as { last_edited_time?: string }).last_edited_time || "",
      }));

    return pages;
  } catch (err) {
    logger.error("Notion search failed", { query, error: String(err) });
    return { error: true, code: "NOTION_SEARCH_FAILED", message: String(err) };
  }
}

export async function queryDatabase(
  databaseId: string,
  filter?: Record<string, unknown>
): Promise<ServiceResult<NotionPage[]>> {
  try {
    const notion = getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = { database_id: databaseId, page_size: 50 };
    if (filter) params.filter = filter;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion.databases as any).query(params);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages: NotionPage[] = (res.results as Array<Record<string, unknown>>)
      .filter((r) => r.object === "page")
      .map((page) => ({
        id: page.id as string,
        title: extractTitle(page),
        url: (page.url as string) || "",
        last_edited: (page.last_edited_time as string) || "",
        properties: page.properties as Record<string, unknown>,
      }));

    return pages;
  } catch (err) {
    logger.error("Notion queryDatabase failed", { databaseId, error: String(err) });
    return { error: true, code: "NOTION_QUERY_FAILED", message: String(err) };
  }
}

export async function updateTask(
  pageId: string,
  updates: { status?: string; title?: string }
): Promise<ServiceResult<{ success: true }>> {
  try {
    const notion = getClient();
    const properties: Record<string, unknown> = {};

    if (updates.status) {
      properties["Status"] = { status: { name: updates.status } };
    }
    if (updates.title) {
      properties["title"] = { title: [{ text: { content: updates.title } }] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await notion.pages.update({ page_id: pageId, properties } as any);
    logger.info("Notion task updated", { pageId, updates });
    return { success: true };
  } catch (err) {
    logger.error("Notion updateTask failed", { pageId, error: String(err) });
    return { error: true, code: "NOTION_UPDATE_FAILED", message: String(err) };
  }
}

export async function createAgenda(
  eventTitle: string,
  eventDate: string,
  attendees?: string[]
): Promise<ServiceResult<{ pageId: string; url: string }>> {
  const content = [
    `# ${eventTitle}`,
    `日時: ${eventDate}`,
    attendees ? `参加者: ${attendees.join(", ")}` : "",
    "",
    "## アジェンダ",
    "- [ ] ",
    "",
    "## 議事メモ",
    "",
    "",
    "## アクションアイテム",
    "- [ ] ",
  ]
    .filter(Boolean)
    .join("\n");

  return createPage(`📋 ${eventTitle} - アジェンダ`, content);
}

// Helper: extract title from Notion page
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTitle(page: any): string {
  const props = page.properties || {};
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop.type === "title" && prop.title?.length > 0) {
      return prop.title.map((t: { plain_text: string }) => t.plain_text).join("");
    }
  }
  return "(無題)";
}

// Helper: convert simple markdown to Notion blocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function markdownToBlocks(markdown: string): any[] {
  const lines = markdown.split("\n");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: any[] = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: [{ text: { content: line.slice(2) } }] },
      });
    } else if (line.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ text: { content: line.slice(3) } }] },
      });
    } else if (line.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: [{ text: { content: line.slice(4) } }] },
      });
    } else if (line.startsWith("- [ ] ")) {
      blocks.push({
        object: "block",
        type: "to_do",
        to_do: { rich_text: [{ text: { content: line.slice(6) } }], checked: false },
      });
    } else if (line.startsWith("- [x] ")) {
      blocks.push({
        object: "block",
        type: "to_do",
        to_do: { rich_text: [{ text: { content: line.slice(6) } }], checked: true },
      });
    } else if (line.startsWith("- ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [{ text: { content: line.slice(2) } }] },
      });
    } else if (line.trim() === "") {
      // Skip empty lines
    } else {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ text: { content: line } }] },
      });
    }
  }

  return blocks;
}
