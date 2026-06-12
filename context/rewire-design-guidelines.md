---
summary: REWIRE editorial design system for standalone HTML pages — HBS case-packet look (serif body, crimson accent, semantic color code), self-contained CSS block + component recipes
topics: [brand, design, ui, css, html]
agents: [dev-designer, dev-frontend, analytics, hub-countries-pm]
---

# REWIRE Brand — Reusable Design System

Extracted from `REWIRE - KYC Manual Review.html`. Drop the CSS block at the bottom into any standalone HTML page and use the component recipes below. Everything is self-contained — no fonts to load, no libraries, prints cleanly.

---

## Design intent

Editorial, not dashboard. The look borrows from HBS case packets: serif body text on near-white paper, a single crimson accent, sans-serif reserved for "apparatus" (labels, tables, captions). Color is never decoration — every color is semantic and means the same thing everywhere in the document.

---

## Color palette

### Core

| Token | Hex | Use |
|---|---|---|
| `--crimson` | `#A41034` | The one accent. Section badges, h3 labels, callout borders, score dots. HBS crimson. |
| `--navy` | `#1a2744` | Masthead background, table headers. |
| `--ink` | `#222a35` | Body text. |
| `--muted` | `#5b6573` | Captions, notes, legends, secondary text. |
| `--line` | `#d8dee6` | All borders and dividers. |
| `--paper` | `#fafbfc` | Page background. Cards sit on it in pure `#fff`. |

### Semantic (the color code — keep it consistent within a document)

Each semantic color is a pair: a strong border/text color + a pale background tint.

| Meaning | Border / text | Background | Used for |
|---|---|---|---|
| AI / automated | `--ai` `#1565c0` | `--ai-bg` `#e8f1fb` | AI-agent steps |
| Human-led | `--human` `#c45f00` | `--human-bg` `#fdf0e3` | Human steps |
| Decision / shared | `--decision` `#6a3aa0` | `--decision-bg` `#f3ecfa` | Decision gates, shared human+AI steps |
| Exception / risk | `--exception` `#c62828` | `--exception-bg` `#fdebea` | Bottlenecks, escalations, bad metrics |
| System of record | `--system` `#5b6573` | `--system-bg` `#eef1f4` | Unchanged system steps |
| Positive / go | `--good` `#1b7a4b` | `--good-bg` `#e7f5ee` | Targets, GO calls, outcomes |

Rule of thumb: pale tint fills the shape, strong color does border *and* text inside it. Never mix (e.g., red text on a blue tint).

---

## Typography

- **Body:** `Georgia, 'Times New Roman', serif` — 14.5px, line-height 1.5. All prose, list items, callouts.
- **Apparatus:** `'Segoe UI', Helvetica, Arial, sans-serif` — tables, labels, captions, flowchart nodes, pills, legends.
- **Section labels (h3):** sans, 12px, UPPERCASE, `letter-spacing: 2px`, crimson. This is the signature move — small crimson caps introduce every block.
- **Big headings (h1/h2):** serif, `font-weight: normal`. Size carries the hierarchy, not weight.
- **Notes/captions:** sans, 12px, italic, muted.
- Emphasis inside prose: `<b>` for the load-bearing phrase at the start of a bullet; `<i>` sparingly for spoken stress.

---

## Layout

- Content column: `max-width: 1060px`, centered, `padding: 30px 36px`.
- Each major section = a **stage card**: white, `1px solid var(--line)`, `border-radius: 8px`, `42px` between cards.
- Card header: 40px round badge (crimson, white letter) + title + italic subtitle, separated from body by a hairline.
- Optional progress tracker on the right of each card header: the sequence letters in pale gray with the current one in crimson bold (`R E <b>W</b> I R E`).
- Print: cards avoid page breaks (`break-inside: avoid-page`).

---

## Components

### Stat pills
Horizontal row of small rounded boxes; big number on top, one-line caption below. Red pair (`bad`) for pain metrics, green pair (`goal`) for targets.

```html
<div class="pillrow">
  <div class="pill bad"><b>~70%</b>of alerts are false alarms</div>
  <div class="pill goal"><b>&lt;4 hrs</b>target review time</div>
</div>
```

