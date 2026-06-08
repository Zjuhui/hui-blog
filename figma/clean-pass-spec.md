# Clean Pass Spec

This is the Figma-ready design spec for `珲 Blog v0.1` after uninstalling the temporary `taste-skill`.

## Status

- Figma file: https://www.figma.com/design/KcZFkNsH1kX69UJdzT9mwz
- Skill status: `taste-skill` was uninstalled before this clean pass.
- Figma sync status: blocked by Figma Starter plan MCP call limit.

## Design Read

`珲` is a personal bilingual research blog and portfolio archive. It should feel like a quiet research hatch: dark, hard-edged, bilingual, and easy to keep updating.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#0A0B0C` | Page background |
| Paper | `#F1EDE3` | Primary text |
| Paper Dim | `#B8B3A8` | Secondary text |
| Line | `#303335` | Dividers |
| Cyan | `#00C7EA` | Primary accent |
| Seal Red | `#BD291F` | Optional avatar seal only |

## Typography

- English interface: Inter
- Chinese body: Noto Sans SC
- Calligraphic mark: LXGW WenKai TC
- Letter spacing: `0`
- Display heading line-height: about `0.98`
- Body line-height: `1.45` to `1.6`

## Desktop Home

Frame: `1440 x 1580`

1. Header:
   - Left: square `珲` mark, `HUI` wordmark.
   - Right: `Research / Life / Works / Archive`.
   - Single divider line below.

2. Hero:
   - Large, low-opacity `珲` watermark on the left.
   - Thin cyan vertical rule near the center.
   - Right-side headline:
     `If You Are Nothing Without AI, Then You Shouldn't Have It!`
   - Chinese subtitle:
     `科研、生活与作品集的长期记录场。先写，再生长。`
   - Method line:
     `Markdown / Notion / GitHub Pages / Figma / Git`

3. Sections:
   - Three horizontal editorial lanes, not boxed cards:
     `Research`, `Life`, `Works`.
   - Each lane has a top rule, title, short Chinese description, and file target.

4. Week 01:
   - Heading: `Week 01`
   - Note: `先写两篇，先让系统活起来。`
   - Two post rows:
     - `为什么要做这个博客`
     - `如何制作这样的博客`

## Mobile Home

Frame: `390 x 1180`

- Header stacks into mark + compact nav.
- Hero keeps the same hierarchy:
  watermark, cyan rule, headline, Chinese subtitle.
- Only `Research` and `Life` section lanes appear above the fold.
- `Week 01` preview appears at the bottom.

## Article Template

Frame: `980 x 1180`

- Small mark and archive path in header.
- Metadata line.
- Chinese title.
- Chinese lead paragraph.
- Divider.
- `中文草稿` and `English Draft` sections.

## Figma Recovery Steps

When Figma MCP quota is available again:

1. Open the Figma file above.
2. Clear incomplete partial frames if the failed write left any.
3. Create four frames:
   - `Home / Desktop 1440 / Clean pass`
   - `Home / Mobile 390 / Clean pass`
   - `Article / Template / Clean pass`
   - `System / v0.1 Clean notes`
4. Rebuild using the tokens and layout rules in this file.

