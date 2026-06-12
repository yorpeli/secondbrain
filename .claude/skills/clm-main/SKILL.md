---
name: clm-main
description: Query CLM registration and onboarding data. Use whenever the user asks about CLM registrations, approval rates, funnel conversion, onboarding metrics, cohort analysis, country breakdowns, account holder types, payer identification, document submission rates, FFT, time to approval, or any CLM-related analysis. This is the primary data skill for CLM questions.
---

# CLM Data Queries

> **Provenance:** This is the CLM analytics team's semantic-layer contract for the `clm_main` explore (received 2026-06-11, source: Looker `payoneer.cloud.looker.com/explore/product/clm_main`). Everything up to and including "Field Reference" is kept verbatim — when the team ships a new version, diff and replace those sections wholesale. Repo-specific guidance lives in the final section, **"Querying from this repo (agents & scripts)"**.

## Data Source

Model: `product`
Explore: `clm_main`

## Required Filters

**Always** apply these default filters:

```json
{
  "clm_main.Is_CLM_Registration": "Yes",
  "clm_main.is_bot": "No"
}
```

Additionally, the population logic **must always** be:

> **(account_approval_ind = "Yes") OR (account_approval_ind = "No" AND is_blocked = "No" AND is_closed_by_risk_ind = "No")**

This means: include ALL approved accounts (regardless of block/risk status), plus non-approved accounts that are NOT blocked and NOT closed by risk. There is no other way to apply these filters — this logic is always enforced.

### Implementation in Looker

Use `filter_expression` to express the OR logic in a single query. Always include this filter expression alongside the standard field-level filters:

```
${clm_main.account_approval_ind} = yes OR (${clm_main.is_blocked} = no AND ${clm_main.is_closed_by_risk_ind} = no)
```

This ensures approved accounts are never excluded by blocked/risk filters, while non-approved accounts that are blocked or closed by risk are removed from the population.

**Never** apply `is_blocked` and `is_closed_by_risk_ind` as flat field-level filters — doing so incorrectly excludes approved accounts that were later blocked.

**After applying filters, always inform the user** what default filters were applied (CLM only, no bots, blocked/closed-by-risk excluded for non-approved). Let them know they can ask to filter differently if needed.

## ah_creation_date Dimension

- Whenever asked to query about a certain timeframe, use `ah_creation_date` by default (e.g. `clm_main.ah_creation_date_date`, `ah_creation_date_week`, `ah_creation_date_month`). Tell the user this so they can ask for something else if needed. Never decide to use another field on your own without the user's input.
- **If the user does not specify a timeframe, do not guess** — ask them which time period they want to look at.

## Approval Rate Maturity

- Monthly approval rate typically takes **4–6 weeks** to mature. We usually only report on months where at least 6 weeks have passed since the end of that month.
- If the user asks for approval rate of a month that is not yet mature (i.e., less than 6 weeks since the end of that month), **notify the user** that the rate may not be final and could still increase as more accounts get approved.

## Predefined Rate Measures

The explore has predefined rate measures. **Always use these instead of calculating rates manually.** If the user asks to calculate a rate in a different way, inform them that a predefined field and definition already exists and confirm whether they still want a custom calculation.

- **Approval rate**: use `clm_main.approval_rate`
- **Full document submission rate**: use `clm_main.full_document_submission_rate`
- **FFT rate**: there are two options:
  - `clm_main.fft_rate_from_approval` — FFT rate relative to approved accounts
  - `clm_main.fft_rate_from_registration` — FFT rate relative to all registered accounts
  - If the user does not explicitly specify which one, **do not guess** — ask them which FFT rate they want.

**Never** attempt to calculate these rates manually by dividing other fields. Always use the predefined measures above.

## Time-to Metrics

The explore has precalculated fields for time-based analysis:

