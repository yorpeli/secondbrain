import { Document, Packer, TextRun, Paragraph } from 'docx'
import * as fs from 'fs'
import {
  title, subtitle, h1, h2, h3, body, richBody, bullet, metadata, spacer, divider,
  styledTable, createSection, createDocumentStyles,
  Colors, Fonts, Sizes,
} from '../../../lib/doc-style.js'

const FONT = Fonts.primary

// ---------------------------------------------------------------------------
// Rating badge helper
// ---------------------------------------------------------------------------
function ratingText(rating: string): TextRun {
  const colorMap: Record<string, string> = {
    Green: Colors.onTrack,
    Yellow: Colors.potentialIssues,
    Red: Colors.atRisk,
  }
  return new TextRun({
    text: rating,
    font: FONT,
    size: Sizes.tableBody,
    color: colorMap[rating] ?? Colors.charcoal,
    bold: true,
  })
}

function ratingParagraph(rating: string): Paragraph[] {
  return [new Paragraph({ children: [ratingText(rating)] })]
}

// ---------------------------------------------------------------------------
// Build document
// ---------------------------------------------------------------------------
function buildDoc(): Document {
  const children = [
    title('AI-Native Team Operating Model'),
    subtitle('Week 3 Workstream Snapshot'),

    metadata('Workstream Lead', 'Yonatan Orpeli (VP Product, CLM) & Tal Arnon (VP Engineering)'),
    metadata('Date', 'March 25, 2026'),
    spacer(),

    // -----------------------------------------------------------------------
    // 1. End-State Vision
    // -----------------------------------------------------------------------
    h1('1. End-State Vision: Target Architecture (To-Be)'),

    body('A product organization where the default operating unit is a core pod of 3 (1 PM + 2 Engineers), working in a continuous loop of Discovery \u2192 Problem Frame \u2192 Co-Solve \u2192 Harden \u2192 Ship + Measure. AI is embedded in how the team works \u2014 not as a separate tool layer, but as the reason the team structure itself changes.'),

    h2('Key Building Blocks'),
    styledTable(
      ['Building Block', 'Description'],
      [
        ['Data layer', 'Shared context infrastructure \u2014 living documentation that serves both humans and AI agents. Replaces static specs and handoff artifacts.'],
        ['Governance & guardrails', 'Blast radius framework (L0\u2013L4) that calibrates team autonomy to potential impact. Applies equally to human decisions and AI agent actions.'],
        ['Models / agents', 'AI agents embedded in the development loop \u2014 generating code, synthesizing research, prototyping solutions. Engineers orchestrate agents rather than writing every line.'],
        ['Orchestration / workflows', 'The Co-Solve loop: PM and engineer work simultaneously (not sequentially) with AI doing the mechanical building. No handoffs, no PRDs, no sequential gates.'],
        ['Interfaces', 'PM prototypes directly with AI tools; engineers review and harden. Shared IDE environments where PM and engineer collaborate in real time.'],
      ],
      [30, 70],
    ),

    h2('What Exists Today vs. What Is Missing'),
    styledTable(
      ['Exists Today', 'Missing / In Progress'],
      [
        ['Complete operating model article (published internally)', 'First live pod to validate the model'],
        ['PM job description \u2014 in active recruitment via iTalent', 'Engineer role definition (co-developing with Tal Arnon)'],
        ['Blast radius governance framework (L0\u2013L4)', 'Organizational enablement \u2014 hiring flows adapted for AI-native roles'],
        ['Research foundation (13+ sources, competitive benchmarks)', 'Cross-pollination mechanisms between pods'],
        ['Flex-point model for team variants', 'Transition playbook for existing teams'],
      ],
      [50, 50],
    ),

    h2('Main Workstream Outputs'),
    bullet('AI-Native Team Operating Model article (complete)'),
    bullet('PM and Director job descriptions (shared with iTalent, in active recruitment)'),
    bullet('Blast radius governance framework'),
    bullet('Human Contract framework (psychological safety, knowledge loss mitigation, decision protocols for small teams)'),

    // -----------------------------------------------------------------------
    // 2. Quick Wins
    // -----------------------------------------------------------------------
    h1('2. Quick Wins \u2014 Status & Value'),
    styledTable(
      ['#', 'What (Use Case)', 'Status', 'Impact', 'Insight'],
      [
        ['1', 'Operating model article \u2014 codified how AI-native pods should work, end-to-end', 'Done', 'Shared language and framework for all stakeholders; basis for hiring, enablement, and org design conversations', 'Writing it as an opinion piece (not a framework) made it actionable and shareable'],
        ['2', 'PM JD shared with iTalent \u2014 recruitment started for Principal PM (IC) and Director roles', 'In progress', 'Hiring pipeline open; recruiter and candidate reactions validating role definitions', 'JD needs validation against AI-native hiring flow \u2014 traditional filters may screen out the right candidates'],
        ['3', 'Research landscape synthesis \u2014 13+ sources incl. competitive benchmarks (Mercury, Wix, Cellebrite, Anthropic, Vercel)', 'Done', 'De-risked key design decisions (team size of 3, shared design function, no QA role); grounded the model in evidence', 'Strongest signal came from practitioner interviews (Wix, Cellebrite), not published research'],
      ],
      [5, 25, 12, 30, 28],
    ),

    // -----------------------------------------------------------------------
    // 3. From Experiment to Capability
    // -----------------------------------------------------------------------
    h1('3. From Experiment \u2192 Capability'),
    styledTable(
      ['Quick Win', 'POC / Tool / Capability?', 'Architecture Mapping', 'Required to Scale', 'Expected Adoption'],
      [
        ['Operating model article', 'Scalable capability \u2014 the blueprint for organizational scaling', 'Defines all building blocks (governance, workflows, team structure)', 'Organizational buy-in, first pod as proof point, enablement program', 'All product + engineering teams transitioning to AI-native ways of working'],
        ['PM JD + recruitment', 'POC \u2014 testing if market has AI-native PM profiles', 'Validates the "who\'s in the team" building block', 'Hiring flow alignment with Liat Ashkenazi & Mor Regev; adapted interview process', 'First hire validates; then scales to all new PM hiring'],
        ['Research landscape', 'Foundation \u2014 informs all downstream decisions', 'Underlies governance calibration and team composition decisions', 'Periodic refresh as industry practices evolve', 'Used by leadership for decision-making; by HR for JD calibration'],
      ],
      [18, 20, 22, 22, 18],
    ),

    // -----------------------------------------------------------------------
    // 4. Dual Horizon Plan
    // -----------------------------------------------------------------------
    h1('4. Dual Horizon Plan'),

    h2('Next 6\u201312 Weeks (Execution)'),
    styledTable(
      ['#', 'Milestone', 'Owner', 'Deliverable', 'Key Dependencies'],
      [
        ['1', 'Align on hiring flows for AI talent', 'Yonatan + Liat Ashkenazi + Mor Regev', 'Adapted recruitment and interview process for AI-native roles', 'Internal alignment on process changes'],
        ['2', 'Understand AI DLC team capabilities', 'Yonatan + AI DLC team', 'Gap analysis \u2014 what from their work applies to our enablement needs', 'AI DLC team availability and willingness to share'],
        ['3', 'Interview AIR teams', 'Yonatan + Tal', 'Documented learnings on current AI ways of working, pain points, and what\'s working', 'AIR team access and scheduling'],
        ['4', 'Enable AIR teams on operating model', 'Yonatan + Tal', 'First teams experimenting with the pod model and Co-Solve workflow', 'Completed interviews; leadership buy-in from AIR leads'],
        ['5', 'Expand to domain teams', 'Yonatan + Tal', 'Teams from different domains adopting AI-enabled ways of working', 'AIR learnings documented; domain lead buy-in'],
      ],
      [5, 22, 20, 28, 25],
    ),

    h2('6\u201318 Months (Transformation)'),

    h3('What fundamental change will occur:'),
    body('The default team structure shifts from 5\u20138 person feature teams with sequential handoffs to 3-person pods with AI-embedded workflows. This isn\'t a process change \u2014 it\'s a structural redesign of how product work gets done.'),

    h3('What will look materially different:'),
    richBody([
      new TextRun({ text: 'People: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'PMs prototype and analyze directly with AI; engineers orchestrate AI agents and focus on system integrity. New hiring profiles reflect this.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),
    richBody([
      new TextRun({ text: 'Process: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'No PRDs, no handoff specs, no estimation ceremonies. Continuous Co-Solve replaces the spec\u2192build\u2192review sequence. Blast radius framework replaces approval committees.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),
    richBody([
      new TextRun({ text: 'Product: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'Faster cycle times (days/weeks vs. months). More experimentation \u2014 testing 3 approaches in a day instead of committing to 1 per sprint. Higher quality decisions because exploration cost drops dramatically.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),

    // -----------------------------------------------------------------------
    // 5. Metrics
    // -----------------------------------------------------------------------
    h1('5. Metrics \u2014 From Learning to Impact'),
    styledTable(
      ['Question', 'Answer'],
      [
        ['What is measured today?', 'Recruitment pipeline metrics (iTalent candidates in funnel). Qualitative feedback from stakeholder reviews of the operating model.'],
        ['What should be measured next?', 'Time-to-first-prototype for teams adopting Co-Solve workflow. Interview-to-hire conversion for AI-native JDs vs. traditional. Team satisfaction and collaboration quality in pod experiments.'],
        ['When will we be able to measure?', 'Once first teams begin experimenting (target: 6\u20138 weeks). Hiring metrics available once interview pipeline matures (4\u20136 weeks).'],
        ['Gaps in measurement?', 'No baseline yet for traditional team cycle times to compare against. Need to establish measurement framework before first pod launches. Productivity metrics for AI-augmented work are industry-wide unsolved.'],
      ],
      [30, 70],
    ),

    // -----------------------------------------------------------------------
    // 6. Risks & Trade-offs
    // -----------------------------------------------------------------------
    h1('6. Risks & Trade-offs'),
    styledTable(
      ['#', 'Risk', 'Type', 'Mitigation'],
      [
        ['1', 'Hiring market may not have AI-native PM profiles \u2014 the role we\'re describing is emerging; candidate pool is thin', 'Organizational', 'iTalent actively searching; JD designed to attract builder-PMs. Candidate reactions will signal if we need to adjust.'],
        ['2', 'Resistance from existing teams \u2014 current team leads may see pod model as threatening to their structure', 'Organizational', 'Starting with willing teams (AIR), framing as experimentation not mandate, demonstrating value before scaling.'],
        ['3', 'Model unproven at Payoneer scale \u2014 well-researched but untested internally', 'Execution', 'First pod is explicitly an experiment. Built-in feedback loops. Committed to course-correcting based on evidence, not defending the model.'],
      ],
      [5, 35, 15, 45],
    ),

    h2('Real Trade-offs'),
    richBody([
      new TextRun({ text: 'Speed vs. thoroughness: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'We could spend more time refining the model before experimenting, but we believe the learning comes from practice, not from more documents. We\'re choosing to move fast and iterate.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),
    richBody([
      new TextRun({ text: 'Centralized design vs. domain autonomy: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'The operating model proposes a universal pod structure with flex points. Some domains may need more customization. We\'ll learn this from the AIR experiments.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),

    // -----------------------------------------------------------------------
    // 7. Decisions Needed
    // -----------------------------------------------------------------------
    h1('7. Decisions Needed'),
    styledTable(
      ['#', 'Decision', 'Why It Matters', 'Who Decides'],
      [
        ['1', 'Hiring flow adaptation for AI-native roles \u2014 current process built for traditional roles and may filter out pod-fit candidates', 'Without this, we hire the wrong people or lose the right ones', 'Liat Ashkenazi + Mor Regev + Yonatan'],
        ['2', 'Which AIR teams to start with \u2014 need to select teams for initial interviews and enablement', 'Wrong team selection delays learning; right selection creates momentum', 'Yonatan + Tal + AIR leadership'],
        ['3', 'Domain for first full pod \u2014 bounded problem space, real autonomy, real users', 'The first pod is the proof point; wrong scope undermines credibility', 'Yonatan + Tal + Oren/Liat'],
      ],
      [5, 35, 30, 30],
    ),

    // -----------------------------------------------------------------------
    // 8. Self-Assessment
    // -----------------------------------------------------------------------
    h1('8. Overall Self-Assessment'),
    styledTable(
      ['Dimension', 'Rating', 'Explanation'],
      [
        ['Proof of Value', ratingParagraph('Yellow'), 'Operating model is complete, well-researched, and reviewed by stakeholders. But value is proven when a real team operates this way \u2014 we\'re pre-experiment.'],
        ['Scalability Potential', ratingParagraph('Green'), 'The model is designed to scale \u2014 flex points handle team variants, blast radius framework handles governance. The architecture is built for organizational adoption.'],
        ['Architectural Clarity', ratingParagraph('Green'), 'End-state is clearly defined: pod structure, workflow loop, governance framework, shared functions model. All documented and internally consistent.'],
        ['Measurement Maturity', ratingParagraph('Red'), 'No quantitative metrics yet. Measurement framework needs to be built before first pod launches. This is expected at this stage \u2014 we\'re still pre-experiment.'],
      ],
      [25, 15, 60],
    ),

    // -----------------------------------------------------------------------
    // Summary Table
    // -----------------------------------------------------------------------
    h1('Summary'),
    styledTable(
      ['Dimension', 'Answer'],
      [
        ['Top Quick Win', 'Complete AI-native operating model article \u2014 shared language and framework for the entire initiative'],
        ['Proven Value', 'Operating model validated through research (13+ sources), stakeholder reviews, and practitioner input (Wix, Cellebrite). Recruitment started based on it.'],
        ['Scalable Capability', 'The operating model and governance framework are designed for org-wide adoption. Flex-point architecture handles team variants without separate models.'],
        ['Architecture Readiness', 'End-state fully designed: pod structure, workflow, governance, shared functions, human contract. Gap is the transition playbook.'],
        ['Next 6\u201312 Week Focus', 'Align on AI hiring flows (Liat/Mor), understand AI DLC capabilities, interview and enable AIR teams, then expand to domain teams'],
        ['Biggest Risk', 'Model is unproven internally \u2014 strong on paper, needs real team validation. First pod experiment is the critical proof point.'],
        ['Key Decision Needed', 'Hiring flow adaptation for AI-native roles \u2014 current process may filter out the right candidates'],
        ['Overall Status (R/Y/G)', ratingParagraph('Yellow')],
      ],
      [30, 70],
    ),
    body('Strong intellectual foundation and active recruitment, but pre-experiment. Moving to green requires first team operating in the new model.'),
  ]

  return new Document({
    styles: createDocumentStyles(),
    sections: [
      createSection('AI-Native Team Operating Model \u2014 Week 3 Workstream Snapshot', children),
    ],
  })
}

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------
async function main() {
  const doc = buildDoc()
  const buffer = await Packer.toBuffer(doc)
  const outPath = new URL('./week3-workstream-snapshot.docx', import.meta.url).pathname
  fs.writeFileSync(outPath, buffer)
  console.log(`Written to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
