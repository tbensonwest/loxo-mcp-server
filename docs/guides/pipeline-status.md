# Pipeline Status Update

You want a quick status update on where every candidate stands so you can plan your day or prep for a check-in call.

## What to say to Claude

> "Give me a status update on all active candidates."

## What happens

1. **loxo_get_job_pipeline** — Claude retrieves all candidates on the role with their current pipeline stage
2. **loxo_get_candidate_brief** (per candidate) — for each candidate, Claude pulls intake notes and recent activity to understand where the conversation stands
3. Claude delivers a concise status summary showing each candidate's stage, last contact, and suggested next step

## Example output

> Here's the pipeline status for **Greenleaf Partners — Head of Talent** (Job #3195):
>
> | Candidate | Stage | Last Contact | Next Step |
> |-----------|-------|-------------|-----------|
> | **Aisha Thompson** | Offer | Call, March 20 — verbal acceptance at $175k, waiting on written offer from client | Follow up with client for offer letter by EOD Tuesday |
> | **James Whitfield** | Interviewing | Email, March 19 — completed final round, panel feedback was positive | Chase client for debrief and decision timeline |
> | **Nora Fitzpatrick** | Interviewing | Call, March 14 — she's also interviewing at two other firms, expects to decide by end of month | Schedule a check-in call this week to gauge temperature |
> | **Ryan Okafor** | Screened | Intake call, March 10 — interested but has a 90-day notice period | Flag notice period to client; park unless others fall through |
> | **Elena Vasquez** | Sourced | LinkedIn message, March 17 — no response | Send a follow-up message or try email |
>
> **Quick take:** Aisha is close to landing — make sure the offer letter goes out this week. James is the backup if Aisha falls through. Nora needs attention before she accepts elsewhere. Ryan and Elena are lower priority right now.

## Tips

- Specify a job: "Give me a status update on the Greenleaf Head of Talent pipeline"
- Filter by stage: "Which candidates haven't been contacted in the last two weeks?"
- Ask for action items: "What should I do today across all my active roles?"
- Ask for a specific format: "Give me the status as bullet points, not a table"
- Related guides: [Preparing a Briefing Pack](./briefing-pack) for a more detailed, client-ready version