- **Days from registration to approval**: `clm_main.total_days_registration_to_approval` (sum measure; divide by approved count for average)
- **Days from registration to FFT**: `clm_main.total_days_registration_to_fft` (sum measure)
- **Days from approval to FFT**: `clm_main.total_days_approval_to_fft` (sum measure)
- **Weeks from registration to approval**: `clm_main.weeks_from_registration_to_approval` (dimension, for bucketing)
- **Weeks from registration to FFT**: `clm_main.weeks_from_registration_to_fft` (dimension)
- **Weeks from approval to FFT**: `clm_main.weeks_from_approval_to_fft` (dimension)

When asked about time-to metrics in days, **always provide both average and median**:
- **Average**: use the `total_days_*` sum measure divided by the relevant account count.
- **Median**: pull entity-level data using the `total_days_*` fields (query at entity granularity), then compute the median locally from the resulting distribution.

When asked about "time to FFT", there are two interpretations (from registration or from approval). If not explicitly stated by the user, **do not guess** — ask which one they mean.

## kyc_flow Dimension

Use `clm_main.kyc_flow` to identify registration types:

- **Payer registrations**: `kyc_flow` = `"Payer"`
- **D2P registrations**: `kyc_flow` = `"D2P"`
- **Partner registrations**: all partner-related flows. When asked about partners in general (not a specific partner flow), include all of:
  - `"Partner to Account"`
  - `"Partner to Card"`
  - `"Partner to GBT"`
  - `"Partner to Account, no bank details collected"`

## Business Definitions

- **Country**: By default use `chosen_country_name`. Tell the user this and ask if they want `ip_country_name` instead. Never decide to use `ip_country_name` or any other field on your own without the user's input.
- **Top countries**: chosen_country_name as one of: United States of America, United Kingdom, United Arab Emirates, Singapore, Brazil.
- **Other tier 1 and 2 countries**: All countries where `chosen_country_business_tier` is `"1"` or `"2"`, excluding the top countries listed above.
- **CLM funnel** — see the dedicated Funnel section below for full details.
- Country and company account_holder_type are only populated after quick signup. Filtering by `chosen_country_name` or `account_holder_type` = `"company"` implies `completed_signup_clm_ind` = "Yes".
- Sole proprietor account_holder_type is only populated after segmentation. Filtering by `account_holder_type` = `"Sole proprietor"` implies `completed_segmentation_ind` = "Yes".

## CLM Funnel

### High-Level Steps (all registrations)

1. **Quick Signup** — `completed_signup_clm_ind` = "Yes"
   - Sub-steps: Account Created → MFA Sent → MFA Approved → Completed Quick Signup
2. **Segmentation** — `completed_segmentation_ind` = "Yes"
3. **Account Setup — About Your Business** — `completed_about_your_business_section_ind` = "Yes"
4. **Account Setup — About You** — `completed_about_you_section_ind` = "Yes"
5. **Account Setup — Bank Details** — `account_setup_bank_info_ind` = "Yes" (or `account_setup_card_details_ind` for Partner to Card; skipped for Partner to Account with no bank collection)
6. **Account Setup — Confirm T&Cs** — `account_setup_confirm_tcs_ind` = "Yes"
7. **Approval** — `account_approval_ind` = "Yes"
8. **FFT** — `fft_ind` = "Yes"

### Non-China/HK: Account Setup Sub-Steps

The sub-steps within "About Your Business" and "About You" vary by account type:

#### Individual

**About Your Business:**
1. Segmentation → Website (`account_setup_website_ind`)
2. Website → Business Activity Regions (`account_setup_business_regions_ind`)

**About You:**
1. Business Activity Regions → Personal Details (`account_setup_personal_details_ind`)
2. Personal Details → Personal Address (`account_setup_personal_address_ind`)
3. Personal Address → Personal ID (`account_setup_personal_id_ind`) — only if NOT in IDV test

**Bank Details:**
- Standard: → Bank Info (`account_setup_bank_info_ind`)
- Partner to Card: → Card Details (`account_setup_card_details_ind`)
- Partner to Account (no bank collection): step is skipped, goes directly to T&Cs