### Tables
Navy header row, white/`#f6f8fa` zebra rows, hairline borders, 12.5px sans. Highlight a problem cell with `class="hot"` (red tint + red bold text). Keep a `width:%` on the first few `<th>` to control the layout.

### Flowcharts (pure CSS, no library)
Vertical stack, centered:
- `fnode` — rounded box, 1.6px border, semantic class (`ai`, `human`, `shared`, `exception`, `system`). Bold first line + `<small>` caption.
- `arrow` — a centered `▼` in gray.
- `fdiamond` — decision gate: purple skewed box (`transform: skewX(-12deg)`, inner `<span>` skewed back).
- `branch` > `col` — side-by-side outcomes, each topped with a tiny bold `blabel` ("yes" / "no" / "low risk").
- End every flowchart with a `legend` row of color chips.

```html
<div class="flow">
  <div class="fnode system">Trigger<small>caption</small></div>
  <div class="arrow">▼</div>
  <div class="fdiamond"><span>Decision?</span></div>
  <div class="branch">
    <div class="col"><div class="blabel">yes</div><div class="fnode ai">AI step<small>caption</small></div></div>
    <div class="col"><div class="blabel">no</div><div class="fnode human">Human step<small>caption</small></div></div>
  </div>
</div>
```

### Callouts
Left-border blocks for verdicts and summaries: crimson on blush (`callout`) for key statements, green (`callout go`) for GO/positive calls.

### Score bars
Inline 1–5 dots in crimson: `<span class="dots">●●●○○</span>` next to a bold label.

### Thesis strip (optional)
Full-width dark navy bar under the masthead carrying one sentence in sans — the document's argument in one line.

---

## Voice pairing (what makes the design work)

- Lead every bullet with a **bolded 2–4 word claim**, then the sentence.
- Captions inside flowchart nodes carry the evidence ("⚠ ~70% false alarms, each cleared by hand") — the node title stays short.
- Mark illustrative data with a single italic note: *Numbers are illustrative.* Once, not on every figure.

---

## The CSS (copy-paste)

