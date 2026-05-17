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
  {
    name: "Finance",
    color: "yellow",
    emoji: "💰",
    patterns: [
      /chase\.com/, /bankofamerica\.com/, /wellsfargo\.com/, /citi\.com/,
      /usbank\.com/, /capitalone\.com/, /pnc\.com/, /americanexpress\.com/,
      /paypal\.com/, /venmo\.com/, /cash\.app/, /zelle\.com/, /stripe\.com/,
      /robinhood\.com/, /fidelity\.com/, /schwab\.com/, /vanguard\.com/,
      /etrade\.com/, /tdameritrade\.com/, /coinbase\.com/, /binance\.com/,
      /kraken\.com/, /mint\.intuit\.com/, /creditkarma\.com/, /nerdwallet\.com/,
    ],
  },
  {
    name: "Travel",
    color: "cyan",
    emoji: "✈️",
    patterns: [
      /airbnb\.com/, /booking\.com/, /expedia\.com/, /kayak\.com/,
      /hotels\.com/, /priceline\.com/, /tripadvisor\.com/, /trivago\.com/,
      /delta\.com/, /united\.com/, /southwest\.com/, /aa\.com/, /jetblue\.com/,
      /alaskaair\.com/, /spirit\.com/, /frontier\.com/, /skyscanner\.com/,
      /maps\.google\.com/, /google\.com\/maps/, /waze\.com/, /mapquest\.com/,
      /lonelyplanet\.com/, /hopper\.com/,
    ],
  },
  {
    name: "Food",
    color: "orange",
    emoji: "🍔",
    patterns: [
      /doordash\.com/, /ubereats\.com/, /grubhub\.com/, /postmates\.com/,
      /seamless\.com/, /caviar\.com/, /yelp\.com/, /opentable\.com/,
      /resy\.com/, /tock\.com/, /allrecipes\.com/, /foodnetwork\.com/,
      /bonappetit\.com/, /seriouseats\.com/, /epicurious\.com/, /tasty\.co/,
      /instacart\.com/, /hellofresh\.com/, /blueapron\.com/, /freshly\.com/,
    ],
  },
  {
    name: "Gaming",
    color: "purple",
    emoji: "🎮",
    patterns: [
      /steamcommunity\.com/, /steampowered\.com/,
      /epicgames\.com/, /gog\.com/, /battle\.net/, /blizzard\.com/,
      /minecraft\.net/, /roblox\.com/, /ea\.com/, /ubisoft\.com/,
      /playstation\.com/, /xbox\.com/, /nintendo\.com/,
      /ign\.com/, /gamespot\.com/, /polygon\.com/, /kotaku\.com/,
      /itch\.io/, /humblebundle\.com/, /speedrun\.com/, /chess\.com/,
    ],
  },
  {
    name: "Learning",
    color: "blue",
    emoji: "🎓",
    patterns: [
      /coursera\.org/, /udemy\.com/, /edx\.org/, /khanacademy\.org/,
      /udacity\.com/, /codecademy\.com/, /freecodecamp\.org/, /duolingo\.com/,
      /brilliant\.org/, /masterclass\.com/, /skillshare\.com/,
      /pluralsight\.com/, /linkedin\.com\/learning/, /lynda\.com/,
      /canvas\.instructure\.com/, /blackboard\.com/, /moodle/,
    ],
  },
  {
    name: "Cloud",
    color: "grey",
    emoji: "☁️",
    patterns: [
      /aws\.amazon\.com/, /console\.aws\.amazon\.com/, /signin\.aws\.amazon\.com/,
      /cloud\.google\.com/, /console\.cloud\.google\.com/,
      /azure\.microsoft\.com/, /portal\.azure\.com/,
      /digitalocean\.com/, /linode\.com/, /vultr\.com/, /hetzner\.com/,
      /cloudflare\.com/, /fastly\.com/, /ngrok\.com/,
      /supabase\.com/, /firebase\.google\.com/, /planetscale\.com/, /neon\.tech/,
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
var customGroups = [];
var activeGroupSet = null; // null = all active by default

async function loadCustomRules() {
  const data = await chrome.storage.sync.get("customRules");
  const raw = Array.isArray(data.customRules) ? data.customRules : [];
  customRules = raw
    .map((r) => {
      if (!r || !r.pattern) return null;
      // Try the pattern both as regex and as a plain substring — whichever
      // hits at match-time wins. Pasting a raw URL works (substring match);
      // explicit regex like ^github\.com$ also works (regex match). If the
      // pattern can't compile as a regex, the substring path still works.
      let regex = null;
      try {
        regex = new RegExp(r.pattern, "i");
      } catch {
        /* fall back to substring-only */
      }
      return { ...r, regex, needle: r.pattern.toLowerCase() };
    })
    .filter(Boolean);
}

function ruleMatches(rule, url, title) {
  if (rule.regex && (rule.regex.test(url) || rule.regex.test(title))) return true;
  if (rule.needle && (url.includes(rule.needle) || title.includes(rule.needle))) return true;
  return false;
}

async function loadCustomGroups() {
  const data = await chrome.storage.sync.get("customGroups");
  customGroups = Array.isArray(data.customGroups) ? data.customGroups : [];
}

async function loadActiveGroups() {
  const data = await chrome.storage.sync.get("activeGroups");
  if (Array.isArray(data.activeGroups)) {
    activeGroupSet = new Set(data.activeGroups);
  } else {
    activeGroupSet = null;
  }
}

function isGroupActive(name) {
  return !activeGroupSet || activeGroupSet.has(name);
}

function resolveRuleGroup(rule) {
  // New shape: rule references a group by name.
  if (rule.groupName) {
    const custom = customGroups.find((g) => g.name === rule.groupName);
    if (custom) return { name: custom.name, color: custom.color, emoji: custom.emoji };
    const builtin = BUILT_IN_TASKS.find((t) => t.name === rule.groupName);
    if (builtin) return { name: builtin.name, color: builtin.color, emoji: builtin.emoji };
    return null; // orphaned: caller decides fallback
  }
  // Legacy shape: rule carries name/color/emoji inline.
  if (rule.name) return { name: rule.name, color: rule.color, emoji: rule.emoji };
  return null;
}

function detectTask(tab) {
  const url = (tab.url || "").toLowerCase();
  const title = (tab.title || "").toLowerCase();

  for (const rule of customRules) {
    if (!ruleMatches(rule, url, title)) continue;
    // Skip rules whose target group has been turned off — let detection
    // fall through to subsequent rules or built-ins.
    if (rule.groupName && !isGroupActive(rule.groupName)) continue;
    if (!rule.groupName && rule.name && !isGroupActive(rule.name)) continue;
    const resolved = resolveRuleGroup(rule);
    if (resolved) return resolved;
  }

  for (const task of BUILT_IN_TASKS) {
    if (!isGroupActive(task.name)) continue;
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
  for (const g of customGroups) titles.add(`${g.emoji} ${g.name}`);
  // Legacy: rules with inline emoji/name.
  for (const r of customRules) {
    if (r.name && r.emoji) titles.add(`${r.emoji} ${r.name}`);
  }
  return titles;
}
