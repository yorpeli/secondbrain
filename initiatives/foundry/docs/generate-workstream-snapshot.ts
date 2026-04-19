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
    title('The Foundry — AI Academy & Community'),
    subtitle('Workstream Snapshot — March 2026'),

    metadata('Workstream Lead', 'Yonatan Orpeli (VP Product, CLM)'),
    metadata('Date', 'March 26, 2026'),
    spacer(),

    body('The Foundry is Payoneer\'s AI skills and education program, designed to raise AI capability across the entire organization through two complementary pillars: a structured Academy for deep, cohort-based training, and a broad-access Community that ensures no one is left behind.'),
    body('This is a new initiative. The first cohorts and community activities will be learning experiments — we expect to iterate on format, content, and delivery as we go.'),
    divider(),

    // -----------------------------------------------------------------------
    // 1. End-State Vision
    // -----------------------------------------------------------------------
    h1('1. End-State Vision: Target Architecture (To-Be)'),

    body('An organization where every employee has a baseline of AI fluency, top practitioners are certified through rigorous tracks, and a self-sustaining community keeps knowledge flowing across business units — continuously.'),

    h2('Key Building Blocks'),
    styledTable(
      ['Building Block', 'Description'],
      [
        ['Learning Tracks (Academy)', 'Four-tier certification: Makers (personal productivity) \u2192 Builders (team-level solutions) \u2192 Masters (architecture & platform) \u2192 Wizards (top AI ambassadors). Role-specific tracks starting with Product and Engineering, expanding to more functions.'],
        ['Content & Access (Community)', 'Curated content library from Academy materials plus original content. "AI for All" programming \u2014 live sessions, events, and self-serve resources accessible to all Platform employees.'],
        ['Faculty & Governance', '80% internal faculty (contextual, product-aware) + select external advisors. Foundry Board for strategic oversight. Academic Council for curriculum consistency and certification standards.'],
        ['Certification Gates', 'Rigorous progression gates between levels \u2014 learners demonstrate real-world impact before advancing. Validated by managers, peer demos, and security checklists.'],
        ['Knowledge Network', 'AI champions embedded across BUs, cross-functional meetups, internal community channel, project showcases. Alumni feed back into the community as mentors and content creators.'],
        ['Platform (LMS)', 'Learning management system for content delivery, progress tracking, and certification \u2014 in planning, not yet selected.'],
      ],
      [30, 70],
    ),

    h2('What Exists Today vs. What Is Missing'),
    styledTable(
      ['Exists Today', 'Missing / In Progress'],
      [
        ['Full Product track syllabus (14 sessions across Makers + Builders)', 'Content not yet validated with real cohorts'],
        ['Full Engineering track syllabus (23 sessions across M1\u2013M3 + B1)', 'LMS platform not yet selected or deployed'],
        ['Session leads assigned (9/14 Product, 12/23 Engineering)', 'Community format and programming still being shaped'],
        ['Three-tier certification model designed (Makers, Builders, Masters)', 'Wizards tier not yet designed'],
        ['Governance model defined (Foundry Board, Academic Council)', 'Governance bodies not yet staffed'],
        ['Registration and launch timeline set', 'Metrics and tracking infrastructure not live'],
      ],
      [50, 50],
    ),

    h2('Main Workstream Outputs'),
    bullet('Complete Academy syllabus \u2014 both Product and Engineering tracks'),
    bullet('Certification gate framework (3 gates with prerequisites, deliverables, and impact thresholds)'),
    bullet('Two-pillar program structure (Academy + Community) with clear ownership'),
    bullet('Executive briefing materials and internal communications'),
    bullet('Session lead recruitment and assignment'),

    // -----------------------------------------------------------------------
    // 2. Quick Wins
    // -----------------------------------------------------------------------
    h1('2. Quick Wins \u2014 Status & Value'),
    styledTable(
      ['#', 'What (Use Case)', 'Status', 'Impact', 'Insight'],
      [
        ['1', 'Full dual-track syllabus designed \u2014 37 sessions across Product (14) and Engineering (23), structured into Makers/Builders tiers', 'Done', 'Shared framework for all session leads; recruitment of faculty based on concrete session descriptions', 'Designing both tracks simultaneously forced alignment on shared ceremonies and joint sessions \u2014 worth the extra coordination'],
        ['2', 'Session lead recruitment \u2014 21 of 37 sessions have assigned leads from across Product and Engineering', 'In progress', 'Distributed ownership reduces single-point-of-failure; builds faculty bench', 'Internal volunteers bring domain context external trainers can\'t; optimize for their convenience, not process overhead'],
        ['3', 'Community pillar defined \u2014 "AI for All" track and content management model scoped alongside Academy', 'In progress', 'Ensures the broader org isn\'t left behind while select cohorts go deep; signals inclusivity', 'Separating Academy (depth) from Community (breadth) avoids the trap of trying to do both in one format'],
      ],
      [5, 25, 12, 30, 28],
    ),

    // -----------------------------------------------------------------------
    // 3. From Experiment to Capability
    // -----------------------------------------------------------------------
    h1('3. From Experiment \u2192 Capability'),

    body('This is a new program. The first cohorts are explicitly experiments \u2014 designed to learn what works before scaling.'),

    styledTable(
      ['Quick Win', 'POC / Tool / Capability?', 'Architecture Mapping', 'Required to Scale', 'Expected Adoption'],
      [
        ['Dual-track syllabus', 'Scalable capability \u2014 the curriculum architecture for all future tracks', 'Defines learning tracks, certification gates, and progression model', 'Content validation from first cohorts; feedback loops built into delivery', 'First cohort: 60\u201380 learners across PM + Eng. Expanding to additional roles in subsequent rounds'],
        ['Session lead network', 'POC \u2014 testing internal faculty model', 'Validates the 80% internal / 20% external faculty approach', 'Session lead enablement; content quality bar; ongoing faculty recruitment as tracks expand', '21 leads today; grows with each new track and cohort'],
        ['Community pillar', 'POC \u2014 format and engagement model still being defined', 'Validates broad-access delivery (events, content library, champions)', 'BU-level AI champions identified; content pipeline from Academy to Community; engagement tracking', 'Target: all Platform employees have access; active engagement measured by event attendance and content consumption'],
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
        ['1', 'Program announcement and registration', 'Yonatan + Omer', 'Public announcement, registration form, cohort selection criteria', 'Final syllabus confirmation; exec sponsorship'],
        ['2', 'First Academy cohort launches (post-Passover)', 'Yonatan (Product) + Tal (Engineering)', 'First sessions delivered to 60\u201380 learners across both tracks', 'Session lead content readiness; LMS or delivery platform decision'],
        ['3', 'Community pillar kickoff', 'Itai Haetzni', 'First "AI for All" events and content published', 'Community format finalized; initial content curated from Academy materials'],
        ['4', 'LMS platform decision', 'Yonatan + Omer', 'Platform selected and initial configuration', 'Vendor evaluation; budget approval'],
        ['5', 'First certification gate executed', 'Yonatan + Tal', 'Makers L2\u2192L3 gate criteria validated with first cohort', 'Cohort progress through initial sessions; manager validation process defined'],
      ],
      [5, 22, 20, 28, 25],
    ),

    h2('6\u201318 Months (Foundry at Scale)'),

    h3('What fundamental change will occur:'),
    body('AI fluency becomes an organizational baseline, not a niche skill. Every employee has access to structured AI education, and top practitioners are certified through a rigorous, internally-recognized progression.'),

    h3('What will look materially different:'),
    richBody([
      new TextRun({ text: 'People: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'A network of certified AI practitioners (Makers, Builders, Masters) embedded across every BU. Wizards \u2014 top AI ambassadors \u2014 leading cross-org knowledge transfer. Internal faculty teaching from real Payoneer context.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),
    richBody([
      new TextRun({ text: 'Process: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'Continuous intake \u2014 new cohorts running regularly, not as one-off events. Academy content feeds Community automatically. Certification gates ensure quality. Alumni mentor new cohorts.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),
    richBody([
      new TextRun({ text: 'Product: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'AI-augmented workflows becoming the default for trained teams. Measurable productivity gains from Makers certification. Team-level AI solutions emerging from Builders cohorts.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),

    richBody([
      new TextRun({ text: 'Future option \u2014 Foundry Commando Team: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'A dedicated strike unit for high-ROI use cases, operating in 2\u20136 week sprints paired with squads to accelerate adoption and inject best practices back into the Foundry. To be explored once Academy graduates produce a critical mass of AI-capable practitioners.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),

    // -----------------------------------------------------------------------
    // 5. Metrics
    // -----------------------------------------------------------------------
    h1('5. Metrics \u2014 From Learning to Impact'),
    styledTable(
      ['Question', 'Answer'],
      [
        ['What is measured today?', 'Session lead assignment coverage (21/37). Syllabus completeness (both tracks designed). Registration pipeline (not yet open).'],
        ['What should be measured next?', 'Cohort completion rates. Certification gate pass/fail rates. Self-reported productivity gains from Makers graduates. Content consumption and event attendance (Community). NPS from first cohort.'],
        ['When will we be able to measure?', 'Cohort metrics: 6\u20138 weeks after launch (May\u2013June 2026). Community engagement: immediately after first events. Productivity impact: 3\u20136 months post-certification (requires baseline).'],
        ['Gaps in measurement?', 'No baseline for pre-training AI proficiency \u2014 need to establish before first cohort. LMS tracking depends on platform selection. Community engagement metrics need definition. Long-term ROI measurement (productivity uplift, cycle time) is an industry-wide challenge.'],
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
        ['1', 'Content quality not meeting expectations \u2014 sessions designed but not yet validated with real learners', 'Execution', 'First cohort is explicitly a pilot. Built-in feedback loops after every session. Iterating content based on learner experience, not theory.'],
        ['2', 'LMS platform delays impacting launch timeline', 'Technical', 'Can launch initial sessions without LMS (simple docs + live sessions). LMS is an enabler, not a blocker for first cohort.'],
        ['3', 'Faculty bandwidth constraints \u2014 session leads are volunteers with day jobs', 'Organizational', 'Optimize for their convenience (simple content formats, no heavy tooling). Omer coordinating directly with leads. Position as career development opportunity.'],
        ['4', 'Community engagement risk \u2014 "AI for All" may struggle for attention without clear value proposition', 'Organizational', 'Anchor to concrete events and visible quick wins. Use Academy content as the draw. Identify BU-level champions to drive local adoption.'],
      ],
      [5, 35, 15, 45],
    ),

    h2('Real Trade-offs'),
    richBody([
      new TextRun({ text: 'Depth vs. breadth: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'The Academy goes deep with a few; the Community goes wide with everyone. We\'re running both simultaneously rather than sequentially \u2014 this is harder to manage but ensures the org doesn\'t split into AI haves and have-nots.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),
    richBody([
      new TextRun({ text: 'Internal faculty vs. external experts: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: '80% internal means contextual and relevant, but puts load on volunteers. We\'re choosing relevance over polish and supporting leads with content development assistance.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),
    richBody([
      new TextRun({ text: 'Launch speed vs. content perfection: ', font: FONT, size: Sizes.body, bold: true, color: Colors.charcoal }),
      new TextRun({ text: 'We\'re launching with "good enough" content and iterating, rather than waiting for perfect materials. The first cohort knows they\'re pioneers, not passengers.', font: FONT, size: Sizes.body, color: Colors.charcoal }),
    ]),

    // -----------------------------------------------------------------------
    // 7. Decisions Needed
    // -----------------------------------------------------------------------
    h1('7. Decisions Needed'),
    styledTable(
      ['#', 'Decision', 'Why It Matters', 'Who Decides'],
      [
        ['1', 'Executive sponsorship confirmation \u2014 formal organizational commitment to the Foundry and cross-BU participation', 'Without this, cohort recruitment depends on goodwill. With it, the program has institutional weight.', 'Oren Ryngler (CPO) / Mor Barazani'],
        ['2', 'LMS platform selection \u2014 which system will host content, track progress, and manage certifications', 'Affects scalability, learner experience, and measurement capability. Delay here is manageable short-term but blocks scale.', 'Yonatan + Omer + IT'],
        ['3', 'BU ownership model for Community \u2014 how AI champions are nominated and accountable per business unit', 'Without named DRIs per BU, community engagement stays grassroots and uneven.', 'Yonatan + Itai + BU leads'],
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
        ['Proof of Value', ratingParagraph('Yellow'), 'Program architecture is complete and well-designed. But value is proven when real cohorts graduate and apply what they\'ve learned \u2014 we\'re pre-launch.'],
        ['Scalability Potential', ratingParagraph('Green'), 'Multi-track model designed to expand to new roles. Community pillar extends reach to entire org. Faculty model (80% internal) scales with org growth.'],
        ['Architectural Clarity', ratingParagraph('Green'), 'Academy: clear tracks, tiers, gates, governance. Community: pillars defined, ownership assigned. Gap: Community format details still being shaped.'],
        ['Measurement Maturity', ratingParagraph('Yellow'), 'Key metrics identified (completion rates, certification gates, productivity uplift). No tracking infrastructure live yet \u2014 depends on LMS selection and first cohort launch.'],
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
        ['Top Quick Win', 'Full dual-track syllabus (37 sessions) with 21 session leads assigned \u2014 the curriculum backbone is built'],
        ['Proven Value', 'Program design validated through industry research and internal stakeholder alignment. Real validation comes from first cohort outcomes.'],
        ['Scalable Capability', 'Academy tracks expand to new roles; Community scales to all employees. Certification model and faculty network are the scaling mechanisms.'],
        ['Architecture Readiness', 'End-state designed: 4-tier certification, dual-pillar structure, governance bodies, faculty model. Gap is LMS platform and Community format details.'],
        ['Next 6\u201312 Week Focus', 'Launch first Academy cohort (April 26), kick off Community pillar, select LMS, execute first certification gate'],
        ['Biggest Risk', 'Content not yet validated with real learners. First cohort is the critical proof point.'],
        ['Key Decision Needed', 'Executive sponsorship confirmation to unlock cross-BU participation and institutional commitment'],
        ['Overall Status (R/Y/G)', ratingParagraph('Yellow')],
      ],
      [30, 70],
    ),
    body('Overall: strong program design and clear architecture, but pre-launch. Moving to green requires first cohort delivered and initial learner outcomes validated.'),

    // -----------------------------------------------------------------------
    // Track Leaders & Staff
    // -----------------------------------------------------------------------
    divider(),
    h2('Track Leaders & Staff'),

    h3('Leadership'),
    bullet('Tal Arnon'),
    bullet('Yonatan Orpeli'),

    h3('Staff'),
    bullet('Topaz Eitan'),
    bullet('Shilhav Ben-David'),
    bullet('Hisham Abdulhalim'),
    bullet('Odaya Caspi'),
    bullet('Eli Zilbershmidt'),
    bullet('Yonatan Ramot'),
    bullet('Gal Benedek'),
    bullet('Lior Rosenberg'),
    bullet('Matan Hager'),
    bullet('Almog Azlan'),
    bullet('Daniel Ostrovsky'),
    bullet('Noa Buchman'),
  ]

  return new Document({
    styles: createDocumentStyles(),
    sections: [
      createSection('The Foundry \u2014 Workstream Snapshot \u2014 March 2026', children),
    ],
  })
}

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------
async function main() {
  const doc = buildDoc()
  const buffer = await Packer.toBuffer(doc)
  const outPath = new URL('./workstream-snapshot-march2026.docx', import.meta.url).pathname
  fs.writeFileSync(outPath, buffer)
  console.log(`Written to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
