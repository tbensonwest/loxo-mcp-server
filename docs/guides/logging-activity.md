# Logging Activity After a Call

You just finished a call and need to record what happened — the key takeaways, any decisions made, and any follow-up actions — without switching tabs or filling out forms.

## What to say to Claude

> "Log a call with Sarah Chen. We discussed the CapEQ role — she's interested but wants to wait until after her bonus in April. Schedule a follow-up call for April 15."

## What happens

1. **loxo_search_candidates** — Claude searches for "Sarah Chen" and finds her person ID
2. **loxo_get_activity_types** — gets the activity type ID for "Call" from your agency's configured activity types
3. **loxo_search_jobs** — finds the CapEQ job ID so the activity can be linked to the right role
4. **loxo_log_activity** — records the completed call with notes capturing the bonus timing, her interest level, and the CapEQ connection
5. **loxo_schedule_activity** — creates a follow-up call task for April 15 so it shows up in your task list

## Example output

> All logged! Here's what I recorded for **Sarah Chen** (ID #81204):
>
> **Completed activity:**
> - **Type:** Call
> - **Job:** CapEQ — VP Finance (#4821)
> - **Notes:** Discussed the CapEQ VP Finance role. Sarah is interested but wants to wait until after her annual bonus pays out in April before making any moves. She's open to interviewing in late April. Compensation expectations align with the role — currently at $185k base + 15% bonus.
> - **Date:** March 23, 2026
>
> **Scheduled follow-up:**
> - **Type:** Call
> - **Date:** April 15, 2026
> - **Notes:** Follow up re: CapEQ VP Finance — bonus should have paid out by now. Confirm interview availability.
>
> You'll see the follow-up in your tasks for April 15.

## Tips

- Log different activity types: "Log an email with Marcus Rivera about the Greenfield offer" or "Log a meeting with the CapEQ hiring manager"
- Link to a company: "Log a call with Sarah Chen at Meridian Capital about the CapEQ role" — Claude will associate the activity with both the candidate and the company
- Batch multiple activities: "Log calls with Sarah Chen, Marcus Rivera, and Priya Nair — here's what we discussed with each..."
- Skip the job link if it's a general check-in: "Log a call with David Park — just a quick intro, he's open to hearing about opportunities"
- Related guides: [Preparing a Briefing Pack](./briefing-pack) to compile all your logged activity notes into a client-ready summary
