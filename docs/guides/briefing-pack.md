# Preparing a Briefing Pack

You need to prepare a client-ready summary of all candidates on a role before a progress call or submission meeting.

## What to say to Claude

> "Prepare a briefing pack for the CapEQ role."

## What happens

1. **loxo_search_jobs** — Claude searches your jobs for "CapEQ" and finds the matching role with its ID
2. **loxo_get_job_pipeline** — pulls every candidate currently on that job, along with their pipeline stage (Sourced, Screened, Interviewing, Offer, etc.)
3. **loxo_get_candidate_brief** (per candidate) — for each candidate on the pipeline, Claude pulls their full profile including intake notes, contact details, and recent intel-rich activities (calls, emails, recruiter notes)
4. Claude compiles the results into a structured briefing document ready to share with your client

## Example output

> Here's the briefing pack for **CapEQ — VP Finance** (Job #4821):
>
> ---
>
> ### Interviewing
>
> **Sarah Chen**
> - **Current role:** Director of Finance, Meridian Capital
> - **Compensation:** $185k base + 15% bonus; seeking $200-210k base + equity
> - **Key motivations:** Wants equity upside and a seat at the leadership table. Mentioned she's been passed over for promotion twice — ready to move.
> - **Last contact:** Phone screen on March 15 — strong interest, available to interview week of March 24
> - **Notes:** Has PE fund accounting experience from her time at Blackstone. Client specifically asked about this.
>
> **Marcus Rivera**
> - **Current role:** VP Finance, Greenfield Holdings
> - **Compensation:** $195k base + 20% bonus; open to lateral on base if equity is meaningful
> - **Key motivations:** Current company is being acquired — uncertain about new leadership. Prefers a growth-stage environment.
> - **Last contact:** Email on March 12 — sent him the job spec, he replied same day asking to set up a call
> - **Notes:** CPA + MBA (Wharton). 3 years in Big 4 audit before moving into industry.
>
> ---
>
> ### Screened
>
> **Priya Nair**
> - **Current role:** Senior Finance Manager, Atlas Biotech
> - **Compensation:** $160k base; looking for a step up to VP level at $180k+
> - **Key motivations:** Wants to move from pharma into tech/fintech. Impressed by the CapEQ product during our call.
> - **Last contact:** Intake call on March 8 — detailed notes on file. She's a stretch on seniority but strong on culture fit.
> - **Notes:** Could be a value hire if client is open to developing someone. Has managed a team of 4.
>
> ---
>
> ### Sourced
>
> **David Park**
> - **Current role:** Controller, Ridgeline Ventures
> - **Compensation:** Unknown — haven't connected yet
> - **Key motivations:** Unknown
> - **Last contact:** InMail sent March 18, no response yet
> - **Notes:** Profile looks strong on paper. 12 years in finance, last 5 in VC/PE-backed companies.
>
> ---
>
> **Summary:** 4 candidates on the pipeline. 2 are actively interviewing and engaged, 1 screened and interested, 1 sourced but not yet responsive. Recommend prioritising Sarah Chen — she's the strongest match on experience and is ready to move quickly.

## Tips

- Ask for a subset: "Prepare a briefing pack for the CapEQ role, just the candidates in Interviewing stage"
- Change the format: "Prepare a briefing pack for CapEQ as a table I can paste into an email"
- Add specific focus areas: "Include compensation expectations and notice periods for each candidate"
- Related guides: [Pipeline Status Update](./pipeline-status) for a quicker, less detailed overview
