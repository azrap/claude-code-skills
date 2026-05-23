---
name: 10x-stock-analysis
description: Screen and analyze small-cap stocks for 10x potential using Finviz filters, financial analysis, and ethical screening
author: azra
version: 1.0.0
---

# 10x Stock Analysis

Screen and analyze small-cap stocks for 10x potential.

## Usage
/10x-stock-analysis

## PART 1: ENTRY SCREEN

### OpenClaw Prompt — Copy and paste this to run the Finviz screen

```
Go to Finviz.com and run a stock screen with these exact filters:

- Market cap: $300M to $5B
- Revenue growth quarter over quarter: over 25%
- Gross margin: over 50%
- Net profit margin: positive (over 0%)
- EPS (ttm): positive
- Country: USA

Return the full list of tickers and company names that pass all filters.
```

Any stock not passing all six filters does not proceed to analysis.

**Why profitability is required:** Unprofitable companies depend on capital markets to survive. A bad market can kill them before the thesis plays out. Buy-and-hold requires companies that fund themselves from earnings, not dilution. No exceptions — if a company is losing money on a GAAP basis, it fails the screen.

---

## PART 2: ANALYSIS FRAMEWORK

Run this on every stock that passes the entry screen.

For each stock use web search. Never rely on memory for financial figures.

---

### 1. What the company does
One plain English paragraph. No jargon. If you can't explain it simply, flag that as a risk.

---

### 2. Stock performance history
Search: "[TICKER] stock price history IPO performance"

- Where did it IPO or where was it 3-5 years ago vs today?
- Direction of travel — up, down, recovering?
- Any major crashes and why?

---

### 3. Revenue growth rate
Search: "[TICKER] revenue growth 2023 2024 2025"

- Revenue growth rate last 2-3 years
- Is it accelerating or decelerating?

---

### 4. Gross margins and profitability
Search: "[TICKER] gross margin profitability GAAP net income stock based compensation"

- Gross margin % — is it expanding or contracting?
- **GAAP net income — must be positive. If negative, FAIL the stock and move to NO.**
- Stock-based compensation as % of revenue — is "non-GAAP profitability" masking real losses via dilution?
- Free cash flow — is it real cash or accounting profit?
- EPS trajectory — improving or worsening?
- Operating margin — expanding or contracting with scale?

**Critical rule:** Non-GAAP profitability alone does not count. If SBC is greater than GAAP net income, the company is essentially funding itself through shareholder dilution. Mark as unprofitable and FAIL.

---

### 5. Market cap and 10x math
- Current market cap
- What market cap would it need to reach for 10x from today?
- Is that mathematically plausible given the TAM?

---

### 6. TAM and penetration
Search: "[TICKER] total addressable market penetration"

- How big is the actual addressable market?
- What % have they penetrated so far?
- Is the TAM expanding or contracting?

---

### 7. Moat
- Why can't someone just copy this?
- Patents, switching costs, network effects, regulatory clearances, first mover advantage?
- How durable is the moat?

---

### 8. Key risks
- What are the 3-5 biggest things that could kill the thesis?
- Any existential risks (single customer concentration, litigation, regulatory)?

---

### 9. Analyst consensus and price targets
Search: "[TICKER] analyst consensus price target 2026"

- Buy / Hold / Sell consensus
- Average price target and implied upside
- How many analysts cover it?

---

### 10. Ethical filter
Does this company profit from human capability or human weakness?

Ask: Does this company need people to be less than their best to make money?

- No chronic dependency business models
- No attention exploitation
- No consumerism enablement
- No weapons, gambling, or addiction

Score: PASS or FAIL
If FAIL — stock goes to NO section. No further analysis.

---

### 11. Verdict
Would you personally buy this stock at current prices?
YES or NO — one sentence reason.

---

## PART 3: OUTPUT FORMAT

Structure the output in two sections — NO first, YES second.

---

### NO SECTION

List every stock that failed the ethical filter or where verdict is NO.

Format:
```
[TICKER] — NO
Reason: [Three sentences max explaining why it was dropped —
failed ethical filter, TAM too small, stock history too bad,
10x math doesn't work, etc.]
```

---

### YES SECTION

For every stock where verdict is YES, provide the full analysis from sections 1-11 plus:

**Confidence on 10x:** [X]%
One sentence explaining the confidence level.

**Confidence on 5x:** [X]%
One sentence explaining the confidence level.

**Bull case:**
What has to go right for this to 10x. Key assumptions and catalysts.

**Bear case:**
What kills the thesis. Specific risks and how they play out.