#### Company / Sole Proprietor + eCollection

**About Your Business:**
1. Segmentation → Business ID (`account_setup_business_id_ind`)
2. Business ID → Business Details (`account_setup_company_business_info_ind`)
3. Business Details → Registered Address (`account_setup_business_registered_address_ind`)
4. Registered Address → Website (`account_setup_website_ind`)
5. Website → Business Activity Regions (`account_setup_business_regions_ind`)

**About You:**
1. Business Activity Regions → Auth Rep Details (`account_setup_auth_rep_details_ind`)
2. Auth Rep Details → Auth Rep Address (`account_setup_auth_rep_address_ind`)
3. Auth Rep Address → Auth Rep ID (`account_setup_auth_rep_id_ind`) — only if NOT in IDV test

**Bank Details:** same variants as Individual (Bank Info / Card Details / skipped)

#### Company / Sole Proprietor, no eCollection

**About Your Business:**
1. Segmentation → Business Details (`account_setup_company_business_info_ind`)
2. Business Details → Website (`account_setup_website_ind`)
3. Website → Business Activity Regions (`account_setup_business_regions_ind`)
4. Business Activity Regions → Registered Address (`account_setup_business_registered_address_ind`)
5. Registered Address → Business ID (`account_setup_business_id_ind`)

**About You:**
1. Business ID → Auth Rep Details (`account_setup_auth_rep_details_ind`)
2. Auth Rep Details → Auth Rep Address (`account_setup_auth_rep_address_ind`)
3. Auth Rep Address → Auth Rep ID (`account_setup_auth_rep_id_ind`) — only if NOT in IDV test

**Bank Details:** same variants as Individual (Bank Info / Card Details / skipped)

### China/HK: Individual

1. Quick Signup → Segmentation (`account_setup_segmentation_ind`)
2. Segmentation → Website (`account_setup_website_ind`)
3. Website → ID Info (`account_setup_id_info_ind`)
4. ID Info → Bank Info (`account_setup_bank_info_ind`)
5. Bank Info → T&Cs (`account_setup_confirm_tcs_ind`)

### China/HK: Company / Sole Proprietor

1. Quick Signup → Registration Details (`account_setup_registration_details_ind`)
2. Registration Details → Segmentation (`account_setup_segmentation_ind`)
3. Segmentation → Website (`account_setup_website_ind`)
4. Website → Key Personnel (`account_setup_key_personnel_ind`)
5. Key Personnel → Bank Account Holder (`account_setup_bank_account_holder_ind`)
6. Bank Account Holder → Bank Info (`account_setup_bank_info_ind`)
7. Bank Info → T&Cs (`account_setup_confirm_tcs_ind`)

### Funnel CVR Calculations

When asked about funnel conversion rates (CVRs):
- Calculate the rate between consecutive steps as: (count completing step N+1) / (count completing step N).
- Use the relevant `_ind` fields filtered to "Yes" for each step's population.
- Be aware of which account type and conditions apply when breaking down sub-steps.
- **If the user does not explicitly specify which step-to-step conversion they want, do not guess** — ask them which CVR they are interested in (e.g., which two steps, which account type, which flow).

## Cohort View

- When asked about a cohort view, by default look at data based on weekly cohorts (by registration date) and time to approval since registration (use `account_approval_datetime` and `ah_creation_date` dimensions).
- The `weeks_from_registration_to_approval` dimension is available for bucketing.
- Group into buckets: 0 weeks (approvals under 7 days), 1 week (7-13 days), 2 weeks (14-20 days), and so on. After week 6, group as 6+.
- Look at the cumulative approval rate for each cohort by those buckets.
- Always filter out cohorts that did not mature yet — those that do not have 13 days since the cohort started.
- Always filter out cells of buckets that did not mature yet.

## Experiment Indicators

