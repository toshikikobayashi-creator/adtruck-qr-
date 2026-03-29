import { OAuth2Client } from "google-auth-library";
import { getGoogleTokens, saveGoogleTokens } from "../store/kv";
import { logger } from "../utils/logger";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function handleCallback(code: string): Promise<void> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Failed to get tokens from Google");
  }

  await saveGoogleTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
  });

  logger.info("Google OAuth tokens saved successfully");
}

export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const client = createOAuth2Client();

  // Try KV first
  let tokens = await getGoogleTokens();

  // Fallback to env vars (for initial setup before OAuth flow)
  if (!tokens) {
    const envAccess = process.env.GOOGLE_ACCESS_TOKEN;
    const envRefresh = process.env.GOOGLE_REFRESH_TOKEN;
    if (envAccess && envRefresh) {
      tokens = {
        access_token: envAccess,
        refresh_token: envRefresh,
        expiry_date: 0, // force refresh
      };
    }
  }

  if (!tokens) {
    throw new Error("GOOGLE_AUTH_REQUIRED: Please authenticate at /api/auth/google");
  }

  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Auto-refresh if expired
  if (tokens.expiry_date < Date.now()) {
    try {
      const { credentials } = await client.refreshAccessToken();
      await saveGoogleTokens({
        access_token: credentials.access_token!,
        refresh_token: tokens.refresh_token, // keep original refresh token
        expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
      });
      client.setCredentials(credentials);
      logger.info("Google OAuth tokens refreshed");
    } catch (err) {
      logger.error("Failed to refresh Google tokens", { error: String(err) });
      throw new Error("GOOGLE_AUTH_EXPIRED: Please re-authenticate at /api/auth/google");
    }
  }

  return client;
}
