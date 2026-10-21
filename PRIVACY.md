# Privacy Policy

[한국어](PRIVACY.ko.md)

Effective: 2026-10-20

Shadow Translator collects nothing and sends nothing.

## What it reads

To show the original text under each translated paragraph, the extension reads the text of the page you are on, before Chrome translates it. That text stays in the tab's memory and is gone when the tab closes or reloads. It is never written to disk and never leaves your browser.

## What it stores

Two settings, in `chrome.storage.local` on your device:

- `isEnabled`: whether the extension is on
- `shadowStyle`: color, font size, line height and opacity of the original text

## What it sends

Nothing. The extension contains no network code: no analytics, no telemetry, no remote code, no third-party services. The source is public and short enough to check: <https://github.com/woohyun1031/Shadow-Translator>

The popup has two links to GitHub (troubleshooting and issues). They open only when you click them.

## Chrome translation is separate

The translation itself is done by Chrome's built-in translator, not by this extension. When you translate a page, Chrome sends the page text to Google. That is governed by Google's privacy policy: <https://policies.google.com/privacy>

## Permissions

| Permission                       | Why                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                        | Save the two settings above                                                                                                     |
| All sites (`<all_urls>`), frames | The original has to be captured before translation starts, and there is no way to know in advance which page you will translate |

## Changes

Changes to this policy are tracked in this file's git history.

## Contact

<https://github.com/woohyun1031/Shadow-Translator/issues>