- **eCollection**: use `clm_main.is_in_brn_test` (yesno). "Yes" = account is in the eCollection flow; "No" = not in eCollection.
- **IDV (Identity Verification)**: use `clm_main.is_in_idv_test` (yesno). "Yes" = account is in the IDV test (Personal ID / Auth Rep ID step is skipped); "No" = not in IDV (those steps are required). Note: this field comes from the `view_dim_experimental_population` join and may cause correlated subquery errors in BigQuery when combined with count_distinct measures like `accounts_created`. If this happens, inform the user about the limitation.

## Terminology

- **Accounts, customers, users, AHs, account holders, cardholders** — all refer to the same thing: the entity level (account holder) in our model. These terms are interchangeable.

## Important Rules

- **4STEP registrations** — the default filter is CLM only (`Is_CLM_Registration` = "Yes"). If a user wants to see 4STEP registrations, they must explicitly ask for it. When they do, inform them that you are overriding the default CLM filter to include 4STEP data (`Is_CLM_Registration` = "No").
- **Never use `registration_program_calc`** — use `kyc_flow` instead, which is more comprehensive and replaces it for all registration type classification purposes.
- **`is_blocked_during_clm`** — this field is only relevant for customers who are blocked (not for bots or closed-by-risk). By default, if asked about blocked accounts, use the standard population filtering logic (the required filters above). That logic already captures who was blocked during CLM: bots are always blocked during CLM, and blocked + closed-by-risk accounts are blocked during CLM if the account is not approved.
- **Always use `clm_main.*` fields** — never use fields from `view_clm_snapshot_registration_daily` on your own. If you interpret the user's request as requiring the snapshot view, inform them that it requires a different data source which reflects a historical snapshot and not the current state of the account holder. Let the user decide.
- **MFA sent** — always use `mfa_sent_ind` (which combines SMS, WhatsApp, and voicecall). Only use the individual MFA type indicators (`is_sms_mfa`, `is_whatsapp_mfa`, `is_voicecall_mfa`) when the user explicitly asks for a breakdown by MFA channel.

## Field Reference

### Dimensions

