import {
  findMaxLcDay,
  getNextDate,
  getNextLcTitle,
  getTodayIsoDate,
  parseLcDayNumber,
} from "./logic";
import {
  createLcPage,
  createNotionClient,
  getInterviewLcPages,
} from "./notion";

async function main(): Promise<void> {
  const { config } = await import("./config.js");

  console.log("Loaded config");

  const client = createNotionClient(config.notionToken);
  const pages = await getInterviewLcPages(client, {
    databaseId: config.databaseId,
    titleProperty: config.titleProperty,
    teamProperty: config.teamProperty,
    targetTeam: config.targetTeam,
    deadlineProperty: config.deadlineProperty,
  });

  const titles = pages.map((page) => page.title);

  const maxDay = findMaxLcDay(titles);
  const nextTitle = getNextLcTitle(maxDay, config.titlePrefix);
  const today = getTodayIsoDate(config.timeZone);

  let lcPageCount = 0;
  let latestPage: (typeof pages)[number] | null = null;
  let latestDay = 0;
  for (const page of pages) {
    const dayNumber = parseLcDayNumber(page.title);
    if (dayNumber === null) {
      continue;
    }

    lcPageCount += 1;
    if (dayNumber > latestDay) {
      latestDay = dayNumber;
      latestPage = page;
    }
  }

  const nextDate = latestPage?.date ? getNextDate(latestPage.date) : today;

  console.log(`Found ${lcPageCount} ${config.targetTeam} LC pages`);
  console.log(`Current max day: ${maxDay}`);
  console.log(`Next date: ${nextDate}`);
  console.log(`Creating: ${nextTitle}`);

  await createLcPage(client, {
    databaseId: config.databaseId,
    titleProperty: config.titleProperty,
    statusProperty: config.statusProperty,
    teamProperty: config.teamProperty,
    deadlineProperty: config.deadlineProperty,
    title: nextTitle,
    status: config.defaultStatus,
    team: config.targetTeam,
    isoDate: nextDate,
  });

  console.log("Done");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
