# Matching Candidates to a Role

A new role just opened and you want to find existing candidates in your database who could be a fit, before you start sourcing externally.

## What to say to Claude

> "Who from our database would suit this new CFO role?"

## What happens

1. **loxo_search_candidates** — Claude searches your candidate database by title, skills, sector, and tags using Lucene queries to find potential matches
2. **loxo_get_candidate_brief** (for shortlisted candidates) — for the most promising results, Claude reviews their intake notes, activity history, and recruiter notes to assess genuine fit and current availability
3. Claude surfaces the best matches with supporting evidence drawn from your own recruiter notes and conversations

## Example output

> I searched your database for candidates with CFO, VP Finance, and senior finance leadership backgrounds. Here are the strongest matches:
>
> ---
>
> ### 1. Michael Torres — Former CFO, NovaBridge Capital
>
> **Why he fits:** 15 years in finance leadership, last 6 as CFO at a PE-backed SaaS company ($80M revenue). Has led two fundraising rounds and an M&A integration. Your intake notes mention he's "looking for another growth-stage CFO seat, ideally Series C or later."
>
> **Availability:** Left NovaBridge in January after a successful exit. Currently consulting but actively looking. Last spoke March 5 — he said he'd be interested in anything PE-backed in the $50-150M range.
>
> **Compensation:** Was at $280k base + 30% bonus + 0.5% equity. Looking for similar or better.
>
> ---
>
> ### 2. Rachel Adeyemi — VP Finance, Crestline Health
>
> **Why she fits:** 10 years in finance, currently running a team of 12 across FP&A, accounting, and treasury. Your notes say she's "ready for the CFO title — has the skills, just needs a company willing to give her the seat." Industry is healthcare, not an exact match, but financial complexity is comparable.
>
> **Availability:** Employed but open. Mentioned in your last call (February 22) that she'd move for the right opportunity, especially if it comes with board exposure.
>
> **Compensation:** Currently $210k base + 20% bonus. Would need $230k+ to move.
>
> ---
>
> ### 3. Daniel Cho — Director of Finance, Elevate Logistics
>
> **Why he fits:** Strong operational finance background — has built out reporting infrastructure and implemented NetSuite at two companies. Your notes describe him as "incredibly detail-oriented, would be a great #2 or a strong first-time CFO at a smaller company."
>
> **Availability:** Casually looking. Last contact was a check-in email on January 30 — he responded but said timing wasn't right. Worth re-engaging now that you have a specific role.
>
> **Compensation:** $175k base. Would need $200k+ for a CFO title.
>
> ---
>
> **My recommendation:** Michael Torres is the standout — he's immediately available, has done the exact job before, and is in your target comp range. Rachel Adeyemi is the dark horse if the client is open to a first-time CFO with strong fundamentals. Daniel Cho is worth a call if you need a deeper bench.

## Tips

- Combine criteria: "Search for CFO or VP Finance candidates with PE experience in the healthcare sector"
- Narrow by location: "Who in our database near Chicago would suit this role?"
- Ask Claude to explain its reasoning: "Why did you shortlist each of these candidates?"
- Use tags: "Search for candidates tagged 'finance-leadership' or 'C-suite'"
- Start with more and filter down: "Show me the top 10, then I'll tell you which ones to dig deeper on"
- Related guides: [Preparing a Briefing Pack](./briefing-pack) once you've added candidates to the pipeline
