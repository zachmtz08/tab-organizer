// Shared task-detection logic — loaded in popup.html as a <script>
// and in background.js via importScripts().
// Uses top-level var so symbols are accessible from both contexts.

var BUILT_IN_TASKS = [
  {
    name: "Development",
    color: "blue",
    emoji: "💻",
    patterns: [
      /github\.com/, /gitlab\.com/, /bitbucket\.org/, /stackoverflow\.com/,
      /npmjs\.com/, /developer\.mozilla\.org/, /localhost/, /127\.0\.0\.1/,
      /codepen\.io/, /codesandbox\.io/, /replit\.com/, /vercel\.app/,
      /netlify\.app/, /heroku\.com/, /docs\.(python|ruby|rust|go|php)\.org/,
      /jsfiddle\.net/, /devdocs\.io/, /crates\.io/, /pkg\.go\.dev/,
    ],
  },
  {
    name: "Social",
    color: "pink",
    emoji: "💬",
    patterns: [
      /twitter\.com/, /x\.com/, /facebook\.com/, /instagram\.com/,
      /linkedin\.com/, /reddit\.com/, /tiktok\.com/, /snapchat\.com/,
      /discord\.com/, /threads\.net/, /mastodon\./, /bluesky\.social/,
    ],
  },
  {
    name: "Shopping",
    color: "green",
    emoji: "🛒",
    patterns: [
      /amazon\.com/, /ebay\.com/, /etsy\.com/, /walmart\.com/,
      /target\.com/, /bestbuy\.com/, /shopify\.com/, /shop\.app/,
      /aliexpress\.com/, /newegg\.com/, /wayfair\.com/, /chewy\.com/,
    ],
  },
  {
    name: "Entertainment",
    color: "red",
    emoji: "🎬",
    patterns: [
      /youtube\.com/, /netflix\.com/, /twitch\.tv/, /hulu\.com/,
      /disneyplus\.com/, /spotify\.com/, /soundcloud\.com/, /vimeo\.com/,
      /peacocktv\.com/, /hbomax\.com/, /max\.com/, /primevideo\.com/,
      /crunchyroll\.com/, /funimation\.com/,
    ],
  },
  {
    name: "News",
    color: "orange",
    emoji: "📰",
    patterns: [
      /cnn\.com/, /bbc\.com/, /bbc\.co\.uk/, /nytimes\.com/,
      /theguardian\.com/, /washingtonpost\.com/, /reuters\.com/,
      /techcrunch\.com/, /theverge\.com/, /wired\.com/, /arstechnica\.com/,
      /apnews\.com/, /foxnews\.com/, /nbcnews\.com/, /forbes\.com/,
      /bloomberg\.com/, /wsj\.com/, /axios\.com/, /politico\.com/,
    ],
  },
  {
    name: "Productivity",
    color: "teal",
    emoji: "📋",
    patterns: [
      /docs\.google\.com/, /sheets\.google\.com/, /slides\.google\.com/,
      /notion\.so/, /trello\.com/, /asana\.com/, /monday\.com/,
      /jira\.atlassian\.com/, /confluence\.atlassian\.com/,
      /slack\.com/, /teams\.microsoft\.com/, /zoom\.us/,
      /airtable\.com/, /clickup\.com/, /linear\.app/, /figma\.com/,
      /canva\.com/, /miro\.com/, /loom\.com/,
    ],
  },
  {
    name: "Research",
    color: "purple",
    emoji: "🔍",
    patterns: [
      /google\.com\/search/, /bing\.com\/search/, /duckduckgo\.com/,
      /wikipedia\.org/, /scholar\.google\.com/, /pubmed\.ncbi/, /arxiv\.org/,
      /jstor\.org/, /semanticscholar\.org/, /wolframalpha\.com/,
      /quora\.com/, /medium\.com/, /substack\.com/,
    ],
  },
  {
    name: "AI Tools",
    color: "cyan",
    emoji: "🤖",
    patterns: [
      /claude\.ai/, /chat\.openai\.com/, /chatgpt\.com/, /gemini\.google\.com/,
      /copilot\.microsoft\.com/, /perplexity\.ai/, /poe\.com/,
      /huggingface\.co/, /replicate\.com/, /midjourney\.com/,
      /elevenlabs\.io/, /runway\.ml/,
    ],
  },
];

var OTHER_TASK = { name: "Other", color: "grey", emoji: "🌐" };

var VALID_GROUP_COLORS = new Set([
  "grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange",
]);

function normalizeGroupColor(c) {
  return VALID_GROUP_COLORS.has(c) ? c : "grey";
}

var customRules = [];

async function loadCustomRules() {
  const data = await chrome.storage.sync.get("customRules");
  const raw = Array.isArray(data.customRules) ? data.customRules : [];
  customRules = raw
    .map((r) => {
      try {
        return { ...r, regex: new RegExp(r.pattern, "i") };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function detectTask(tab) {
  const url = (tab.url || "").toLowerCase();
  const title = (tab.title || "").toLowerCase();

  for (const rule of customRules) {
    if (rule.regex.test(url) || rule.regex.test(title)) {
      return { name: rule.name, color: rule.color, emoji: rule.emoji };
    }
  }

  for (const task of BUILT_IN_TASKS) {
    if (task.patterns.some((p) => p.test(url) || p.test(title))) {
      return task;
    }
  }
  return OTHER_TASK;
}

function knownGroupTitles() {
  const titles = new Set();
  titles.add(`${OTHER_TASK.emoji} ${OTHER_TASK.name}`);
  for (const t of BUILT_IN_TASKS) titles.add(`${t.emoji} ${t.name}`);
  for (const r of customRules) titles.add(`${r.emoji} ${r.name}`);
  return titles;
}