| Field | Type | Description |
|-------|------|-------------|
| `weeks_from_registration_to_approval` | number | The number of weeks between account holder registration and approval |
| `weeks_from_registration_to_fft` | number | The number of weeks between account holder registration and FFT |
| `weeks_from_approval_to_fft` | number | The number of weeks between account holder approval and FFT |
| `ah_creation_date` | date | Creation date of the AH — in CLM, this is after the email verification; in 4STEP this is after completing step 1 |
| `account_approval_datetime` | date | The timestamp of when the account was approved |
| `account_holder_type` | string | The type of account: Company, Individual or Sole Proprietor |
| `affiliate_id` | number | The affiliate ID associated with the registration |
| `all_but_one_requirement_resolved_ind` | yesno | Indicates whether the account holder has all requirements resolved except one |
| `segmentation_avg_monthly_payments` | string | Segmentation Question #4 (avg number of payments) |
| `segmentation_avg_monthly_volume` | string | Segmentation Question #5 (avg volume) — when answered question 4 with more than 0 payments, what volume they selected |
| `block_reason_desc` | string | The reason an account holder was blocked |
| `browser_type` | string | The browser that the user started registration from |
| `closed_by_risk_reason_desc` | string | Indicates the account holder reason of closing by risk |
| `company_url` | string | The company URL provided by the account holder |
| `completed_about_you_section_ind` | yesno | Indicates whether the AH completed the 'About You' section of account setup. Completion step depends on account type and IDV experiment participation |
| `completed_about_you_section_date` | date | The date when the AH completed the 'About You' section |
| `completed_about_your_business_section_ind` | yesno | Indicates whether the AH completed the 'About Your Business' section of account setup. Completion step depends on account type and BRN/eCollection experiment |
| `completed_about_your_business_section_date` | date | The date when the AH completed the 'About Your Business' section |
| `completed_signup_clm_ind` | yesno | Indicates whether the AH completed the quick signup part of CLM registration |
| `completed_signup_clm_datetime` | date | Timestamp of when the AH completed the quick signup part of CLM registration |
| `completed_segmentation_ind` | yesno | Indicates whether the AH completed the segmentation step |
| `completed_segmentation_datetime` | date_time | Timestamp of when the AH completed the segmentation step |
| `completed_step2_4_step_ind` | yesno | Indicates whether the AH completed step 2 in the 4STEP flow (action 74) |
| `completed_step3_4_step_ind` | yesno | Indicates whether the AH completed step 3 in the 4STEP flow (action 75) |
| `completed_step4_4_step_ind` | yesno | Indicates whether the AH completed step 4 in the 4STEP flow (action 13) |
| `account_setup_confirm_tcs_ind` | yesno | Indicates whether the AH confirmed the terms and conditions in account setup |
| `account_setup_confirm_tcs_datetime` | date_time | Timestamp of when the AH confirmed the terms and conditions in account setup |
| `dd_type` | string | The type of due diligence set for the account holder |
| `device_category_type` | string | The category of device that the user started registration from |
| `device_type` | string | The type of device that the user started registration from |
| `entity_id` | number | Account holder identifier |
| `fft_datetime` | date | The timestamp of when the AH made their FFT |
| `account_setup_company_business_info_ind` | yesno | Indicates whether the AH provided business information in account setup (companies only) |
| `account_setup_company_business_info_datetime` | date_time | Timestamp of when the AH provided business information in account setup (companies only) |
| `account_setup_business_registered_address_ind` | yesno | Indicates whether the AH provided a business registered address in account setup (companies only) |
| `account_setup_business_registered_address_datetime` | date_time | Timestamp of when the AH provided a business registered address in account setup (companies only) |
| `account_setup_personal_address_ind` | yesno | Indicates whether the AH provided a personal address in account setup (individuals only) |
| `account_setup_personal_address_datetime` | date_time | Timestamp of when the AH provided a personal address in account setup (individuals only) |
| `account_setup_personal_details_ind` | yesno | Indicates whether the AH provided personal details in account setup (individuals only) |
| `account_setup_personal_details_datetime` | date_time | Timestamp of when the AH provided personal details in account setup (individuals only) |
| `first_blocking_date` | date_time | The date when an account holder was first blocked |
| `first_doc_submission_datetime` | date_time | Timestamp of the first document submission |
| `first_initiate_payment_datetime` | date_time | The first time the AH initiated a payment |
| `one_requirement_resolved_ind` | yesno | Indicates whether the AH has at least one requirement resolved |
| `has_4_step_hist` | yesno | Indicates whether the AH has 4STEP registration history |
| `has_clm_hist` | yesno | Indicates whether the AH has CLM registration history |
| `confirmed_tcs_and_all_docs_submitted_ind` | yesno | Indicates whether the AH confirmed T&Cs and submitted all documents |
| `user_30d_fft_ind` | yesno | Indicates whether the AH made FFT within 30 days |
| `fft_ind` | yesno | Indicates whether the AH made any FFT |
| `any_docs_submission_ind` | yesno | Indicates whether the AH submitted any documents |
| `ip_country_code` | string | The country code based on IP address at registration |
| `ip_country_name` | string | The country name based on IP address at registration |
| `account_approval_ind` | yesno | Indicates whether the account was approved |
| `is_blocked` | yesno | Indicates whether the account holder is blocked |
| `is_blocked_during_clm` | yesno | Indicates whether the AH was blocked during the CLM flow |
| `is_bot` | yesno | Indicates whether the account holder is identified as a bot |
| `is_business_email` | yesno | Indicates whether the AH registered with a business email |
| `is_cdd` | yesno | Indicates whether the AH is under CDD (customer due diligence) |
| `Is_CLM_Registration` | yesno | Indicates whether the registration is a CLM registration |
| `is_closed_by_risk_ind` | yesno | Indicates whether the account was closed by the risk team |
| `is_customized_clm` | yesno | Indicates whether the AH went through a customized CLM flow |
| `is_edd` | yesno | Indicates whether the AH is under EDD (enhanced due diligence) |
| `icp_10k_30d_ind` | yesno | Indicates whether the AH reached ICP $10K within 30 days |
| `icp_10k_ind` | yesno | Indicates whether the AH reached ICP $10K |
| `icp_500_30d_ind` | yesno | Indicates whether the AH reached ICP $500 within 30 days |
| `icp_500_ind` | yesno | Indicates whether the AH reached ICP $500 |
| `is_in_brn_test` | yesno | Indicates whether the AH is in the BRN experiment |
| `is_in_idv_test` | yesno | Indicates whether the AH is in the IDV experiment |
| `is_initiate_payment` | yesno | Indicates whether the AH initiated a payment |
| `mfa_approved_ind` | yesno | Indicates whether the MFA was approved |
| `is_managed` | yesno | Indicates whether the AH is managed |
| `segmentation_is_money_source_b2b` | yesno | Segmentation Question #2 (source of funds) — whether selected B2B |
| `segmentation_is_money_source_b2c` | yesno | Segmentation Question #2 (source of funds) — whether selected B2C |
| `segmentation_is_money_source_marketplace` | yesno | Segmentation Question #2 (source of funds) — whether selected Marketplace |
| `is_opa_registered_payer` | yesno | Indicates whether the AH is an OPA registered payer |
| `is_payer_utm` | yesno | Indicates whether the AH is a payer based on UTM source (chose payer only in the accounts page) |
| `is_reseller_registration` | yesno | Indicates whether the AH registered through a reseller affiliate |
| `is_sms_mfa` | yesno | Indicates whether an SMS MFA was sent |
| `is_voicecall_mfa` | yesno | Indicates whether a voice call MFA was sent |
| `is_whatsapp_mfa` | yesno | Indicates whether a WhatsApp MFA was sent |
| `kyc_flow` | string | The KYC flow by the type of registration |
| `last_blocking_date` | date_time | The date when an AH was blocked for the last time |
| `lead_score` | number | The actual lead score |
| `lead_score_group` | string | Lead score group by the score |
| `lead_source` | string | Lead score source |
| `mfa_approved_datetime` | date_time | Timestamp of when the MFA was approved |
| `mfa_sent_ind` | yesno | Indicates whether any MFA was sent from any channel (SMS, WhatsApp, or voicecall) |
| `mfa_sent_datetime` | date_time | The first timestamp when an MFA was sent (SMS, WhatsApp, or voicecall) |
| `master_account_holder_id` | string | Master account holder identifier |
| `segmentation_money_source_marketplaces_selected` | string | Segmentation Question #3 (marketplaces) — when chose marketplace in question 2, this is the list of marketplaces selected |
| `partner_name` | string | According to the registration program |
| `partner_tier` | string | For partner registrations, this is the partner tier |
| `preferred_language_name` | string | The preferred language of the account holder |
| `profile_status` | string | Indication on the profile status when requirements are opened for the account |
| `account_setup_auth_rep_address_ind` | yesno | Indicates whether the AH provided an authorized representative address (companies only) |
| `account_setup_auth_rep_address_datetime` | date_time | Timestamp of when the AH provided an authorized representative address (companies only) |
| `account_setup_auth_rep_details_ind` | yesno | Indicates whether the AH provided authorized representative details (companies only) |
| `account_setup_auth_rep_details_datetime` | date_time | Timestamp of when the AH provided authorized representative details (companies only) |
| `account_setup_auth_rep_id_ind` | yesno | Indicates whether the AH provided an authorized representative ID (companies only) |
| `account_setup_auth_rep_id_datetime` | date_time | Timestamp of when the AH provided an authorized representative ID (companies only) |
| `account_setup_bank_info_ind` | yesno | Indicates whether the AH provided bank information in account setup |
| `account_setup_bank_info_datetime` | date_time | Timestamp of when the AH provided bank information in account setup |
| `account_setup_bank_account_holder_ind` | yesno | China/HK: indicates whether the AH provided bank account holder details |
| `account_setup_bank_account_holder_datetime` | date_time | China/HK: timestamp of when the AH provided bank account holder details |
| `account_setup_business_id_ind` | yesno | Indicates whether the AH provided a business ID (companies only) |
| `account_setup_business_id_datetime` | date_time | Timestamp of when the AH provided a business ID (companies only) |
| `account_setup_card_details_ind` | yesno | Indicates whether the AH provided card shipping address in account setup |
| `account_setup_card_details_datetime` | date_time | Timestamp of when the AH provided card shipping address in account setup |
| `account_setup_id_info_ind` | yesno | China/HK: indicates whether the AH provided ID information |
| `account_setup_id_info_datetime` | date_time | China/HK: timestamp of when the AH provided ID information |
| `account_setup_key_personnel_ind` | yesno | China/HK: indicates whether the AH provided key personnel details |
| `account_setup_key_personnel_datetime` | date_time | China/HK: timestamp of when the AH provided key personnel details |
| `account_setup_provided_website_ind` | yesno | Indicates whether the AH provided a website in the website step |
| `account_setup_personal_id_ind` | yesno | Indicates whether the AH provided a personal ID (individuals only) |
| `account_setup_personal_id_datetime` | date_time | Timestamp of when the AH provided a personal ID (individuals only) |
| `account_setup_registration_details_ind` | yesno | China/HK: indicates whether the AH provided registration details |
| `account_setup_registration_details_datetime` | date_time | China/HK: timestamp of when the AH provided registration details |
| `account_setup_segmentation_ind` | yesno | China/HK: indicates whether the AH completed segmentation in the CN/HK flow |
| `account_setup_segmentation_datetime` | date_time | China/HK: timestamp of when the AH completed segmentation in the CN/HK flow |
| `chosen_country_business_tier` | string | The business tier of the country explicitly selected by the user during the flow |
| `chosen_country_code` | string | Country code explicitly selected by the user during the flow |
| `chosen_country_name` | string | The name of the country explicitly selected by the user during the flow |
| `chosen_country_region` | string | The region of the country explicitly selected by the user during the flow |
| `registration_client_id` | number | The program ID that the AH is registered from |
| `registration_program_calc` | string | The program type that the AH is registered from |
| `reopen_iterations` | number | The amount of times an AH was in 're-open' state |
| `segmentation_industry` | string | Segmentation Question #1 (industry) |
| `account_setup_business_regions_ind` | yesno | Indicates whether the AH provided business regions in account setup |
| `account_setup_business_regions_datetime` | date_time | Timestamp of when the AH provided business regions in account setup |
| `started_segmentation_ind` | yesno | Indicates whether the AH started the segmentation part of CLM registration |
| `started_segmentation_datetime` | date_time | Timestamp of when the AH started segmentation |
| `all_docs_submission_ind` | yesno | Indicates whether the AH submitted all required documents |
| `all_doc_submission_datetime` | date_time | Timestamp of when the AH submitted all required documents |
| `all_but_one_doc_submitted_ind` | yesno | Indicates whether the AH submitted all required documents except one |
| `dynamic_dimension` | string | Dynamic dimension for flexible grouping |
| `utm_registration_source` | string | UTM registration source parameter captured during registration |
| `account_setup_website_ind` | yesno | Indicates whether the AH passed the website step in account setup |
| `account_setup_website_datetime` | date_time | Timestamp of when the AH passed the website step in account setup |

