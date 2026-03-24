import { Client, collectPaginatedAPI, isFullPage } from "@notionhq/client";

type GetInterviewLcPagesArgs = {
  databaseId: string;
  titleProperty: string;
  teamProperty: string;
  targetTeam: string;
  automationKeyProperty: string;
  deadlineProperty: string;
};

type CreateLcPageArgs = {
  databaseId: string;
  titleProperty: string;
  statusProperty: string;
  teamProperty: string;
  deadlineProperty: string;
  automationKeyProperty: string;
  title: string;
  status: string;
  team: string;
  isoDate: string;
  automationKey: string;
};

const LC_PAGE_ICON = "🧩";
type PageProperties = Record<string, unknown>;

export type LcPageSummary = {
  id: string;
  title: string;
  automationKey?: string;
  date?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasPropertyType<TType extends string>(
  property: unknown,
  type: TType
): property is { type: TType } & Record<string, unknown> {
  return isRecord(property) && "type" in property && property.type === type;
}

function readPlainText(items: unknown): string | undefined {
  if (!Array.isArray(items)) {
    return undefined;
  }

  let value = "";
  for (const item of items) {
    if (isRecord(item) && "plain_text" in item && typeof item.plain_text === "string") {
      value += item.plain_text;
    }
  }

  return value || undefined;
}

function getTitleValue(
  properties: PageProperties,
  name: string
): string | undefined {
  const property = properties[name];
  return hasPropertyType(property, "title")
    ? readPlainText(property.title)
    : undefined;
}

function getRichTextValue(
  properties: PageProperties,
  name: string
): string | undefined {
  const property = properties[name];
  return hasPropertyType(property, "rich_text")
    ? readPlainText(property.rich_text)
    : undefined;
}

function getSelectValue(
  properties: PageProperties,
  name: string
): string | undefined {
  const property = properties[name];
  if (!hasPropertyType(property, "select")) {
    return undefined;
  }

  const select = property.select;
  return isRecord(select) && "name" in select && typeof select.name === "string"
    ? select.name
    : undefined;
}

function getDateValue(
  properties: PageProperties,
  name: string
): string | undefined {
  const property = properties[name];
  if (!hasPropertyType(property, "date")) {
    return undefined;
  }

  const date = property.date;
  return isRecord(date) && "start" in date && typeof date.start === "string"
    ? date.start
    : undefined;
}

function buildLcPageSummary(
  properties: PageProperties,
  id: string,
  args: GetInterviewLcPagesArgs
): LcPageSummary | null {
  if (getSelectValue(properties, args.teamProperty) !== args.targetTeam) {
    return null;
  }

  return {
    id,
    title: getTitleValue(properties, args.titleProperty) ?? "",
    automationKey: getRichTextValue(properties, args.automationKeyProperty),
    date: getDateValue(properties, args.deadlineProperty),
  };
}

export function createNotionClient(token: string): Client {
  return new Client({ auth: token });
}

export async function getInterviewLcPages(
  client: Client,
  args: GetInterviewLcPagesArgs
): Promise<LcPageSummary[]> {
  const results = await collectPaginatedAPI(client.databases.query, {
    database_id: args.databaseId,
    filter: {
      property: args.teamProperty,
      type: "select",
      select: {
        equals: args.targetTeam,
      },
    },
    page_size: 100,
  });

  const pages: LcPageSummary[] = [];
  for (const result of results) {
    if (!isFullPage(result)) {
      continue;
    }

    const page = buildLcPageSummary(result.properties, result.id, args);
    if (page) {
      pages.push(page);
    }
  }

  return pages;
}

export async function createLcPage(
  client: Client,
  args: CreateLcPageArgs
): Promise<void> {
  await client.pages.create({
    parent: {
      type: "database_id",
      database_id: args.databaseId,
    },
    icon: {
      type: "emoji",
      emoji: LC_PAGE_ICON,
    },
    properties: {
      [args.titleProperty]: {
        title: [
          {
            text: {
              content: args.title,
            },
          },
        ],
      },
      [args.statusProperty]: {
        status: {
          name: args.status,
        },
      },
      [args.teamProperty]: {
        select: {
          name: args.team,
        },
      },
      [args.deadlineProperty]: {
        date: {
          start: args.isoDate,
        },
      },
      [args.automationKeyProperty]: {
        rich_text: [
          {
            text: {
              content: args.automationKey,
            },
          },
        ],
      },
    },
  });
}
