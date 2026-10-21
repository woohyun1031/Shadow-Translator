<p align="center">
  <img src="assets/logo.svg" width="64" height="64" alt="Shadow Translator logo">
</p>

<h1 align="center">Shadow Translator</h1>

<p align="center">
  Shows the original text under Chrome's page translation results.<br>
  <sub>Google Chrome on desktop only.</sub>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/njhfceigjibchcnokjaoapmobelimlnm">Chrome Web Store</a> ·
  <a href="README.ko.md">한국어</a>
</p>

<!-- <p align="center">
  <img src="docs/screenshot-en.png" width="570" alt="A Korean page translated into English by Chrome, with the Korean original shown in gray under each paragraph">
</p> -->

---

## Overview

Chrome's page translation replaces the original text.  
Shadow Translator shows the original in gray under each paragraph Chrome translates.  
Chrome does the translating; this extension only adds the original underneath.

## Features

- **How to use:** Install it, then translate a page with Chrome. The original appears right away. (Tabs that were already open need a reload)
- **Original alongside:** The original under every translated paragraph (removed when you turn translation off)
- **Same translation flow:** Use the translate icon in the address bar or the right-click menu, as usual
- **All languages:** Works with every language Chrome translation supports
- **No strings attached:** No sign-up, no payment, no usage limits
- **Simple and safe:** No server communication, about 23 KB
- **Customizable:** Color, font size, line height and opacity of the original

## Notes

- **Google Chrome only.** Chromium-based browsers such as Edge, Whale and Brave use different built-in translators, so it won't work properly there.
- **About access to all sites:** There's no way to know in advance which page you'll translate, so the original has to be captured before translation starts. No data is sent anywhere; see [PRIVACY.md](PRIVACY.md) for details.
- **Affected by Chrome changes:** It follows how Chrome's translator changes the page DOM, so a Chrome update may temporarily stop it from working.

## Troubleshooting

| Symptom                            | Fix                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| No original appears                | The tab was open before installing. Reload the page and translate again.                                                                    |
| Some paragraphs have no original   | The original matches the translation, or the area loaded dynamically before the original could be captured.                                 |
| Doesn't work in Edge, Whale, Brave | Google Chrome only. See [Notes](#notes).                                                                                                    |
| Page layout looks broken           | Turn the extension off for now from the toolbar and [report a problem](https://github.com/woohyun1031/Shadow-Translator/issues/new/choose). |

## Development

```bash
npm ci
npm run build       # production build → dist/
npm run watch       # development build with watch
npm test            # Vitest + jsdom
npm run typecheck   # tsc --noEmit
npm run format      # Prettier
```

Turn on Developer mode at chrome://extensions and load dist/ with Load unpacked.  
Pull requests are always welcome. Run `npm test`, `npm run typecheck` and `npm run format` before submitting.

For security reports, see [SECURITY.md](https://github.com/woohyun1031/Shadow-Translator/security/policy).

## License

[MIT](LICENSE)
