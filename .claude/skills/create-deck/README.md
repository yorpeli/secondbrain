# /create-deck Skill

Generate branded PowerPoint presentations with an elegant glass-effect design system.

## Quick Start

```bash
# Create a comparison deck
/create-deck "Document Submission Competitors" --template comparison

# Create an overview deck
/create-deck "MFA Implementation" --template overview

# Create a status update deck
/create-deck "Q1 Security Roadmap" --template status

# Custom slide structure
/create-deck "API Review" --custom-structure "Title, Context, Technical Details, Risks, Recommendations"
```

## Design System

The skill uses a modern glass-effect design system that emphasizes elegance and clarity.

### Design Philosophy

| Before | After |
|--------|-------|
| Pastel-filled boxes (light blue, purple backgrounds) | Glass-like containers with thin borders |
| Centered, long accent lines | Short, left-aligned accent lines (0.8") |
| Single slide theme | Dark title slides + light content slides |

### Core Principles

- **90% neutral, 10% accent** - Charcoal/white dominant, strategic color use
- **Glass containers** - Near-white fills (#FAFAFA) + thin dark borders + subtle shadows
- **Dark for impact** - Title and closing slides use dark backgrounds
- **Light for readability** - Content slides stay clean and scannable
- **Minimalistic** - Less is more, product-led, authentic

### Color Palette

**Primary:**
- Charcoal Black: `#1E1E28` - Titles, borders, dark backgrounds
- Pure White: `#FFFFFF` - Light backgrounds, text on dark

**Accents:**
- Electric Blue: `#0033FF` - Key highlights, CTAs, accent lines
- Midnight Blue: `#002373` - Primary badges
- Neon Purple: `#977DFF` - Secondary badges

**Neutral:**
- Light Gray: `#E5E5E5` - Subtle borders, muted text on dark
- Muted Text: `#666666` - Subtitles, labels
- Container Fill: `#FAFAFA` - Glass card backgrounds
- Shadow: `#E0E0E0` - Subtle depth effects

### Typography

| Element | Size | Style |
|---------|------|-------|
| Deck title | 48pt | Bold |
| Slide title | 32pt | Bold |
| Section header | 12pt | Bold, uppercase |
| Body | 16pt | Regular |
| Caption | 12pt | Regular |
| Badge | 10pt | Bold, uppercase |

## Slide Types

### Title Slides

**Light title (default):**
```json
{"type": "title", "title": "Presentation Title", "subtitle": "Optional subtitle"}
```

**Dark title (impactful):**
```json
{"type": "title_dark", "title": "Bold Statement", "subtitle": "Context", "date": "February 2026"}
```

### Content Slides

**Standard content:**
```json
{
  "type": "content",
  "title": "Key Points",
  "content": ["Point one", "Point two", "Point three"],
  "subtitle": "Optional muted subtitle",
  "in_glass_card": false
}
```

**Content in glass card:**
```json
{
  "type": "content",
  "title": "Encapsulated Content",
  "content": ["Item one", "Item two"],
  "in_glass_card": true
}
```

### Content Cards Slide

Multiple glass cards side-by-side with section headers:

```json
{
  "type": "content_cards",
  "title": "Feature Comparison",
  "subtitle": "Side-by-side analysis",
  "cards": [
    {"header": "Option A", "content": ["Pro: Fast", "Pro: Simple", "Con: Limited"]},
    {"header": "Option B", "content": ["Pro: Powerful", "Con: Complex", "Con: Expensive"]}
  ]
}
```

### Metrics Slide

3-4 metric cards with large values and optional badges:

```json
{
  "type": "metrics",
  "title": "Key Metrics",
  "subtitle": "Q1 2026 Performance",
  "metrics": [
    {"value": "98%", "label": "Uptime", "badge": "+2%", "badge_style": "primary"},
    {"value": "1.2s", "label": "Avg Response", "badge": "On Target", "badge_style": "neutral"},
    {"value": "45K", "label": "Active Users"},
    {"value": "4.8", "label": "Satisfaction"}
  ]
}
```

### Two-Column Slide

Side-by-side content with glass cards:

```json
{
  "type": "two_column",
  "title": "Current vs Proposed",
  "left_title": "Current State",
  "left_content": ["Manual process", "Error-prone", "Slow turnaround"],
  "right_title": "Proposed Solution",
  "right_content": ["Automated workflow", "Validated inputs", "Real-time processing"],
  "in_glass_cards": true
}
```

### Table Slide

Comparison table with elegant styling:

```json
{
  "type": "table",
  "title": "Vendor Comparison",
  "subtitle": "Security features analysis",
  "table_data": {
    "headers": ["Feature", "Vendor A", "Vendor B", "Vendor C"],
    "rows": [
      ["SSO", "Yes", "Yes", "No"],
      ["MFA", "Yes", "Partial", "Yes"],
      ["Audit Logs", "Yes", "Yes", "Yes"]
    ]
  }
}
```

### Closing Slide

Dark Q&A slide:

```json
{"type": "closing", "title": "Questions?", "subtitle": "team@company.com"}
```

## Components

### Glass Cards

Elegant containers with gradient fill and soft shadow:
- **Gradient fill:** White (#FFFFFF) center → Light blue (#F2FAFF) edge at 315°
- **Border:** 2pt light gray (#D9D9D9)
- **Shadow:** Outer blur shadow (100pt blur, 20pt distance, 12% opacity)
- **Corner radius:** ~9.4%

The glass effect creates a subtle light-reflection appearance, giving cards depth without heavy colors.

### Badges

Status indicators in pill shape:

| Style | Use Case | Appearance |
|-------|----------|------------|
| `primary` | Key status, main CTAs | Midnight blue fill, white text |
| `secondary` | Secondary highlights | Purple fill, white text |
| `outline` | Neutral status | Light fill, dark border + text |
| `neutral` | Muted status, labels | Gray fill, muted text |

### Section Headers

Uppercase text with short accent underline:
- 12pt bold, accent color
- 0.6" underline below

### Accent Lines

- **Title slides:** 0.8" centered (light) or left-aligned (dark)
- **Content slides:** 0.8" left-aligned below title

## Templates

### Comparison
Best for: Competitor analysis, vendor evaluation, feature comparison

**Slides:**
1. Dark title
2. Executive Summary
3. Entity Slides (one per item being compared)
4. Comparison Table
5. Recommendations
6. Closing

### Overview
Best for: Feature overview, project summary, topic introduction

**Slides:**
1. Dark title
2. Key Points (3-5 takeaways)
3. Details (content cards)
4. Summary
5. Closing

### Status
Best for: Sprint review, project updates, weekly syncs

**Slides:**
1. Dark title
2. Metrics Overview
3. Completed (in glass card)
4. In Progress (in glass card)
5. Blockers (if any)
6. Next Steps
7. Closing

### Custom
Define your own structure:

```bash
/create-deck "Topic" --custom-structure "Title, Background, Analysis, Options, Recommendation"
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `topic` | Yes | The deck subject/title |
| `--template` | No | Template type: comparison, overview, status |
| `--custom-structure` | No | Comma-separated custom slide names |
| `--output-name` | No | Custom filename (without extension) |

## Output

Decks are saved to `/Decks/` folder:
```
{topic}_{template}_{date}.pptx
```

Example: `Document_Submission_comparison_2026-02-05.pptx`

## Content Sources

The skill automatically discovers content from:

1. **LLM Context** (Primary)
   - Reads `LLM context/CLAUDE.md` mapping file
   - Searches for documents matching topic keywords
   - Extracts relevant information

2. **Tasks** (Conditional)
   - Reads task index first (lightweight scan)
   - Only pulls full task files if relevant to topic
   - Higher relevance for status decks

## Examples

### Competitor Analysis Deck

```bash
/create-deck "Melio vs Bill.com" --template comparison
```

Generates:
- Dark title slide with date
- Executive summary in glass cards
- Individual slides for each competitor
- Side-by-side comparison table
- Recommendations
- Dark closing slide

### Feature Overview Deck

```bash
/create-deck "SSO Implementation" --template overview
```

Generates:
- Dark title slide
- Key benefits in glass card
- Technical details as content cards
- Implementation summary
- Dark Q&A closing

### Sprint Status Deck

```bash
/create-deck "Authentication Sprint 3" --template status
```

Generates:
- Dark title slide
- Metrics cards (velocity, completion, etc.)
- Completed items in glass card
- In-progress items in glass card
- Blockers and next steps
- Dark closing

## File Structure

```
.claude/skills/create-deck/
├── SKILL.md                    # Skill definition
├── README.md                   # This file
├── config/
│   ├── brand.json              # Design system, colors, glass components
│   ├── templates.json          # Template definitions
│   └── defaults.json           # Output paths, naming
├── templates/
│   ├── comparison.md           # Comparison structure
│   ├── overview.md             # Overview structure
│   └── status.md               # Status structure
└── scripts/
    └── generate_pptx.py        # Python PPTX generator

Decks/                          # Output folder
```

## Troubleshooting

**"python-pptx not found"**
```bash
pip install python-pptx
```

**"No relevant content found"**
- Check that LLM context has documents matching your topic
- Try more specific or different topic keywords
- The skill will prompt for manual input if needed

**Output file not created**
- Check the Decks/ folder exists
- Verify write permissions
- Check for Python script errors in output

## Dependencies

- Python 3.x
- python-pptx (`pip install python-pptx`)
