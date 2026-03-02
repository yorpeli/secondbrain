---
summary: Looker API guide for CLM funnel — model/view, all funnel measures, 47 filters with defaults, key Look IDs, query patterns
topics: [looker, data-analysis, clm-funnel, metrics, api]
agents: [analytics]
---

# Looker — CLM Funnel Data Guide

> How to pull CLM funnel data from Looker via API.
> For general analytical context, see `CLM-Data-Context.md`.
> For event/property definitions, see `CLM-Data-Dictionary.md`.

---

## Connection

**API**: Looker API v4.0
**Instance**: `payoneer.cloud.looker.com`
**Auth**: Client credentials via environment variables

```
LOOKER_BASE_URL=payoneer.cloud.looker.com
LOOKER_CLIENT_ID=<your-client-id>
LOOKER_CLIENT_SECRET=<your-client-secret>
LOOKER_INSECURE=1
```

**Client library**: `/Users/irama/Documents/CVR report test/MVP/looker_client.py`
**Virtual env**: `/Users/irama/Documents/CVR report test/MVP/.venv`

### Authentication flow

1. POST to `/api/4.0/login` with `client_id` and `client_secret`
2. Response contains `access_token`
3. Use token in `Authorization: token {access_token}` header

### Available functions (looker_client.py)

| Function | Purpose |
|----------|---------|
| `login(ctx)` | Authenticate, returns access token |
| `api_get(ctx, token, path)` | GET any Looker API endpoint |
| `get_look(ctx, token, look_id)` | Fetch a Look's definition (query, filters, fields) |
| `run_inline_query(ctx, token, query_body, result_format, cache)` | Execute a query directly — primary method for pulling data |
| `all_lookml_models(ctx, token)` | List LookML models (requires model access) |

---

## The CLM Funnel Model

**Model**: `product`
**View**: `clm_population_main_dashboard`

This is the single model/view used by all CLM funnel dashboards and looks in Looker.

---

## Funnel Measures

These are the steps of the CLM funnel as represented in Looker. Listed in funnel order.

### Sign-Up

| # | API Name | Looker UI Label | Description |
|---|----------|----------------|-------------|
| 1 | `accounts_created_clm` | Accounts Created - Email Verified | Number of AH IDs (Account Holder IDs) created. In CLM, the account is created after the customer verifies their email. In Four Step, the account is created after completing step 1 |
| 2 | `mfa_sent` | MFA Sent | Phone verification code was sent (SMS or WhatsApp) |
| 3 | `mfa_approved` | MFA Approved | Phone verified successfully |
| 4 | `clm_completed_signup` | Completed Quick Sign Up | Customer completed signup — next time they return, they can log in instead of signing up again |

### Segmentation

| # | API Name | Looker UI Label | Description |
|---|----------|----------------|-------------|
| 5 | `clm_started_segmentation` | Started Segmentation | Customer entered the segmentation flow |
| 6 | `clm_finished_segmentation` | Completed Segmentation | Customer completed segmentation |

### Account Setup (Info & Documents)

Account Setup starts after the customer completes segmentation and chooses to proceed. The path differs for Companies vs Individuals. Use `ah_type` filter to segment.

**Account Setup sub-funnel — Companies** (`ah_type = Company`):

| # | API Name | Looker UI Label | Description |
|---|----------|----------------|-------------|
| 7a | `filled_business_information` | Filled Business Information | Company details (name, DBA, entity type) |
| 7b | `provided_website` | Website Step Passed | Customer provided a URL or chose to proceed without one |
| 7c | `selected_business_regions` | Selected Business Regions | Business activity region selected |
| 7d | `filled_business_registered_address` | Filled Business Registered Address | Registered business address provided |
| 7e | `provided_business_legal_id` | Provided Business Legal ID | BRN/EIN and incorporation date provided |
| 7f | `authorized_representative_details` | Authorized Representative Details | AR (Account Representative) personal details — name, DOB, nationality. Same KYC as Individuals |
| 7g | `authorized_representative_address` | Authorized Representative Address | AR residential address |
| 7h | `authorized_representative_id` | Authorized Representative ID | AR identity document details |

