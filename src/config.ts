import { config as loadEnv } from "dotenv";

loadEnv();

function envValue(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export const config = {
  notionToken: envValue("NOTION_TOKEN"),
  databaseId: envValue("NOTION_DATABASE_ID"),
  titleProperty: envValue("NOTION_TITLE_PROPERTY"),
  statusProperty: envValue("NOTION_STATUS_PROPERTY"),
  teamProperty: envValue("NOTION_TEAM_PROPERTY"),
  deadlineProperty: envValue("NOTION_DEADLINE_PROPERTY"),
  targetTeam: envValue("TARGET_TEAM"),
  defaultStatus: envValue("DEFAULT_STATUS"),
  titlePrefix: envValue("TITLE_PREFIX"),
  timeZone: envValue("TIME_ZONE", "America/New_York"),
} as const;

export type Config = typeof config;
