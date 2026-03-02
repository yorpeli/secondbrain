---
summary: Compliance Change Management Request (CMR) guide — form structure, entity list, InRule fields, writing style, data enrichment patterns
topics: [compliance, kyc, policy, process]
agents: [kyc-product-pm, team-lead]
source: Adapted from Pablo Battro's payoneer-cursor-skills (2026-Q1)
---

# Compliance Change Management Request (CMR)

> Guide for completing Payoneer's official CMR form.
> Covers form structure, field definitions, entity mapping, InRule-specific fields, and quality expectations.

---

## What Is a CMR

A CMR is the formal process for requesting changes to compliance models, policies, procedures, or customer-facing flows at Payoneer. It requires structured documentation of the change, its rationale, impact analysis, and stakeholder sign-off.

## Payoneer Legal Entities

Every CMR must specify which entities are affected:

| Entity | Abbreviation | Jurisdiction |
|--------|-------------|-------------|
| Payoneer Inc | INC | Americas and ROW |
| Payoneer Europe Limited | PEL | EU |
| Payoneer Australia Pty Limited | AU | Australia |
| Payoneer Japan Limited | JP | Japan |
| Payoneer Hong Kong Limited | HK | Hong Kong |
| Payoneer Singapore Pte Limited | SG | Singapore |
| Payoneer Payment Services (UK) Limited | UK | United Kingdom |
| Payoneer (Guangzhou) Commerce Services Co. Ltd. | CN | China |

**Rule of thumb:** LATAM-specific → INC only. Global policy → all entities. When unsure, confirm with the requester.

## CMR Form Sections

### Section 1: Change Request Information

| Field | Guidance |
|-------|---------|
| Change Requester(s) | Name(s) and team(s) |
| Change Title | Short, descriptive (e.g., "Increase Threshold for PARE Rule 742") |
| Date | Default to today |
| Priority | L (Low), M (Medium), H (High) |
| Stakeholders | Names + titles. Prompt: "Who from KYC, Risk, Compliance, GTM, Ops, Engineering?" |
| Change Type | Compliance Model/System, Compliance Policy/Procedure, Customer Facing Changes (can be multiple) |

### Section 2: General Request Details

| Field | What to capture |
|-------|----------------|
| **Current Process** | How things work today — system, thresholds, team, flows. Be specific. |
| **Requested Change** | Exactly what changes. For InRule: rule name + current vs. new threshold. For process: new flow step-by-step. |
| **Reason for Change** | Business impact, customer experience, operational efficiency, regulatory alignment. Quantify. |
| **Predicted Effects** | Customer impact, operational workload change, risk implications. Acknowledge control gaps honestly. |
| **Effects of NOT Changing** | Revenue at risk, customer friction, compliance exposure, operational burden. |
| **Procedures to Update** | KYC guides, rule docs, operational playbooks — include links or formal titles. |
| **Entities** | Which legal entities are affected (see table above). |

### Section 3: InRule Specific (Skip if Not Applicable)

Only complete if the change involves an InRule rule (alerts, thresholds, suppressions).

| Field | Notes |
|-------|-------|
| Rule name(s) | Engine name, e.g., "PARE Rule 742" |
| Full rule logic | Link to Rule Logic + PBI links |
| Purpose of rule | One paragraph: what it does, why it exists |
| Current alert handling | Link or formal procedure name |
| Rule performance analysis | Hit counts, true positive rates, volumes, customer impact (pull from BigQuery if possible) |
| Change request type | New rule / Rule deletion / Suppression-exclusion / Rule change / Data source change / System change |
| Explanation | Specific description of the requested change |
| Rationale | Replaced by another system / Replaced by another rule / Business requirements changed / Regulatory requirements changed / Irrelevant / Ineffective / Bad CX / Other |

### Section 4: Impact & Training

| Area | Prompts |
|------|---------|
| **Operational Impact** | Increase/decrease in work? Engineering lift? How many customers/transactions affected? Cost/hours saved? |
| **Business Acknowledgment** | Did you speak with the business? Who? |
| **Strategic Impact** | Regulatory matter? Risk assessment update needed? Part of roadmap/OKR? Affects KPI/KRI? |
| **Training** | Training needed? Which team? Responsible training team? |

### Section 5 & 6: Notes & Approval

Left blank in the initial submission — filled by HOC/MLRO and other approvers.

## Writing Style

Based on approved CMR examples:

- **Be specific** — "increase threshold from $15K to $25K" not "adjust the threshold"
- **Quantify everything** — dollar amounts, customer counts, percentages, time periods
- **Reference systems by name** — "PARE Rule 742", "FDC Requirement #4", "BARE 225"
- **Include links** — SharePoint, Power BI dashboards, Lighthouse guides, Azure DevOps PBIs
- **Acknowledge trade-offs** — don't hide control gaps, address them directly
- **Name stakeholders** — full name + title, not just "the team"

## Data Enrichment

Before submitting, consider pulling supporting data from BigQuery (see `bigquery-guide.md`):

- Rule hit counts and true positive rates
- Transaction volumes by segment
- Customer impact counts
- Approval/conversion rates
- Week-over-week trends

This strengthens the "Reason for Change" and "Predicted Effects" sections with hard numbers.