**Account Setup sub-funnel — Individuals** (`ah_type = Individual`):

| # | API Name | Looker UI Label | Description |
|---|----------|----------------|-------------|
| 7a | `provided_website` | Website Step Passed | Customer provided a URL or chose to proceed without one |
| 7b | `selected_business_regions` | Selected Business Regions | Business activity region selected |
| 7c | `filled_personal_details` | Filled Personal Details | Personal details — name, DOB, nationality |
| 7d | `filled_personal_address` | Filled Personal Address | Residential address |
| 7e | `provided_personal_id` | Provided Personal ID | Identity document details |

**Account Setup — shared steps (both Companies and Individuals):**

| # | API Name | Looker UI Label | Description |
|---|----------|----------------|-------------|
| 8 | `bank_account_details` | Bank Account Details | Customer provided bank account details (withdrawal bank) |
| 9 | `provided_information` / `confirmed_tcs` | Signed T&Cs | Customer signed T&Cs. Triggers verification engines in the background (e-verification, screening, connection checks, rule checks) |
| 10 | `requests_created_step` | Docs Requested (After AAS) | KYC requirements were opened and the customer can proceed to the "Documents" step |
| 11 | `requests_submitted_step` | Submitted At Least 1 Document | Customer submitted at least one document requirement |
| 12 | `submitted_all_docs_step` | Submitted All Docs | Customer submitted all required documents |

### Approval

| # | API Name | Looker UI Label | Description |
|---|----------|----------------|-------------|
| 13 | `accounts_approved` | Accounts Approved | Customer is approved |

### Post-Approval

| # | API Name | Looker UI Label | Description |
|---|----------|----------------|-------------|
| 14 | `had_fft` | Had FFT (30D) | First Financial Transaction — a transaction attempt was made (incoming or outgoing, not necessarily successful). Applies to both payers and receivers |
| 15 | `icp_500` | $500 Volume (30 Days) | Customer reached $500 USD volume within 30 days after approval |
| 16 | `icp_10k` | $10K Volume (30 Days) | Customer reached $10K USD volume within 30 days after approval |

### Post-Approval (additional)

| API Name | Looker UI Label | Description |
|----------|----------------|-------------|
| `fft_dynamic_measure` | Had FTL (30Days) | First Time Load — funds were loaded to the account balance. Applies to incoming payments that were successful only (not outgoing). Unlike FFT, FTL requires the transaction to be successful |
| `icp500_dynamic_measure` | Reached $500 Volume (30 Days) | Dynamic-timeframe variant of icp_500 — exact timeframe TBD |
| `icp10k_dynamic_measure` | Reached $10K Volume (30 Days) | Dynamic-timeframe variant of icp_10k — exact timeframe TBD |
| `edd_accounts` | Edd Accounts | N/A — not in active use |

### Four Step–only measures (not relevant for CLM analysis)

| API Name | Description |
|----------|-------------|
| `completed_quick_signup_step_2` | Account created in Four Step flow |
| `completed_signup_step_4` | Equivalent of completing T&Cs in CLM |
| `glps_qualification_approved_auto` | Four Step–specific, not relevant |
| `glps_qualification_approved` | Four Step–specific, not relevant |
| `glps_qualification_opened_not_approved_auto` | Four Step–specific, not relevant |

---

## Filters Reference

All filters belong to the `clm_population_main_dashboard` view. When building a query, prefix each filter name with `clm_population_main_dashboard.`.

### Default Filter Set for Standard CLM Funnel Queries

When pulling CLM funnel data without a specific analytical question, use this default filter set:

