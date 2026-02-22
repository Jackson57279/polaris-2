import type { Skill } from "../../types";

import { createScrapeUrlsTool } from "./tools/scrape-urls";

export { createScrapeUrlsTool } from "./tools/scrape-urls";

interface WebResearchContext {
  internalKey: string;
}

export function webResearchSkill(_context: WebResearchContext): Skill {
  return {
    name: "Web Research",
    description: "Scrape and research content from web URLs",
    category: "core",
    tools: [
      createScrapeUrlsTool(),
    ],
    instructions: [
      "## Web Research",
      "Use scrapeUrls to gather information from external web sources.",
      "Validate URLs are properly formatted before scraping.",
      "Handle errors gracefully - some URLs may be inaccessible.",
    ].join("\n"),
    metadata: { version: "1.0.0", internal: true },
  };
}
