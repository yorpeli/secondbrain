---
summary: LATAM localization guide — Brazil, Mexico, Argentina, Colombia market conventions, financial term translations, regulatory bodies, currency/date formatting
topics: [localization, latam, compliance, countries, onboarding]
agents: [hub-countries-pm, kyc-product-pm, team-lead]
source: Adapted from Pablo Battro's payoneer-cursor-skills (2026-Q1)
---

# LATAM Localization Guide

> Market-specific conventions for Payoneer's Latin American markets.
> Covers language, tone, payment terms, regulatory bodies, and formatting rules.
> Relevant for hub-countries analysis, KYC rollouts, and any LATAM-facing content.

---

## Supported Markets

| Market | Language | Currency | Key Payment Methods |
|--------|----------|----------|-------------------|
| Brazil | pt-BR | BRL (R$) | PIX, Boleto Bancário, TED, DOC, cartão de crédito/débito |
| Mexico | es-MX | MXN ($) | SPEI, CLABE, tarjeta de crédito/débito, OXXO |
| Argentina | es-AR | ARS ($) | Transferencia bancaria, CBU/CVU, tarjeta, Mercado Pago |
| Colombia | es-CO | COP ($) | PSE, Nequi, Daviplata, transferencia bancaria |

## Currency Formatting

| Market | Format | Example | Note |
|--------|--------|---------|------|
| Brazil | R$ 1.234,56 | R$ 10.000,00 | Period = thousands, comma = decimal |
| Mexico | $1,234.56 MXN | $10,000.00 MXN | Comma = thousands, period = decimal |
| Argentina | $1.234,56 ARS | $10.000,00 ARS | Period = thousands, comma = decimal |
| Colombia | $1.234,56 COP | $10.000,00 COP | Period = thousands, comma = decimal |

Always include the currency code (BRL, MXN, ARS, COP) — bare "$" is ambiguous across LATAM.

## Date & Number Formatting

| Element | Brazil | Mexico | Argentina | Colombia |
|---------|--------|--------|-----------|----------|
| Date | DD/MM/YYYY | DD/MM/YYYY | DD/MM/YYYY | DD/MM/YYYY |
| Thousands sep | . (period) | , (comma) | . (period) | . (period) |
| Decimal sep | , (comma) | . (period) | , (comma) | , (comma) |
| Phone | +55 (XX) XXXXX-XXXX | +52 XX XXXX XXXX | +54 XX XXXX-XXXX | +57 XXX XXX XXXX |

## Tone & Formality by Market

| Market | Register | Address | Notes |
|--------|----------|---------|-------|
| Brazil | Semi-formal, warm | "você" (not "tu") | Professional but approachable. Avoid overly corporate tone |
| Mexico | Formal, respectful | "usted" (business), "tú" (marketing) | Polite and clear |
| Argentina | Semi-formal, direct | "vos" (standard, not "tú") | Can be slightly more casual than Mexico |
| Colombia | Formal, polite | "usted" (standard) | Warm but respectful |

## Regulatory & Compliance References

### Brazil
- **Central bank:** Banco Central do Brasil (BCB)
- **Financial regulator:** CVM (securities), SUSEP (insurance)
- **AML/KYC:** "prevenção à lavagem de dinheiro" / "conheça seu cliente"
- **Data privacy:** LGPD (Lei Geral de Proteção de Dados) — Brazil's GDPR equivalent. Must reference when collecting personal data from Brazilian users.

### Mexico
- **Central bank:** Banco de México (Banxico)
- **Financial regulator:** CNBV
- **Fintech law:** Ley Fintech — reference when relevant
- **AML/KYC:** "prevención de lavado de dinero" / "conoce a tu cliente"

### Argentina
- CBU/CVU for bank transfers (not CLABE)
- Mercado Pago is the dominant payment ecosystem
- Multiple exchange rates (official, blue, MEP, CCL) — always clarify which rate applies

### Colombia
- PSE (Pagos Seguros en Línea) for online bank transfers
- Nequi and Daviplata for mobile wallets
- RUT (Registro Único Tributario) is the tax ID

## Financial Term Translations

**Key rule: Never machine-translate financial terms.** Use the locally accepted equivalents below.

### Brazil (pt-BR)

| English | Correct pt-BR | Wrong/Literal |
|---------|--------------|---------------|
| Bank transfer | Transferência bancária / TED | Transferência de banco |
| Invoice / Payment slip | Boleto bancário | Fatura (unless credit card) |
| Instant transfer | PIX | Pagamento instantâneo |
| Checking account | Conta corrente | Conta de verificação |
| Savings account | Conta poupança | Conta de economias |
| Wire transfer | Transferência internacional | Fio de transferência |
| Exchange rate | Taxa de câmbio | Taxa de troca |
| Recipient | Beneficiário | Recipiente |
| Payout | Saque / Recebimento | Pagamento para fora |
| Fee | Taxa | Tarifa (ok in some contexts) |
| Onboarding | Cadastro | Integração |

### Mexico / Spanish LATAM (es-MX)

| English | Correct es-MX | Wrong/Literal |
|---------|--------------|---------------|
| Bank transfer | Transferencia bancaria / SPEI | Transferencia de banco |
| Bank account number | CLABE | Número de cuenta (too generic) |
| Wire transfer | Transferencia internacional | Alambre de transferencia |
| Exchange rate | Tipo de cambio | Tasa de cambio (ok elsewhere) |
| Recipient | Beneficiario | Recipiente |
| Payout | Retiro / Cobro | Pago hacia afuera |
| Fee | Comisión | Tarifa (ok in some contexts) |
| Onboarding | Registro / Alta | Incorporación |

## Content Templates

### Landing Page Hero — Brazil
```
Headline: Receba pagamentos do exterior de forma simples e rápida
Subheadline: Mais de [X] empresas no Brasil já usam a Payoneer para receber de clientes globais.
CTA: Crie sua conta grátis
```

### Landing Page Hero — Mexico
```
Headline: Recibe pagos internacionales de manera simple y rápida
Subheadline: Más de [X] empresas en México ya usan Payoneer para cobrar de clientes globales.
CTA: Crea tu cuenta gratis
```

## Pre-Publish Checklist

- [ ] Financial terms use local equivalents (not literal translations)
- [ ] Currency formatted correctly for the target market
- [ ] Dates in DD/MM/YYYY format
- [ ] Tone matches market register (você / usted / vos)
- [ ] Regulatory references use correct local institution names
- [ ] Phone numbers in local format
- [ ] Payment method names are locally accurate (PIX, SPEI, Boleto, etc.)
- [ ] LGPD notice included if collecting data from Brazilian users
- [ ] Content is fully in one language (no Spanglish / Portunhol)