### Measures

| Field | Type | Description |
|-------|------|-------------|
| `accounts_approved` | count_distinct | Distinct count of AHs who registered through CLM and were approved |
| `completed_quick_signup` | count_distinct | Distinct count of AHs who completed quick sign-up through CLM |
| `completed_segmentation` | count_distinct | Distinct count of AHs who completed segmentation through CLM |
| `accounts_created` | count_distinct | Distinct count of AHs created through CLM with a verified email |
| `submitted_all_docs` | count_distinct | Distinct count of AHs who registered through CLM and submitted all required documents |
| `fft_accounts` | count_distinct | Distinct count of AHs who registered through CLM and made their first financial transaction |
| `total_days_registration_to_approval` | sum | Total number of days between registration and approval across all AHs who completed both steps |
| `total_days_registration_to_fft` | sum | Total number of days between registration and FFT across all AHs who completed both steps |
| `total_days_approval_to_fft` | sum | Total number of days between approval and FFT across all AHs who completed both steps |
| `requirements_resolved` | sum | The number of compliance/KYC requests that were approved |
| `requirements_created` | sum | The number of compliance/KYC requests created for the account |
| `requirements_reopened` | sum | The number of compliance/KYC requests that were reopened |
| `requirements_submitted` | sum | The number of compliance/KYC requests submitted by the AH |
| `approval_rate` | number | The percentage of AHs approved out of all who completed registration in CLM |
| `fft_rate_from_approval` | number | The percentage of AHs who made FFT out of those approved in CLM |
| `fft_rate_from_registration` | number | The percentage of AHs who made FFT out of those who registered in CLM |
| `full_document_submission_rate` | number | The percentage of customers who submitted all required documents out of those who initiated registration in CLM |
| `revenue_usd_first_2_months` | sum | New revenue in USD generated in the first 2 months after approval |
| `revenue_usd_first_1_month` | sum | New revenue in USD generated in the first 1 month after approval |
| `total_lifetime_revenue_usd` | sum | Total lifetime revenue in USD generated by the AH |

