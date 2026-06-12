---
name: create-deck
description: "Generate branded PowerPoint presentations from LLM context and tasks"
version: 1.0.0
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---

# /create-deck Skill

Generate branded PowerPoint presentations using Payoneer brand guidelines. Supports templates (comparison, overview, status) and custom structures.

## Arguments

- `topic` (required): The subject matter for the deck
- `--template`: Template type (comparison, overview, status)
- `--custom-structure`: Comma-separated slide names for custom decks
- `--output-name`: Custom output filename (without extension)

## Execution Flow

### Step 1: Parse Arguments

Extract from user input:
- `topic`: Required - the deck subject
- `template`: Optional - defaults to "overview" if no custom structure
- `custom_structure`: Optional - overrides template if provided
- `output_name`: Optional - defaults to `{topic}_{template}_{date}`

If neither `--template` nor `--custom-structure` provided, ask user:
```
Which deck type would you like?
1. comparison - Compare multiple options/competitors
2. overview - Summary of a topic
3. status - Project/task status update
4. custom - Define your own slide structure
```

### Step 2: Load Configuration

Read configuration files:
1. Read `.claude/skills/create-deck/config/brand.json` for colors/fonts
2. Read `.claude/skills/create-deck/config/templates.json` for template definitions
3. Read `.claude/skills/create-deck/config/defaults.json` for paths/naming

### Step 3: Content Discovery

#### 3a: LLM Context Discovery
1. Read `LLM context/CLAUDE.md` mapping file
2. Search for documents matching topic keywords
3. Read relevant LLM context documents
4. Extract key information for slides

#### 3b: Smart Task Integration (Conditional)
1. Read task index at `Tasks/state/task_index.json` (lightweight scan)
2. Evaluate if any tasks relate to the deck topic by matching:
   - Task titles containing topic keywords
   - Task tags matching topic
   - Task owners if relevant to topic
3. **If relevant tasks found:**
   - Read specific task files from `Tasks/action items/`
   - Check `Tasks/Meetings/` for related meeting summaries
4. **If no relevant tasks:** Skip task folder entirely

**Task relevance by template:**
- `status`: High likelihood of pulling tasks
- `overview`: Medium likelihood
- `comparison`: Low likelihood (primarily LLM context)

### Step 4: Generate Slide Content

Based on template type, structure content:

**For comparison template:**
- Title slide with topic
- Executive summary of comparison
- Individual entity slides (one per competitor/option)
- Comparison table slide
- Recommendations slide

**For overview template:**
- Title slide
- Key points (3-5 bullet points)
- Details (expanded sections)
- Summary/takeaways

**For status template:**
- Title slide
- Status overview (metrics/progress)
- Completed items
- In progress items
- Blockers/risks
- Next steps

**For custom structure:**
- Parse comma-separated slide names
- Generate content for each named slide
- Apply appropriate layouts

### Step 5: Prepare JSON for Python Script

Create structured JSON with:
```json
{
  "metadata": {
    "title": "Deck Title",
    "topic": "Topic",
    "template": "template_name",
    "date": "YYYY-MM-DD"
  },
  "brand": { /* from brand.json */ },
  "slides": [
    {
      "type": "title|content|comparison|table",
      "title": "Slide Title",
      "content": ["bullet 1", "bullet 2"],
      "table_data": null
    }
  ]
}
```

### Step 6: Generate PPTX

1. Write JSON to temporary file
2. Run Python script:
```bash
python3 .claude/skills/create-deck/scripts/generate_pptx.py \
  --input /tmp/deck_content.json \
  --output "Decks/{output_name}.pptx"
```
3. Clean up temporary file

### Step 7: Report Results

Output:
- Deck saved to: `Decks/{filename}.pptx`
- Slides generated: {count}
- Sources used: {list of LLM context docs and task files if any}

## Example Invocations

```bash
# Comparison deck
/create-deck "Document Submission" --template comparison

# Overview deck
/create-deck "MFA Implementation" --template overview

# Status deck
/create-deck "Q1 Security Roadmap" --template status

# Custom structure
/create-deck "API Review" --custom-structure "Title, Context, Technical Details, Risks, Recommendations"

# Custom output name
/create-deck "Competitor Analysis" --template comparison --output-name "Feb_Competitor_Review"
```

## Error Handling

- If no relevant LLM context found: Ask user for input or proceed with minimal content
- If Python script fails: Report error and suggest troubleshooting
- If output directory doesn't exist: Create it automatically