```json
{
  "clm_population_main_dashboard.is_clm_registration": "CLM",
  "clm_population_main_dashboard.reg_flow_changes": "\"pure_clm\"",
  "clm_population_main_dashboard.ah_creation_date_date": "51 days ago for 30 days",
  "clm_population_main_dashboard.country_group": "-Not in Rollout",
  "clm_population_main_dashboard.is_bot": "0",
  "clm_population_main_dashboard.is_bot_expanded": "0",
  "clm_population_main_dashboard.is_arkose_bot": "0",
  "clm_population_main_dashboard.is_blocked": "0",
  "clm_population_main_dashboard.map_payments": "Include"
}
```

**Date logic**: Account approval can take up to 21 days. To ensure the cohort has had enough time to complete the full funnel, we use a 30-day window that ended 21 days ago. In Looker syntax: `51 days ago for 30 days`.

### Core Segmentation Filters

| # | Filter | Description | Default |
|---|--------|-------------|---------|
| 1 | `is_clm_registration` | Onboarding flow: CLM vs Four Step | `CLM` |
| 2 | `reg_flow_changes` | Onboarding flow at the top of the funnel. A customer can start in CLM but register via Four Step if their country wasn't supported in CLM | `"pure_clm"` |
| 3 | `registration_program_calc` | Registration channel: D2P vs Partner registration vs Sender (Payer). **CLM rollout % applies only to D2P traffic.** Partner traffic is binary — once a partner is enabled for CLM, 100% of that partner's traffic goes to CLM regardless of the country's D2P rollout %. When estimating rollout % from data, use `registration_program_calc = "Payoneer D2P"` for accurate D2P rollout, or be aware that partner traffic inflates the apparent rollout for countries with significant partner share | (empty = all) |
| 4 | `entity_type` | Individual or Company. Collected during signup | (empty = all) |
| 5 | `ah_type` | Individual, SP (Sole Proprietor), or non-SP Company. The SP vs non-SP distinction is made when the customer chooses organization type during account setup | (empty = all) |
| 6 | `country_name` | Registration country. For Individuals = residential country; for Companies = business incorporation country. Selected during signup | (empty = all) |
| 7 | `region` | Geographic region grouping of countries | (empty = all) |
| 8 | `country_business_tier` | Business importance of the country in terms of GTM, revenue, and business value | (empty = all) |
| 9 | `country_group` | Country group in the context of CLM rollout availability | `-Not in Rollout` |
| 10 | `ip_country_name` | IP-detected country when the customer started signup | (empty = all) |
| 11 | `business_region` | Region where the customer's business operates. Selected by the customer during account setup | (empty = all) |
| 12 | `device_category_type` | Platform used to complete signup: Desktop, Mobile Web, or Mobile App | (empty = all) |
| 13 | `cdd_edd_ind` | Due diligence level: CDD (standard) or EDD (enhanced, for risky customers) | (empty = all) |
| 14 | `is_blocked` | Customer was blocked during registration (bots, fraud, underage, existing account, etc.) | `0` |
| 15 | `map_payments` | Include/exclude customers using MAP (Make A Payment) service | `Include` |

### Date Filters

| # | Filter | Description | Default |
|---|--------|-------------|---------|
| 16 | `ah_creation_date_date` | When the account holder was created | `51 days ago for 30 days` |
| 17 | `ah_creation_date_week` | Calendar week of account creation (used as dimension, not filter) | — |
| 18 | `ah_creation_date_month` | Calendar month of account creation | `last month` |
| 19 | `entities_registration_date_date` | Entity registration date (usage unclear) | `60 days` |

### Bot / Fraud Filters

| # | Filter | Description | Default |
|---|--------|-------------|---------|
| 20 | `is_bot` | User identified as bot | `0` |
| 21 | `is_bot_expanded` | User identified as bot (expanded detection) | `0` |
| 22 | `is_arkose_bot` | User identified as bot by Arkose | `0` |

### Experiment Filters

All experiment filters segment the population by A/B test participation. Default is (empty = all) to include the full population regardless of experiment assignment.

