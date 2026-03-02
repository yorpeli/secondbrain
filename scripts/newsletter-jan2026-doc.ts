import { Document, Packer, TextRun, Paragraph, FileChild } from 'docx'
import {
  title, subtitle, h1, h2, body, richBody, bullet, divider, spacer,
  styledTable, createSection, createDocumentStyles,
  Colors, Fonts, Sizes,
} from '../lib/doc-style.js'
import * as fs from 'fs'

const FONT = Fonts.primary

// Helper: bold inline
function b(text: string): TextRun {
  return new TextRun({ text, font: FONT, size: Sizes.body, color: Colors.charcoal, bold: true })
}
// Helper: normal inline
function t(text: string): TextRun {
  return new TextRun({ text, font: FONT, size: Sizes.body, color: Colors.charcoal })
}
// Helper: italic inline
function i(text: string): TextRun {
  return new TextRun({ text, font: FONT, size: Sizes.body, color: Colors.charcoal, italics: true })
}

const children: FileChild[] = [
  title('CLM Newsletter – January 2026'),
  spacer(),

  // Opening
  body('Hi All,'),
  body('In January, the UK became our first country at 100% CLM rollout, we launched e-Collection across 7 countries, and shipped real-time document quality feedback.'),
  body('Corrections and additions welcome — reach out directly.'),
  body('Yonatan.'),
  divider(),

  // Status of CLM
  h1('Status of CLM'),
  body('The UK reached 100% CLM rollout in January with a 47% approval rate — the highest of any hub country and our first full-country deployment. Early evidence for the localization-first approach: local e-verification vendors, country-specific document handling, and tailored flows produced a 47% approval rate versus 19–21% overall.'),
  body('Overall approval rates remained in the 19–21% range through Q4. The total rate dipped from 21% (October) to 19% (December) as we expanded into segments and geographies with lower baseline rates. Tier 1+2 company rates on desktop held at 26–28% — the dip reflects rollout breadth, not degradation. January\'s product launches should begin reversing this; we\'ll report results next month.'),
  richBody([
    t('CLM\'s Q1 product work is organized around four customer-outcome pillars: '),
    i('Right Level of Verification'),
    t(', '),
    i('Fast Approval Fast Start'),
    t(', '),
    i('Clear Expectations Upfront'),
    t(', and '),
    i('Onboarding That Fits My Business & Market'),
    t('. January concentrated on verification efficiency and approval speed. Work under '),
    i('Clear Expectations Upfront'),
    t(' is planned for later this quarter.'),
  ]),
  divider(),

  // Approval Rates
  h1('Approval Rates'),
  styledTable(
    ['Metric', 'September', 'October', 'November', 'December'],
    [
      ['Approval Rate, total', '16%', '21%', '21%', '19%'],
      ['Approval Rate, Tier 1+2, companies, desktop', '29%', '28%', '26%', '27%'],
    ],
    [40, 15, 15, 15, 15],
  ),
  spacer(),
  richBody([i('[Chart: Top Countries Approval Rate — Brazil, Singapore, UAE, UK, US, Total. Extend to include January data if available.]')]),
  divider(),

  // Rollout Status
  h1('Rollout Status'),
  body('CLM now covers [X]% of direct-to-Payoneer (d2p) global traffic and [Y]% of all traffic, up from 21% and 13% in December — driven by UK\'s full rollout and Partners Phase 2 expanding CLM to 400+ additional programs.'),
  divider(),

  // Key Achievements
  h1('Key Achievements'),

  h2('Right Level of Verification'),
  richBody([b('Real-time quality feedback'), t(' — Launched a global A/B experiment: the system flags POR quality issues — blurriness, cropping, missing data — instantly during upload, replacing the days-long wait-then-reject cycle. Targeting 5% POR approval rate uplift; results expected mid-February.')]),
  richBody([b('e-Collection for companies'), t(' — Using a single input — company registration number — the system pre-fills company details from e-verification vendors. Live since late January for companies in Brazil, Colombia, Mexico, Turkey, Philippines, Argentina, and Pakistan. Customers provide one data point instead of four; when confirmed, CVD and POCA document requirements are removed. At full rollout across these 7 countries: 9% KYC funnel completion uplift and 8% approval rate uplift expected.')]),
  richBody([b('US document requirements reduced'), t(' — EIN requirement removed for eKYB-passing customers, live for 100% of US traffic (78% of US companies). POCA removal when e-verification succeeds: live at 50% rollout. Targeting 7-day reduction in approval time.')]),

  h2('Fast Approval, Fast Start'),
  richBody([b('POR address extraction'), t(' — Full address extraction via Persona launched January 13. Early data: test group auto-approves ~1% more PORs than control. Two additional countries opened (Turkey and Ukraine at 25% of traffic). Next: expand to all global addresses.')]),
  richBody([b('Documents orchestration: authenticity fallback'), t(' — When Resistant.AI returns an indecisive fraud check, the system now routes to Persona automatically (launched January 28). Targets the current ~18% indecisive rate. In initial validation (5% of traffic), test group approves ~4% more documents. At scale (~45K documents monthly): 8% more documents approved, 2% KYC account approval uplift expected.')]),

  h2('Onboarding That Fits My Business & Market'),
  richBody([b('T1 Localization'), t(':')]),
  bullet('Brazil: Approval rate 41% → 47%. Time to approval down 25–31%.'),
  bullet('UK: Approval rate 41% → 47%. Time to approval improved 26% (5.8 → 4.3 days).'),
  bullet('Both markets reduced ops document review volume by requiring fewer documents.'),
  richBody([b('Partners Phase 2'), t(' — Rolled out January 19. Covers non-Lite Plan Tier 3, 30% of Tier 2, 10% of Tier 1, plus Banking and PWP programs. 400+ programs, ~15,000 registrations/month expected. ~1,000 registrations in the first two weeks — 5,000 (mid-February target) required for statistically significant conversion data.')]),
  divider(),

  // Workstream Updates
  h1('Workstream Updates'),
  richBody([b('T1 Localization'), t(' (Yael) — On track. US: monitoring EIN impact, scaling POCA toward 100%. Q1 eKYB expansion plan due mid-February. Singapore vendor evaluation: decision expected [date]. Next: full eCollection via local vendors in Brazil and UK.')]),
  richBody([b('Vendor Optimization'), t(' (Elad) — POR extraction, authenticity fallback, and vendor A/B tests running. RAI indecisive rate trending down: 20% (mid-2025) → 17% (Dec) → targeting 14.5% (Feb). Sumsub pricing received, Applause selfie POC offered, Persona evaluation ongoing. Vendor monitoring dashboard launching mid-February.')]),
  richBody([b('Partners Rollout'), t(' (Meital) — Phase 2 stable. Evaluating through mid-February before scaling to 100% Lite plan + phased eBay rollout.')]),
  richBody([b('China & Hong Kong'), t(' (Yael) — China Drop 0 complete. Drop 1 now targets 2nd week of March (shifted from late February). Go/No-Go: February 24. Training and workflow prep due March 7. Hong Kong: Figma finalized, vendor integration underway, development targeting end of March.')]),
  richBody([b('KYC New Flow'), t(' (Elad) — Real-time quality experiment live; results expected mid-February. Multiple concurrent A/B tests launched. Risk: overlapping experiments may confound individual result attribution.')]),
  divider(),

  // Challenges & Learnings
  h1('Challenges & Learnings'),
  richBody([b('China timeline'), t(' — Drop 1 shifted from late February to 2nd week of March. Root cause: training materials, guides, and workflows were underscoped in the original timeline. Go/No-Go: February 24.')]),
  richBody([b('Concurrent experiment load'), t(' — Multiple concurrent vendor tests, rollouts, and A/B experiments risk confounding individual impact measurement. Mitigation: shared experiment tracker across workstreams, launching [date].')]),
  richBody([b('Heads up:'), t(' The China Go/No-Go on February 24 will determine Q1 rollout timing. Decision and updated plan to follow by end of February.')]),
  divider(),

  // Looking Ahead
  h1('Looking Ahead — February'),

  h2('Right Level of Verification'),
  richBody([b('IDV collection in account setup'), t(' (experiment) — Moving identity verification into account setup with real-time data extraction, replacing manual entry. Scope: all CLM users in incorporation countries. Expected: 2.5% KYC funnel completion uplift, 2% approval rate uplift.')]),
  richBody([b('POR collection in account setup'), t(' (experiment) — Moving POR collection into account setup so users upload documents while already providing personal information, not as a separate step later. Scope: all CLM users globally. Expected: 1.5% KYC funnel completion uplift, 1% approval rate uplift.')]),
  richBody([b('POR Localization'), t(' — Adding country-specific document types for Korea, Turkey, Ukraine, and UAE. Expected: 1% POR approval rate uplift in those countries.')]),
  richBody([b('Companies\' document removal'), t(' — Removing CVD and POCA requirements when e-verification confirms data, even without e-Collection. GA for companies, pending vendor coverage.')]),

  h2('Fast Approval, Fast Start'),
  richBody([b('Vendor scaling'), t(' — Completing POR full-address and authenticity fallback tests by mid-February. RAI indecisive rate on track to reach 14.5% — lowest ever. Next target: single digits by [quarter].')]),
  richBody([b('Vendor monitoring'), t(' — Launching systematic performance analysis across all verification vendors: true positive/negative rates and match rates. Enables data-driven vendor selection and SLA enforcement.')]),

  h2('Onboarding That Fits My Business & Market'),
  richBody([b('Enterprise Partners'), t(' — After Phase 2 evaluation (mid-February), scaling to 100% Lite plan + phased eBay rollout. Opening CLM for Enterprise partners supporting payment methods beyond account-based.')]),
  richBody([b('T1 Localization'), t(' — Brazil and UK: full eCollection rollout via local vendors. US: finalizing Q1 eKYB plan, continuing POCA scaling.')]),
  richBody([b('China & Hong Kong'), t(' — China Go/No-Go February 24. Hong Kong development targeting end of March.')]),
  divider(),

  // Open Items Tracker
  h1('Open Items Tracker'),
  richBody([b('Carried forward:')]),
  styledTable(
    ['Item', 'First Mentioned', 'Status'],
    [
      ['Mobile-to-desktop routing', 'Oct 2025', '[Needs update: shipped, deprioritized, or absorbed?]'],
      ['InRule to P&Q transition', 'Oct 2025', '[Needs update: still planned? Timeline?]'],
      ['Showroom replacement', 'Oct 2025', '[Needs update: EOY 2025 target passed — status?]'],
      ['Singapore eKYB vendor evaluation', 'Dec 2025', 'Discovery ongoing — decision expected [date].'],
      ['Migration Automation Tool', 'Nov 2025', 'Operational. Used for Canada License cleanup (Jan 5).'],
      ['Multi-vendor POCs', 'Dec 2025', 'Sumsub pricing received, Applause selfie POC offered, Persona evaluation ongoing.'],
    ],
    [40, 20, 40],
  ),
  spacer(),
  richBody([b('New items to track:')]),
  styledTable(
    ['Item', 'Introduced', 'Expected Resolution'],
    [
      ['Real-time quality feedback A/B results', 'Jan 2026', 'Mid-February'],
      ['Partners Phase 2 conversion evaluation', 'Jan 2026', 'Mid-February'],
      ['China Go/No-Go decision', 'Jan 2026', 'February 24'],
      ['Vendor monitoring dashboard launch', 'Jan 2026', 'Mid-February'],
    ],
    [40, 20, 40],
  ),
]

const doc = new Document({
  styles: createDocumentStyles(),
  sections: [createSection('CLM Newsletter — January 2026', children)],
})

const outPath = 'output/clm-newsletter-jan-2026.docx'
Packer.toBuffer(doc).then(buf => {
  fs.mkdirSync('output', { recursive: true })
  fs.writeFileSync(outPath, buf)
  console.log(`Written to ${outPath}`)
})