**Key dates:**
Specific dates or events that would cause the stock to significantly pop or drop.
Format: [Date/Event] — [Pop or Drop] — [Why]

---

## REFERENCE: CBLL Example Output

### NO SECTION

```
ALKT — NO
Alkami makes digital banking software for community banks and credit unions.
The customer base is structurally shrinking — there were 14,000 community banks
in 2000, under 5,000 today, and consolidation continues. Stock is down 67%
from its 2021 IPO price and has never recovered despite decent revenue growth.
```

### YES SECTION

**CBLL — CeriBell**

1. **What it does:** Disposable AI-powered EEG headband that detects seizures, delirium and strokes in ICU patients. A nurse applies it in 5 minutes. The AI algorithm analyzes brain waves every 10 seconds and alerts clinicians in real time. Before Ceribell this required a specialist, complex equipment, and hours of waiting. The hardware recorder is reusable; the headband is a disposable that generates recurring revenue every use.

2. **Stock performance:** IPO'd October 2024 at $17, ran to $26, now trading around $16. Down 38% from peak. Direction of travel is volatile but business fundamentals have been consistently improving.

3. **Revenue growth:** $89M full year 2025, up 36% year over year. Guiding $111-115M for 2026 (25-29% growth). Consistent beats and raises since IPO.

4. **Gross margins and profitability:** 88% gross margins — exceptional for medtech. Still losing money — net loss projected ~$56M in 2026. Cash of $159M provides adequate runway. Losses narrowing year over year.

5. **10x math:** Current market cap $697M. 10x = $7B. Achievable if they reach $500M+ revenue at current margin profile and growth rate. Plausible over 10 years.

6. **TAM and penetration:** Core seizure detection TAM $2B. Expanded to $3.5B with delirium and pediatric clearances. Stroke indication could add significantly more. Currently in 11% of US hospitals, serving 3% of addressable patients. Extremely early.

7. **Moat:** Six FDA clearances competitors can't easily replicate. Proprietary AI algorithm trained on massive EEG dataset. Hospital relationships and clinical protocols built around Ceribell. Disposable headband creates recurring revenue lock-in. Patent litigation against Natus (copycat product) to protect IP.

8. **Key risks:** ITC patent decision September 25-26 2026 — if lost, moat narrative breaks. Hospital sales cycles are slow — penetration from 11% to meaningful share takes years. Losses continue through at least 2028. Large competitors (Medtronic, GE, Philips) could enter with superior resources. Insider selling by CFO in December 2025.

9. **Analyst consensus:** Strong Buy consensus from 7 analysts. Average price target $23-33 depending on source. 46-176% implied upside from current price.

10. **Ethical filter:** PASS. AI genuinely saving lives — catches seizures in sedated ICU patients that would otherwise go undetected for hours. No dependency, no chronic management, no exploitation. Company profits when patients get better faster.

11. **Verdict:** YES.

---

**Confidence on 10x:** 35-40%
The business quality is exceptional but hospital adoption is slow, losses continue for years, and the patent overhang creates real uncertainty. 10x requires sustained execution across a decade plus successful expansion into delirium and stroke.

**Confidence on 5x:** 70-75%
Just executing the core seizure detection business at current growth rates gets them to $350-400M revenue in 6-7 years. At 88% gross margins that's a $3-4B company — roughly 5x from today without needing any new indications.

**Bull case:**
EEG becomes a standard vital sign. Every ICU patient with altered mental status automatically gets Ceribell the way chest pain patients get an EKG. Delirium and stroke indications commercialize successfully using existing hardware and sales force. VA expansion accelerates. Company reaches $500M+ revenue by 2032. Acquired by Medtronic or GE at a premium or trades at 10-15x revenue as a profitable high-growth medtech platform.

**Bear case:**
ITC patent case goes against Ceribell in September 2026. Natus competes freely with a near-identical product, forcing price competition and margin erosion. Hospital adoption stalls below 20% penetration. A large competitor builds a superior product with existing hospital relationships. Losses continue without a clear path to profitability and the company needs to raise capital at a dilutive valuation.

**Key dates:**
- September 25-26, 2026 — ITC patent ruling — MAJOR POP if Ceribell wins, MAJOR DROP if they lose
- Q4 2026 / Q1 2027 — Delirium full commercial launch — POP if early adoption data is strong
- Every quarterly earnings — POP if revenue growth stays above 25% and guidance raises, DROP if growth decelerates or guidance cuts
- Any news of Medtronic/GE/Philips entering point-of-care EEG — DROP
- Any news of Jane Chao departure — DROP
