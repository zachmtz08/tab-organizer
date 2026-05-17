# Tab Organizer

<p align="center">
  <img src="icons/icon128.png" alt="Tab Organizer logo" width="96" />
</p>

A Chrome extension that auto-groups your tabs by task, saves named sessions, surfaces tabs you've forgotten about, and lets you write your own grouping rules — with optional pixel buddies on every page for fun.

## Features

- **Smart auto-grouping** — 14 built-in categories (Development, Social, Shopping, Entertainment, News, Productivity, Research, AI Tools, Finance, Travel, Food, Gaming, Learning, Cloud) plus a fallback "Other" bucket. Open a tab, it lands in the right group automatically.
- **One-click manual grouping** — Apply Groups turns your existing tabs into color-coded Chrome tab groups.
- **Named sessions** — save your current tabs as "Monday work" or "Vacation planning," restore them anytime, delete the ones you don't need. Sessions survive browser restarts.
- **Stale-tab rescue** — a red badge on the icon counts tabs you haven't visited in N days. One click in the popup saves them as a session and closes them.
- **Custom rules** — write your own patterns (paste a URL or type a domain) and map them to your own categories with custom names, colors, and emoji.
- **Tab search** — type any word, the list filters instantly.
- **Close duplicates** — one click kills every duplicate tab in the current window.
- **Dark mode** — light or dark, synced across your devices via Chrome sync.
- **Pixel buddies** — optional pixel-art creatures that hang out at the bottom of every page. Drag them around, hit Dance Mode, or hide them on specific sites via the blocklist.

## Install

### From the Chrome Web Store

Coming soon.

### From source (developer install)

1. Clone or download this repo:
   ```
   git clone https://github.com/zachmtz08/tab-organizer.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked** and pick the cloned folder.
5. The angry-face icon should appear in your toolbar.

## Privacy

Tab Organizer runs entirely in your browser. No data is collected, transmitted, or shared. Sessions, custom rules, and settings are stored locally via Chrome's storage API (synced across your own browsers if you're signed into a Google account).

Full privacy policy: <https://zachmtz08.github.io/tab-organizer/privacy-policy.html>

## License

[MIT](LICENSE)