| # | Filter | Default |
|---|--------|---------|
| 23 | `idv_experiment_group` | (empty = all) |
| 24 | `dynamic_content_experiment_group` | (empty = all) |
| 25 | `pricing_plan_experiment_group` | (empty = all) |
| 26 | `skip_por_experiment_group` | (empty = all) |
| 27 | `whatsapp_experiment_and_variation` | (empty = all) |
| 28 | `whatsapp_onex_experiment_group` | (empty = all) |
| 29 | `skip_poca_experiment_group` | (empty = all) |
| 30 | `persona_experiment_group` | (empty = all) |
| 31 | `gated_access_experiment_group` | (empty = all) |
| 32 | `gated_access_credit_card_experiment_group` | (empty = all) |

### Other Filters

| # | Filter | Description | Default |
|---|--------|-------------|---------|
| 33 | `dimension_selector` | Controls the dynamic dimension: `registration country` or `ip country` | `registration country` |
| 34 | `has_url` | Whether customer provided a URL during account setup (Info & Documents) | (empty = all) |
| 35 | `avg_monthly_payments_send_and_receive` | Expected monthly payment volume — collected during segmentation | (empty = all) |
| 36 | `utm_registration_source` | Final UTM source. **Attributed only after T&Cs** — customers who haven't signed T&Cs will appear as "Unknown Channel." This means filtering or segmenting by UTM source inherently excludes customers who dropped before T&Cs, and "Unknown Channel" approval rates will be near-zero by definition (not a traffic quality signal) | (empty = all) |
| 37 | `utm_registration_source_first` | First UTM source | (empty = all) |
| 38 | `is_managed` | Whether the customer is managed by a CSM (Customer Success Manager) | (empty = all) |
| 39 | `reg_program` | Registration program / Partner ID | (empty = all) |
| 40 | `partner_tier` | Partner tier — relevant for partner registrations | (empty = all) |
| 41 | `partner_name` | Name of the partner the customer registered from | (empty = all) |
| 42 | `lead_score` | Lead score — assigned after completing segmentation | (empty = all) |
| 43 | `Is_Payer_UTM` | Whether the customer started registration as a payer or receiver (chosen before entering CLM). **Payer CLM rollout is limited to 4 countries: Israel, Spain, Germany, and UK.** Payer rollout % is aligned with D2P receiver rollout % in those countries. In all other countries, payers go through Four Step. Use this filter to segment payers from receivers when analyzing these 4 countries | (empty = all) |
| 44 | `is_customized_clm` | Not relevant — ignore | (empty = all) |
| 45 | `Is_Master_Account` | Whether the customer is connected to a Master Account (a network of multiple AHs) | (empty = all) |
| 46 | `mfa_approved_ind` | Whether the customer's MFA was successful | `1` |
| 47 | `accounts_created_clm` | Minimum threshold for account count (used in dimension-based looks to filter low-volume slices) | (empty = all) |

---

## Key CLM Looks in Looker

| Look ID | Title | Purpose |
|---------|-------|---------|
| 7177 | CLM - Registration Funnel | Core funnel with all steps |
| 6797 | CLM Funnel by Selected Dimensions | Funnel broken by a dynamic dimension (country, etc.) |
| 8434 | CLM Funnel Metrics - Daily | Daily funnel with all steps |
| 8301 | CLM daily funnel | Daily funnel (alternative) |
| 9238 | CLM WoW Funnel Diff | Week-over-week funnel changes |
| 7800 | Account Setup - Companies | **Account Setup sub-funnel** for Companies (granular steps from segmentation through T&Cs) |
| 7801 | Account Setup - Individuals | **Account Setup sub-funnel** for Individuals (granular steps from segmentation through T&Cs) |
| 6828 | KYC Funnel - CLM | KYC-focused funnel (signup through approval) |
| 6830 | CLM - FDC Funnel | Documents-focused funnel |
| 8274 | CLM & 4step Unified Funnel | CLM vs Four Step side-by-side |
| 9411 | CLM Funnel Including Visitors | Full funnel starting from website visitors |
| 7805 | Funnel rates by device category | Funnel split by Desktop / Mobile Web / Mobile App |
| 6831 | Accounts Registrations by Flow in CLM Rollout Countries | CLM vs Four Step registration volume over time |
| 7424 | CLM Rollout by Country | Country-level rollout and approval metrics |
| 6866 | CLM Account Approval Rate | Approval rate tracking |
| 8295 | CLM vs 4step per country | Country-level CLM vs Four Step comparison |

