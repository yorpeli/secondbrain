import 'dotenv/config'
import { readFileSync, writeFileSync } from 'fs'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ShadingType,
  FileChild,
} from 'docx'
import {
  Colors,
  Fonts,
  Sizes,
  Spacing,
  title as docTitle,
  h1,
  h2,
  body,
  bullet,
  styledTable,
  divider,
  createSection,
  createDocumentStyles,
} from '../lib/doc-style.js'
import { chartParagraph } from '../lib/chart-embed.js'

const FONT = Fonts.primary
const OUT_DIR = 'output/uk-rollout-week1'

// Load chart images
const volumeChart = readFileSync(`${OUT_DIR}/volume-trend.png`)
const companyFunnel = readFileSync(`${OUT_DIR}/funnel-company.png`)
const individualFunnel = readFileSync(`${OUT_DIR}/funnel-individual.png`)
const segmentHeatmap = readFileSync(`${OUT_DIR}/segment-heatmap.png`)

async function main() {
  const children: FileChild[] = []

  // ── Title ──
  children.push(docTitle('UK CLM 100% Rollout'))
  children.push(h1('Week 1 Analysis — February 14, 2026'))

  // ── Executive Summary ──
  children.push(h2('Executive Summary'))
  children.push(body(
    'The UK became the first hub country to reach 100% CLM rollout on February 8, 2026. ' +
    'This milestone validates a 6-month effort to redesign the customer onboarding flow: CLM now approves 60% more accounts than the legacy system, ' +
    'completes verification in half the time, and reduces document resubmission requests by 50%. The UK rollout is the model we will scale to the remaining hub countries.',
  ))
  children.push(body(
    'After one week of monitoring, the rollout is performing as expected — all leading indicators are green and the onboarding funnel is progressing normally. ' +
    'Both Company and Individual account types are tracking at their historical baselines with no signs of degradation.',
  ))
  children.push(body(
    'One structural shift was identified: the full population has a higher proportion of Individual registrants ' +
    '(44% vs 35% during the pilot phase). This will shift the blended approval rate as the population normalizes — ' +
    'each account type continues to perform at its own baseline, and we are tracking them independently to ensure clarity.',
  ))

  // Status callout
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '  WEEK 1 STATUS: GREEN  ', font: FONT, size: Sizes.h2, bold: true, color: Colors.white }),
      ],
      shading: { type: ShadingType.CLEAR, fill: Colors.onTrack },
      spacing: { before: 200, after: 200 },
    }),
  )

  children.push(divider())

  // ── Key Metrics ──
  children.push(h2('Key Metrics at a Glance'))

  children.push(styledTable(
    ['Metric', 'Rollout Week (Feb 8)', 'Previous (Feb 1)', 'Signal'],
    [
      ['Total volume', '243 accounts', '144 accounts', '+69%'],
      ['Company volume', '136 accounts', '93 accounts', '+46%'],
      ['Individual volume', '107 accounts', '51 accounts', '+110%'],
      ['Company share', '56%', '65%', '-9pp shift'],
      ['Company routing rate', '97.8%', '98.9%', 'Stable'],
      ['Individual routing rate', '90.7%', '92.2%', 'Stable'],
      ['CLM vs legacy approval (mature cohorts)', '+18.0pp', '—', 'Strong'],
    ],
  ))

  children.push(divider())

  // ── Volume Trend ──
  children.push(h2('Volume Trend'))
  children.push(body(
    'Account creation volume has been steadily growing over the past 12 weeks. The rollout week (starting Feb 8) shows a clear step-up ' +
    'to 243 accounts — roughly 1.7x the prior week. This represents the first full week at 100% routing; we expect volume to stabilize ' +
    'over the next 2-3 weeks as the change takes full effect.',
  ))
  children.push(...chartParagraph({
    buffer: volumeChart,
    width: 800,
    height: 450,
    caption: 'Figure 1: Weekly CLM account creation volume. Dashed line marks 100% rollout.',
  }))

  children.push(divider())

  // ── Entity Type Analysis ──
  children.push(h2('Entity Type Analysis'))
  children.push(body(
    'Company and Individual are tracked independently — each has its own baseline and maturation curve. ' +
    'At 100% rollout, the entity mix shifted: Individual accounts now represent 44% of volume (up from 35%). ' +
    'This is expected — the 25% sample over-indexed on Company. The blended approval rate will settle slightly lower, ' +
    'but this reflects a population change, not a performance change.',
  ))

  children.push(styledTable(
    ['Entity Type', 'Pre-Rollout Share', 'Rollout Week Share', 'Change'],
    [
      ['Company', '65%', '56%', '-9pp'],
      ['Individual', '35%', '44%', '+9pp'],
    ],
  ))

  children.push(...chartParagraph({
    buffer: segmentHeatmap,
    width: 800,
    height: 450,
    caption: 'Figure 2: Entity type breakdown — all metrics within expected range for Week 1 maturity.',
  }))

  children.push(divider())

  // ── Company Deep-Dive ──
  children.push(h2('Company — Funnel Progression'))
  children.push(body(
    'Company accounts are the priority segment (higher revenue per account and faster time-to-first-transaction). ' +
    'At 136 accounts in the rollout week (+46% vs prior), volume is healthy. ' +
    'The funnel shows the expected maturation pattern: approval at 10.3% after one week will climb as accounts ' +
    'progress through document submission and review. For context, the Jan 25 cohort (now 3 weeks mature) sits at 47.9% approval.',
  ))

  children.push(styledTable(
    ['Week', 'Rollout', 'Created', 'Seg %', 'Docs %', 'Appr %', 'Maturity'],
    [
      ['Jan 4', '25%', '59', '98.3%', '71.2%', '47.5%', '6 weeks'],
      ['Jan 11', '25%', '85', '100.0%', '58.8%', '44.7%', '5 weeks'],
      ['Jan 18', '25%', '70', '98.6%', '68.6%', '40.0%', '4 weeks'],
      ['Jan 25', '25%', '73', '98.6%', '67.1%', '47.9%', '3 weeks'],
      ['Feb 1', '25%', '93', '98.9%', '61.3%', '35.5%', '2 weeks'],
      ['Feb 8', '100%', '136', '97.8%', '48.5%', '10.3%', '1 week'],
    ],
  ))

  children.push(...chartParagraph({
    buffer: companyFunnel,
    width: 800,
    height: 450,
    caption: 'Figure 3: Company funnel — rollout week vs previous. Lower rates at Week 1 reflect maturity, not degradation.',
  }))

  children.push(divider())

  // ── Individual Deep-Dive ──
  children.push(h2('Individual — Funnel Progression'))
  children.push(body(
    'Individual accounts saw the largest percentage increase (+110% week-over-week), driven by the population mix shift described above. ' +
    'Funnel metrics are within the historical range for Individual accounts at this maturity level. ' +
    'Document submission rate (37.4%) is slightly below the pilot average (39.6-43.3%) but within normal weekly variation.',
  ))

  children.push(styledTable(
    ['Week', 'Rollout', 'Created', 'Seg %', 'Docs %', 'Appr %', 'Maturity'],
    [
      ['Jan 4', '25%', '48', '100.0%', '39.6%', '33.3%', '6 weeks'],
      ['Jan 11', '25%', '60', '90.0%', '43.3%', '26.7%', '5 weeks'],
      ['Jan 18', '25%', '60', '91.7%', '40.0%', '26.7%', '4 weeks'],
      ['Jan 25', '25%', '53', '94.3%', '41.5%', '28.3%', '3 weeks'],
      ['Feb 1', '25%', '51', '92.2%', '43.1%', '33.3%', '2 weeks'],
      ['Feb 8', '100%', '107', '90.7%', '37.4%', '23.4%', '1 week'],
    ],
  ))

  children.push(...chartParagraph({
    buffer: individualFunnel,
    width: 800,
    height: 450,
    caption: 'Figure 4: Individual funnel — rollout week vs previous.',
  }))

  children.push(divider())

  // ── Context ──
  children.push(h2('Why UK Was First'))
  children.push(body(
    'The UK was selected as the first hub country for 100% CLM rollout based on consistently strong performance:',
  ))
  children.push(bullet('CLM approval rate 60% higher than legacy 4Step (36.3% vs 18.3%)'))
  children.push(bullet('End-to-end verification time halved: 5.9 days (Oct) to 3.3 days (Jan)'))
  children.push(bullet('Reopened document rate halved: 35.2% to 17.4%'))
  children.push(bullet('eKYB pilot drove CVR from 33% to 44%'))
  children.push(bullet('Cross-functional execution: Product, Compliance, Legal, and Ops aligned'))

  children.push(divider())

  // ── What's Next ──
  children.push(h2('What We\'re Watching — Weeks 2-4'))
  children.push(body(
    'Full maturation for rollout-week cohorts takes approximately 4 weeks (target: March 8). ' +
    'During this period we are monitoring:',
  ))
  children.push(bullet('Approval rate progression for Company and Individual — each compared to pre-rollout cohorts at the same maturity'))
  children.push(bullet('Entity mix stabilization — confirming whether the 56/44 Company/Individual split holds'))
  children.push(bullet('Document submission rates as an early indicator of downstream approval'))
  children.push(bullet('Ops queue depth and reopened requirements rate'))
  children.push(body(
    'Next update: Week 2 analysis on February 21 with the first apples-to-apples approval comparison. ' +
    'Final maturity report: week of March 8.',
  ))

  children.push(divider())

  // ── Call to Action ──
  children.push(h2('What We Need From You'))
  children.push(bullet('Ops leads: Flag any unusual queue patterns or document quality issues before the Week 2 report'))
  children.push(bullet('Country managers: Report any customer or partner feedback related to the onboarding experience'))
  children.push(bullet('Compliance: Confirm no regulatory or audit concerns with the full-population flow'))
  children.push(body(
    'If you see anything unexpected, reach out to the CLM Product team immediately — early signal is critical during this monitoring window.',
  ))

  // ── Build ──
  const doc = new Document({
    styles: createDocumentStyles(),
    sections: [createSection('UK CLM 100% Rollout — Week 1 Analysis | Confidential', children)],
  })

  const buffer = await Packer.toBuffer(doc)
  writeFileSync(`${OUT_DIR}/UK-CLM-100pct-Rollout-Week1-Analysis.docx`, buffer)
  console.log(`Saved: ${OUT_DIR}/UK-CLM-100pct-Rollout-Week1-Analysis.docx`)
}

main()
