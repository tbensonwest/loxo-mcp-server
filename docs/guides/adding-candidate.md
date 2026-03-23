# Adding a New Candidate

You've sourced someone new and need to get them into Loxo with their full details — name, contact info, current role, tags, and skillsets — all in one go.

## What to say to Claude

> "Add a new candidate: Jane Park, VP Engineering at Acme Corp, jane.park@acme.com, based in Austin TX. Tag her as 'executive' and 'engineering-leader'."

## What happens

1. **loxo_create_candidate** — Claude creates the candidate record with her name, email, current title, current company, and location
2. **loxo_list_skillsets** — looks up valid skillset IDs in your agency's configuration to find matches for relevant skills
3. **loxo_list_person_types** — looks up valid person type IDs (e.g. Candidate, Client Contact, Lead) to classify her correctly
4. **loxo_update_candidate** — sets tags, skillsets, person type, and source type on the newly created record

## Example output

> Done! I've added **Jane Park** to Loxo:
>
> - **Candidate ID:** 928471
> - **Name:** Jane Park
> - **Title:** VP Engineering
> - **Company:** Acme Corp
> - **Email:** jane.park@acme.com
> - **Location:** Austin, TX
> - **Tags:** executive, engineering-leader
> - **Person type:** Candidate
> - **Skillsets:** Engineering Management, Executive Leadership
>
> Want me to add her to a job pipeline or upload her resume?

## Tips

- Include a resume in the same request: "Add Jane Park as a candidate and here's her resume" — Claude will use `loxo_upload_resume` to attach it after creating the record
- Let Claude pick the right skillsets: "Add her as a candidate with relevant engineering leadership skills" and Claude will search your skillset list for the best matches
- Add multiple candidates in sequence: "Add these three people as candidates..." and Claude will create each one in turn
- You can specify the source type in your prompt: "Add her as a candidate, sourced from LinkedIn"
- Related guides: [Logging Activity After a Call](./logging-activity) for recording your first conversation with the new candidate
