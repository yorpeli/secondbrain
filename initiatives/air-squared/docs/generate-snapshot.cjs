const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak
} = require("docx");

// Colors
const C = {
  black: "1E1E28",
  accent: "977DFF",
  blue: "0033FF",
  gray: "666677",
  lightGray: "CCCCDD",
  headerBg: "2A2A3A",
  rowAlt: "F7F7FA",
  white: "FFFFFF",
  yellow: "FFD700",
  green: "00B050",
  red: "FF4444",
};

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: C.lightGray };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

// Helpers
function headerCell(text, width) {
  return new TableCell({
    borders: cellBorders, width: { size: width, type: WidthType.DXA },
    shading: { fill: C.headerBg, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text, bold: true, color: C.white, size: 20, font: "Arial" })] })]
  });
}

function dataCell(children, width, opts = {}) {
  return new TableCell({
    borders: cellBorders, width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: C.rowAlt, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: Array.isArray(children) ? children : [new Paragraph({ spacing: { before: 40, after: 40 }, children: Array.isArray(children) ? children : [children] })]
  });
}

function dataCellP(runs, width, opts = {}) {
  return new TableCell({
    borders: cellBorders, width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: C.rowAlt, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: runs })]
  });
}

function t(text, opts = {}) { return new TextRun({ text, size: 20, font: "Arial", ...opts }); }
function tb(text, opts = {}) { return t(text, { bold: true, ...opts }); }

function bullet(runs, ref = "bullet-list") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { before: 40, after: 40 }, children: runs });
}

function subBullet(runs, ref = "bullet-sub") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { before: 20, after: 20 }, children: runs });
}

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 120 }, children: [new TextRun({ text, size: 28, bold: true, font: "Arial", color: C.accent })] });
}

function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 }, children: [new TextRun({ text, size: 24, bold: true, font: "Arial", color: "333344" })] });
}

function bodyP(runs) {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: runs });
}

function spacer() { return new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }); }

// RAG badge
function ragBadge(color, label) {
  const fill = color === "Yellow" ? C.yellow : color === "Green" ? C.green : C.red;
  return [tb(` ${label} `, { color: "000000", size: 18, highlight: color.toLowerCase() })];
}

