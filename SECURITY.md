# Security Policy

## Supported versions

Only the latest version on the Chrome Web Store is supported. Fixes ship as a new store release.

## Reporting a vulnerability

Report privately through GitHub: **Security** tab → **Report a vulnerability**
(<https://github.com/woohyun1031/Shadow-Translator/security/advisories/new>).

Do not open a public issue for a security problem.

Include:

- Extension version (shown at the bottom of the popup)
- Chrome version and OS
- A page or HTML snippet that reproduces it
- What an attacker gains

Reports are answered within 7 days. Korean or English is fine.

## Scope

The extension runs a content script on every site and frame (`<all_urls>`, `all_frames`) and writes text it read from the page back into that page. That is where problems are most likely:

- A page making the extension inject markup or script (the original text must only ever be inserted as text)
- The extension leaking page text across frames or origins
- Any network request made by the extension. It is designed to make none.

Out of scope: Chrome's own translation and what Chrome sends to Google to perform it. See [PRIVACY.md](PRIVACY.md).