---

## How to Query

### Pull the full CLM funnel (standard)

```python
from looker_client import _ssl_context, login, run_inline_query

ctx = _ssl_context()
token = login(ctx)

query = {
    "model": "product",
    "view": "clm_population_main_dashboard",
    "fields": [
        "clm_population_main_dashboard.accounts_created_clm",
        "clm_population_main_dashboard.mfa_sent",
        "clm_population_main_dashboard.mfa_approved",
        "clm_population_main_dashboard.clm_completed_signup",
        "clm_population_main_dashboard.clm_started_segmentation",
        "clm_population_main_dashboard.clm_finished_segmentation",
        "clm_population_main_dashboard.bank_account_details",
        "clm_population_main_dashboard.provided_information",
        "clm_population_main_dashboard.requests_created_step",
        "clm_population_main_dashboard.requests_submitted_step",
        "clm_population_main_dashboard.submitted_all_docs_step",
        "clm_population_main_dashboard.accounts_approved",
        "clm_population_main_dashboard.had_fft",
        "clm_population_main_dashboard.icp_500",
        "clm_population_main_dashboard.icp_10k"
    ],
    "filters": {
        "clm_population_main_dashboard.is_clm_registration": "CLM",
        "clm_population_main_dashboard.reg_flow_changes": "\"pure_clm\"",
        "clm_population_main_dashboard.ah_creation_date_date": "51 days ago for 30 days",
        "clm_population_main_dashboard.country_group": "-Not in Rollout",
        "clm_population_main_dashboard.is_bot": "0",
        "clm_population_main_dashboard.is_bot_expanded": "0",
        "clm_population_main_dashboard.is_arkose_bot": "0",
        "clm_population_main_dashboard.is_blocked": "0",
        "clm_population_main_dashboard.map_payments": "Include"
    },
    "sorts": [],
    "limit": "500"
}

data = run_inline_query(ctx, token, query)
```

### Break funnel by a dimension (e.g., country)

Add a dimension field and the data will be grouped:

```python
query["fields"].insert(0, "clm_population_main_dashboard.country_name")
```

### Break funnel by time (e.g., weekly)

```python
query["fields"].insert(0, "clm_population_main_dashboard.ah_creation_date_week")
```

### Filter for a specific country or entity type

Add or modify filters:

```python
query["filters"]["clm_population_main_dashboard.country_name"] = "United States,United Kingdom"
query["filters"]["clm_population_main_dashboard.entity_type"] = "Company"
```

### Reuse an existing Look's query (with custom filters)

```python
from looker_client import get_look

look = get_look(ctx, token, 7177)  # CLM - Registration Funnel
q = look["query"]
query = {
    "model": q["model"],
    "view": q["view"],
    "fields": q["fields"],
    "filters": dict(q.get("filters", {})),
    "sorts": q.get("sorts", []),
    "limit": q.get("limit", "500"),
}
# Override specific filters
query["filters"]["clm_population_main_dashboard.country_name"] = "Bangladesh"
data = run_inline_query(ctx, token, query)
```

---

## Notes

- **Empty filter values** `""` mean "all" — no restriction applied
- **Negative filters** use `-` prefix: `-Not in Rollout` means "exclude Not in Rollout"
- **Multiple values** are comma-separated: `"Desktop,Mobile Web"`
- **Date syntax**: Looker supports `30 days`, `last month`, `after 2025/01/01`, `before 21 days ago AND after 51 days ago`
- **Result formats**: `run_inline_query` supports `json` (default), `csv`, `xlsx`
- **map_payments**: Dashboard default is currently `Exclude` but the intended default is `Include` (pending implementation by Aviv)