// -- DOCUMENT --
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", run: { size: 44, bold: true, color: C.black, font: "Arial" }, paragraph: { spacing: { before: 0, after: 60 }, alignment: AlignmentType.LEFT } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: C.accent, font: "Arial" }, paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: "333344", font: "Arial" }, paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-sub", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
      { reference: "bullet-metrics", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-transform", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-decisions", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-accel", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, start: 3, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1080, right: 1260, bottom: 1080, left: 1260 }, size: {} }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [t("AIR\u00B2 | Workstream Snapshot | March 2026", { size: 16, color: C.gray, italics: true })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [t("Page ", { size: 16, color: C.gray }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.gray, font: "Arial" }), t(" of ", { size: 16, color: C.gray }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.gray, font: "Arial" })] })] })
    },
    children: [
      // Title block
      new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "AIR\u00B2 \u2014 The AI-Labs", size: 44, bold: true, font: "Arial", color: C.black })] }),
      new Paragraph({ spacing: { before: 0, after: 40 }, children: [t("Workstream Snapshot  |  Payoneer  |  March 2026", { size: 22, color: C.gray })] }),
      new Paragraph({ spacing: { before: 80, after: 200 }, children: [
        tb("Mission: ", { color: C.accent, size: 22 }),
        t("Disruption in execution \u2014 ship AI-powered initiatives to production, fast. Move fast, might fail \u2014 value emerges from velocity.", { size: 22, italics: true, color: "444455" })
      ] }),

      // === SECTION 1 ===
      heading1("1. End-State Vision \u2014 Target Architecture"),
      bodyP([
        tb("Full AI-native flow: ", { color: C.black }),
        t("A fast-cycle AI lab that continuously discovers, builds, and validates high-value initiatives \u2014 surfacing quick wins from across Payoneer and accelerating ongoing AIR workstreams \u2014 then scaling successful MVPs to the relevant domain or retaining them under AIR\u00B2.")
      ]),

      heading2("Building Blocks \u2014 Exist Today"),
      bullet([tb("Framework & methodology: "), t("Discovery (\u22643 days) \u2192 Build MVP (\u22641.5 weeks) \u2192 Keep or Toss (after 3-week run) \u2192 Scale. 4-stage cycle defined and approved.")]),
      bullet([tb("Leadership buy-in: "), t("CPO-approved scope, team model, and operating framework. Two dedicated roles (PM + Engineer) approved for recruitment.")]),
      bullet([tb("Team model: "), t("AIR\u00B2 operates as an AI-native pod (1 PM + 2 Engineers) \u2014 the first live instance of the AI-Native Team Operating Model. Co-Solve workflow: PM and engineers work simultaneously with AI, no handoffs, no sequential gates.")]),
      bullet([tb("Team nucleus: "), t("Lab lead in place. Operations manager assigned (Tom Tomer). Recruitment in progress for core pod.")]),
      bullet([tb("Dual-track intake model: "), t("Track 01 (expedite ongoing AIR initiatives) + Track 02 (BU OPEX initiatives)")]),
      bullet([tb("Success metrics defined: "), t("Throughput (\u201CThe Beat\u201D \u2014 experiments to production/month) + Innovation Delta (estimated impact of scaled MVPs)")]),

      heading2("Building Blocks \u2014 Missing"),
      bullet([tb("Core execution team [gating]: "), t("1 PM + 1 Engineer \u2014 roles approved, recruitment in progress via AI-native hiring flow (aligned with AI Team OS JDs shared with iTalent). Lab cannot run at full cadence without a complete pod.")]),
      bullet([tb("Tooling & dev environment: "), t("Secure, approved toolchain and sandbox not yet operational. Stack direction: flexible \u2014 whatever gets the job done within enterprise guardrails.")]),
      bullet([tb("Prioritized initiative backlog: "), t("Candidate initiatives identified but not yet scored and prioritized for first sprint.")]),

      heading2("Main Workstream Outputs"),
      bullet([t("Experiments pushed to production per month (Throughput)")]),
      bullet([t("MVPs validated and moved to Scale phase (Innovation Delta \u2014 cost savings or revenue impact)")]),
      bullet([t("Reusable AI capabilities remaining under AIR\u00B2 for further iteration")]),

      // === SECTION 2 ===
      new Paragraph({ children: [new PageBreak()] }),
      heading1("2. Quick Wins \u2014 Status & Value"),
      bodyP([t("The lab launched ~2 weeks ago and secured CPO approval last week. No MVPs delivered yet \u2014 by design, the first cycle requires a staffed team.")]),
      spacer(),

      // Quick Wins table
      new Table({
        columnWidths: [600, 4200, 1800, 2760],
        rows: [
          new TableRow({ tableHeader: true, children: [
            headerCell("#", 600), headerCell("What", 4200), headerCell("Status", 1800), headerCell("Impact", 2760)
          ] }),
          new TableRow({ children: [
            dataCellP([t("1")], 600),
            dataCellP([tb("Vendor Spend Optimizer"), t(" \u2014 Agent that consolidates vendor data across systems, identifies spending inefficiencies and redundant contracts")], 4200),
            dataCellP([t("Discovery candidate")], 1800),
            dataCellP([t("Cost savings \u2014 vendor portfolio optimization")], 2760),
          ] }),
          new TableRow({ children: [
            dataCellP([t("2")], 600, { shade: true }),
            dataCellP([tb("Knowledge Navigator"), t(" \u2014 Agent that surfaces undocumented organizational knowledge from scattered sources")], 4200, { shade: true }),
            dataCellP([t("Discovery candidate")], 1800, { shade: true }),
            dataCellP([t("Efficiency \u2014 faster onboarding, fewer knowledge bottlenecks")], 2760, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([t("3")], 600),
            dataCellP([tb("First BU-sourced initiative"), t(" \u2014 TBD from intake pipeline")], 4200),
            dataCellP([t("Intake not yet open")], 1800),
            dataCellP([t("Validates the ideation-to-execution pipeline")], 2760),
          ] }),
        ]
      }),
      spacer(),
      bodyP([tb("What works: ", { color: C.accent }), t("The framework and operating model are clear \u2014 no ambiguity on how experiments flow from Discovery to Scale. Leadership is aligned.")]),
      bodyP([tb("What doesn\u2019t yet: ", { color: C.accent }), t("Can\u2019t start Discovery sprints without the core team in place. Backlog is ideas, not yet scored candidates.")]),

      // === SECTION 3 ===
      heading1("3. From Experiment \u2192 Capability"),
      bodyP([tb("Stage: Pre-POC", { color: C.accent }), t(" \u2014 lab is in setup and team recruitment phase.")]),
      bullet([tb("Architecture blocks validated: "), t("None yet \u2014 awaiting first Discovery sprint and team staffing.")]),
      bullet([tb("What\u2019s needed to reach first scalable capability: "), t("Staffed team (PM + Engineer) \u2192 prioritized backlog \u2192 first Discovery sprint \u2192 first MVP build.")]),
      bullet([tb("Active users today: "), t("Internal team only (Lab Lead + Operations Manager). No BU users onboarded yet.")]),
      bullet([tb("Expected adoption at scale: "), t("BU teams across Payoneer submitting initiative ideas via the ideation layer; successful MVPs handed to domain owners or retained under AIR\u00B2.")]),

      // === SECTION 4 ===
      heading1("4. Dual Horizon Plan"),
      heading2("Next 6\u201312 Weeks \u2014 Execution Milestones"),

      new Table({
        columnWidths: [600, 3600, 2160, 3000],
        rows: [
          new TableRow({ tableHeader: true, children: [
            headerCell("#", 600), headerCell("Milestone", 3600), headerCell("Owner", 2160), headerCell("Dependency", 3000)
          ] }),
          new TableRow({ children: [
            dataCellP([t("M1")], 600),
            dataCellP([tb("Recruit & onboard core pod"), t(" (1 PM + 1 Engineer) \u2014 first AI-native pod hire via adapted hiring flow")], 3600),
            dataCellP([t("Lab Lead + HR")], 2160),
            dataCellP([t("Staffing confirmed; hiring flow aligned with AI Team OS")], 3000),
          ] }),
          new TableRow({ children: [
            dataCellP([t("M2")], 600, { shade: true }),
            dataCellP([tb("Stand up dev environment"), t(" \u2014 secure sandbox with enterprise guardrails")], 3600, { shade: true }),
            dataCellP([t("Engineer + Platform Eng.")], 2160, { shade: true }),
            dataCellP([t("Tooling/access approvals")], 3000, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([t("M3")], 600),
            dataCellP([tb("Score and prioritize initiative backlog"), t(" \u2014 run intake for Track 01 + Track 02 candidates")], 3600),
            dataCellP([t("PM (once onboarded)")], 2160),
            dataCellP([t("Backlog prioritization criteria")], 3000),
          ] }),
          new TableRow({ children: [
            dataCellP([t("M4")], 600, { shade: true }),
            dataCellP([tb("Run first Discovery sprint"), t(" \u2014 select top candidate, 3-day Discovery cycle")], 3600, { shade: true }),
            dataCellP([t("Full team")], 2160, { shade: true }),
            dataCellP([t("M1 + M3 complete")], 3000, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([t("M5")], 600),
            dataCellP([tb("Deliver first MVP"), t(" \u2014 Build phase (\u22641.5 weeks) + Keep-or-Toss after 3-week run")], 3600),
            dataCellP([t("Full team")], 2160),
            dataCellP([t("M4 complete")], 3000),
          ] }),
        ]
      }),

      heading2("6\u201318 Months \u2014 Transformation"),
      bullet([t("AIR\u00B2 operates at steady-state \u201CBeat\u201D \u2014 continuous experiment throughput with measurable OPEX impact per cycle.")], "bullet-transform"),
      bullet([t("Successful MVPs graduated to Scale, with clear handoff to domain owners or retained under AIR\u00B2 for iteration.")], "bullet-transform"),
      bullet([t("BU-wide ideation layer active \u2014 initiative ideas flowing in from across the org, not just lab-generated.")], "bullet-transform"),
      bullet([t("AIR\u00B2 pod serves as proof point for the AI-Native Team Operating Model \u2014 learnings feed directly into the broader pod rollout across the org.")], "bullet-transform"),
      bullet([t("The \u201Cno Payo dependency\u201D principle proven: fast-cycle experiments ship without blocking on standard release processes.")], "bullet-transform"),

      // === SECTION 5 ===
      new Paragraph({ children: [new PageBreak()] }),
      heading1("5. Metrics \u2014 From Learning to Impact"),

      bodyP([tb("Measured today:", { color: C.accent })]),
      bullet([t("Lab setup progress (qualitative) \u2014 team recruitment, tooling readiness, backlog development")], "bullet-metrics"),

      bodyP([tb("Should be measured next:", { color: C.accent })]),
      bullet([tb("Throughput (\u201CThe Beat\u201D): "), t("experiments pushed to production per month")], "bullet-metrics"),
      bullet([tb("Innovation Delta: "), t("estimated potential impact (cost savings or revenue) of MVPs moved to Scale")], "bullet-metrics"),
      bullet([tb("Discovery cycle time: "), t("days from intake to Go/No-Go")], "bullet-metrics"),
      bullet([tb("MVP cycle time: "), t("days from Discovery start to Keep-or-Toss evaluation")], "bullet-metrics"),

      bodyP([tb("When will metrics be measurable:", { color: C.accent })]),
      bullet([t("Throughput & cycle time: after first MVP is completed (est. 4\u20136 weeks from full team onboarding)")], "bullet-metrics"),
      bullet([t("Innovation Delta: once first MVP reaches Scale phase")], "bullet-metrics"),

      bodyP([tb("Measurement gaps:", { color: C.accent })]),
      bullet([t("No baseline data yet \u2014 no experiments have run")], "bullet-metrics"),
      bullet([t("BU value attribution model not yet defined (how to estimate OPEX impact per initiative)")], "bullet-metrics"),

      // === SECTION 6 ===
      heading1("6. Risks & Trade-offs"),
      heading2("Key Risks"),

      new Table({
        columnWidths: [2400, 1200, 5760],
        rows: [
          new TableRow({ tableHeader: true, children: [
            headerCell("Risk", 2400), headerCell("Severity", 1200), headerCell("Detail", 5760)
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Team not staffed")], 2400),
            dataCellP([tb("HIGH", { color: C.red })], 1200),
            dataCellP([t("Lab is pre-team \u2014 PM and Engineer roles approved but not yet filled. Everything downstream (backlog, Discovery, first MVP) is blocked until these are in place.")], 5760),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Backlog not yet prioritized")], 2400, { shade: true }),
            dataCellP([tb("MEDIUM", { color: "CC8800" })], 1200, { shade: true }),
            dataCellP([t("Candidate ideas exist but haven\u2019t been scored. Risk of picking a low-signal first experiment that doesn\u2019t demonstrate the model\u2019s potential.")], 5760, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Tooling environment not ready")], 2400),
            dataCellP([tb("MEDIUM", { color: "CC8800" })], 1200),
            dataCellP([t("Dev sandbox and approved toolchain not yet operational. Could block Build phase even after Discovery completes.")], 5760),
          ] }),
        ]
      }),

      heading2("Key Trade-offs"),
      bodyP([
        tb("Speed vs. quality of first experiment: ", { color: C.accent }),
        t("The lab\u2019s credibility depends on a strong first MVP. Launching before the team is fully staffed risks picking the wrong experiment or executing below standard. Current approach: recruit first, then sprint.")
      ]),

      // === SECTION 7 ===
      heading1("7. Decisions Needed"),
      heading2("Blocking"),
      new Paragraph({ numbering: { reference: "numbered-decisions", level: 0 }, spacing: { before: 40, after: 40 }, children: [
        tb("Staffing timeline: "), t("Accelerate recruitment for PM + Engineer via AI-native hiring flow. Lab cadence is directly gated by team readiness. "), t("(Owner: Lab Lead + HR/iTalent)", { italics: true, color: C.gray })
      ] }),
      new Paragraph({ numbering: { reference: "numbered-decisions", level: 0 }, spacing: { before: 40, after: 40 }, children: [
        tb("Tooling & environment approval: "), t("Confirm access and setup for dev sandbox with enterprise guardrails. "), t("(Owner: Platform Engineering + Security)", { italics: true, color: C.gray })
      ] }),

      heading2("Accelerating (Non-Blocking)"),
      new Paragraph({ numbering: { reference: "numbered-accel", level: 0 }, spacing: { before: 40, after: 40 }, children: [
        tb("Backlog intake process: "), t("Define lightweight intake criteria for BU-sourced initiatives \u2014 keep it simple, avoid committee overhead. "), t("(Owner: PM, once onboarded)", { italics: true, color: C.gray })
      ] }),
      new Paragraph({ numbering: { reference: "numbered-accel", level: 0 }, spacing: { before: 40, after: 40 }, children: [
        tb("Keep-or-Toss evaluation criteria: "), t("Define what \u201Csuccess\u201D looks like for an MVP to graduate to Scale. "), t("(Owner: Lab Lead)", { italics: true, color: C.gray })
      ] }),

      // === SECTION 8 ===
      new Paragraph({ children: [new PageBreak()] }),
      heading1("8. Self-Assessment"),

      new Table({
        columnWidths: [2100, 1200, 6060],
        rows: [
          new TableRow({ tableHeader: true, children: [
            headerCell("Dimension", 2100), headerCell("Rating", 1200), headerCell("Explanation", 6060)
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Proof of Value")], 2100),
            dataCellP([tb("Yellow", { color: "CC8800" })], 1200),
            dataCellP([t("Framework is approved and leadership is aligned, but no MVPs delivered yet. Value is credible but unproven.")], 6060),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Scalability Potential")], 2100, { shade: true }),
            dataCellP([tb("Yellow", { color: "CC8800" })], 1200, { shade: true }),
            dataCellP([t("Scale pathway is designed (dual-track intake, BU ideation layer) but untested. Will validate with first experiment cycle.")], 6060, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Architectural Clarity")], 2100),
            dataCellP([tb("Green", { color: C.green })], 1200),
            dataCellP([t("4-stage cycle, dual-track intake, team model, success metrics \u2014 all defined and CPO-approved.")], 6060),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Measurement Maturity")], 2100, { shade: true }),
            dataCellP([tb("Yellow", { color: "CC8800" })], 1200, { shade: true }),
            dataCellP([t("Metrics defined (Throughput + Innovation Delta) but no data yet. Measurable after first MVP.")], 6060, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Overall")], 2100),
            dataCellP([tb("Yellow", { color: "CC8800" })], 1200),
            dataCellP([t("Well-structured, CPO-approved, but pre-first-experiment. Staffing is the critical gate.")], 6060),
          ] }),
        ]
      }),

      heading2("Summary Table"),

      new Table({
        columnWidths: [2700, 6660],
        rows: [
          new TableRow({ tableHeader: true, children: [
            headerCell("Dimension", 2700), headerCell("Answer", 6660)
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Top Quick Win")], 2700),
            dataCellP([t("Vendor Spend Optimizer \u2014 in Discovery backlog, awaiting team staffing to start")], 6660),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Proven Value")], 2700, { shade: true }),
            dataCellP([t("Not yet \u2014 pre-first-experiment. Framework and mandate CPO-approved.")], 6660, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Scalable Capability")], 2700),
            dataCellP([t("Not yet built. Scale pathway defined in framework.")], 6660),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Architecture Readiness")], 2700, { shade: true }),
            dataCellP([t("Green \u2014 4-stage cycle, dual-track intake, team model, metrics all defined")], 6660, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Next 6\u201312 Week Focus")], 2700),
            dataCellP([t("Recruit team \u2192 stand up environment \u2192 prioritize backlog \u2192 first Discovery sprint \u2192 first MVP")], 6660),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Biggest Risk")], 2700, { shade: true }),
            dataCellP([t("Core team not yet staffed \u2014 everything downstream is blocked")], 6660, { shade: true }),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Key Decision Needed")], 2700),
            dataCellP([t("Accelerate PM + Engineer recruitment; approve tooling/environment setup")], 6660),
          ] }),
          new TableRow({ children: [
            dataCellP([tb("Overall Status")], 2700, { shade: true }),
            dataCellP([tb("Yellow", { color: "CC8800" }), t(" \u2014 CPO-approved, well-structured, gated on team staffing")], 6660, { shade: true }),
          ] }),
        ]
      }),
    ]
  }]
});

const outPath = process.argv[2] || "/Users/yorpeli/Documents/Dev/SecondBrain/initiatives/air-squared/docs/workstream-snapshot-march2026.docx";
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(outPath, buf); console.log("Written to " + outPath); });