```css
:root{
  --crimson:#A41034; --navy:#1a2744; --ink:#222a35; --muted:#5b6573;
  --ai:#1565c0; --ai-bg:#e8f1fb; --human:#c45f00; --human-bg:#fdf0e3;
  --decision:#6a3aa0; --decision-bg:#f3ecfa; --exception:#c62828; --exception-bg:#fdebea;
  --system:#5b6573; --system-bg:#eef1f4; --good:#1b7a4b; --good-bg:#e7f5ee;
  --line:#d8dee6; --paper:#fafbfc;
}
*{box-sizing:border-box; margin:0; padding:0;}
body{font-family:Georgia,'Times New Roman',serif; color:var(--ink); background:var(--paper); line-height:1.5;}
main{max-width:1060px; margin:0 auto; padding:30px 36px 70px;}

/* stage card */
section.stage{margin-top:42px; background:#fff; border:1px solid var(--line); border-radius:8px; overflow:hidden;}
.stage-head{display:flex; align-items:center; gap:14px; padding:16px 24px; border-bottom:1px solid var(--line);}
.stage-badge{width:40px; height:40px; border-radius:50%; background:var(--crimson); color:#fff;
  font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-weight:700; font-size:19px;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;}
.stage-head h2{font-size:21px; font-weight:normal;}
.stage-head .gets{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; color:var(--muted); font-style:italic;}
.tracker{margin-left:auto; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; letter-spacing:2px; color:#b9c2cd;}
.tracker b{color:var(--crimson);}
.stage-body{padding:22px 24px 26px;}

/* type */
h3{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:var(--crimson); margin:26px 0 10px;}
h3:first-child{margin-top:0;}
p{font-size:14.5px; margin-bottom:10px;}
p.note{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; color:var(--muted); font-style:italic;}
ol.exec, ul.exec{font-size:14.5px; padding-left:22px; margin:6px 0 10px;}
ol.exec li, ul.exec li{margin-bottom:7px;}

/* tables */
table{width:100%; border-collapse:collapse; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12.5px; margin:8px 0 4px;}
th{background:var(--navy); color:#fff; text-align:left; padding:8px 10px; font-weight:600; font-size:11.5px; letter-spacing:.4px;}
td{border:1px solid var(--line); padding:8px 10px; vertical-align:top; background:#fff;}
tr:nth-child(even) td{background:#f6f8fa;}
td.hot{background:var(--exception-bg)!important; color:var(--exception); font-weight:600;}

/* stat pills */
.pillrow{display:flex; gap:10px; flex-wrap:wrap; margin:6px 0 4px;}
.pill{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12px; border-radius:6px; padding:10px 14px; border:1px solid;}
.pill b{display:block; font-size:19px; margin-bottom:2px;}
.pill.bad{background:var(--exception-bg); border-color:#eec5c3; color:var(--exception);}
.pill.goal{background:var(--good-bg); border-color:#bfe2cf; color:var(--good);}

/* flowchart */
.flow{display:flex; flex-direction:column; align-items:center; margin:14px 0 6px;}
.fnode{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:13px; font-weight:600; text-align:center;
  border:1.6px solid; border-radius:8px; padding:9px 16px 8px; min-width:330px; max-width:520px;}
.fnode small{display:block; font-weight:400; font-size:11.5px; margin-top:2px; opacity:.85;}
.fnode.human{background:var(--human-bg); border-color:var(--human); color:var(--human);}
.fnode.ai{background:var(--ai-bg); border-color:var(--ai); color:var(--ai);}
.fnode.system{background:var(--system-bg); border-color:#aab4bf; color:var(--system);}
.fnode.exception{background:var(--exception-bg); border-color:var(--exception); color:var(--exception);}
.fnode.shared{background:var(--decision-bg); border-color:var(--decision); color:var(--decision);}
.fdiamond{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:12.5px; font-weight:700; color:var(--decision);
  background:var(--decision-bg); border:1.6px solid var(--decision); padding:10px 22px; text-align:center;
  border-radius:4px; transform:skewX(-12deg);}
.fdiamond span{display:inline-block; transform:skewX(12deg);}
.arrow{color:#90a0b0; font-size:15px; line-height:1.25; padding:1px 0;}
.branch{display:flex; gap:26px; align-items:flex-start; justify-content:center; margin:2px 0;}
.branch .col{display:flex; flex-direction:column; align-items:center;}
.blabel{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; color:var(--muted); padding:2px 0;}
.legend{display:flex; gap:16px; flex-wrap:wrap; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11.5px;
  color:var(--muted); margin-top:14px; border-top:1px dashed var(--line); padding-top:10px;}
.chip{display:inline-block; width:12px; height:12px; border-radius:3px; border:1.5px solid; vertical-align:-1px; margin-right:5px;}

/* callouts & scores */
.callout{border-left:4px solid var(--crimson); background:#fdf6f7; padding:12px 16px; font-size:14px; margin:14px 0;}
.callout.go{border-color:var(--good); background:var(--good-bg);}
.scorebar{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:13px; margin:4px 0;}
.scorebar .dots{color:var(--crimson); letter-spacing:3px;}

/* misc */
.two-col{display:grid; grid-template-columns:1fr 1fr; gap:22px;}
@media(max-width:860px){.two-col{grid-template-columns:1fr;}}
footer{font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:11px; color:var(--muted); text-align:center; padding:26px 20px 40px;}
@media print{ body{background:#fff;} section.stage{break-inside:avoid-page; border:none;} }
```

---

## Masthead (optional — you flagged it as the weakest part)

The original uses a navy band with a letter-spaced uppercase kicker, serif title, and sans subtitle. If you keep it, lighter alternatives that fit the system better:

1. **No band:** kicker + title directly on paper, crimson kicker, hairline rule below — closer to a case-packet cover.
2. **Thin crimson rule** (4px) across the top of the page instead of the navy block.
3. Keep navy but cut the thesis strip into the masthead itself, one line, so there's a single dark element rather than two stacked ones.