## Querying from this repo (agents & scripts)

*This section is ours, not part of the team's contract.*

### Plumbing

- Use the existing Looker client: `analytics/lib/looker-client.ts` (`createAndRunQuery`). Same credentials as the old explore (`LOOKER_BASE_URL` / `LOOKER_CLIENT_ID` / `LOOKER_CLIENT_SECRET` in `.env`).
- Use `buildClmMainQuery()` from `analytics/lib/query-builder.ts` — it applies the required filters (`Is_CLM_Registration=Yes`, `is_bot=No`) and the mandatory population `filter_expression` automatically. Constants live in `analytics/config/constants.ts` (`CLM_MAIN_VIEW`, `CLM_MAIN_POPULATION_FILTER`).
- `filter_expression` is a top-level sibling of `filters` in the Looker query body — supported by `LookerQueryBody` in `analytics/lib/types.ts`.

### Autonomous-agent defaults

The contract above is written for human-in-the-loop chat ("do not guess — ask the user"). When running inside an agent/script with no user to ask, use these defaults and **state them in the output**:

| Contract says "ask" | Agent default |
|---|---|
| FFT rate variant | `fft_rate_from_approval` (activation of approved accounts). Use `fft_rate_from_registration` only when comparing against full registration volume. |
| Time-to-FFT interpretation | From **approval** (operational lens). |
| Timeframe missing | Mature window: `ah_creation_date_date = "14 weeks ago for 8 weeks" (fully mature under the 6-week rule)` for rates; trailing `8 weeks` for volume trends. |
| Country field | `chosen_country_name`. |
| Funnel CVR steps | The four key points: created → completed_signup → completed_segmentation → approval → FFT. |

Everything else in the contract (population filter expression, never hand-calculating rates, maturity warnings, `kyc_flow` over `registration_program_calc`, never flat-filtering `is_blocked`) applies unchanged to agents.

### Relationship to the old explore (`clm_population_main_dashboard`)

- `clm_main` is the **preferred source for all CLM-population analysis** (rates, funnel CVRs, time-to metrics, cohorts, experiments, revenue).
- The old explore remains required for: GLPS-adjusted 4Step comparison (`accounts_approved_glps` table calc, used by `scan-opportunities`/`compare`) and the rollout-status Look (7806). See `analytics/config/looks-registry.json`.
- Validation comparing the two explores on the same mature window: `scripts/validate-clm-main-explore.ts`.
