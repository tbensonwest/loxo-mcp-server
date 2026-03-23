# Loxo MCP Server — Documentation Site Design

**Date:** 2026-03-23
**Status:** Draft

## Overview

A documentation site for the Loxo MCP Server that helps recruiters understand what they can do with Claude + Loxo, and helps developers install and configure the server.

**Primary audience:** End users (recruiters) who want workflow recipes and tool guidance.
**Secondary audience:** Developers who need installation, configuration, and contribution docs.

## Tech Stack & Deployment

- **Framework:** VitePress (latest)
- **Hosting:** GitHub Pages
- **Source:** `docs/` directory in repo root
- **Deploy:** GitHub Action triggered on push to `main` when VitePress source files change (specific paths: `docs/.vitepress/**`, `docs/index.md`, `docs/getting-started/**`, `docs/guides/**`, `docs/reference/**`) — builds VitePress, deploys to GitHub Pages
- **Theme:** Default VitePress theme, no customization

The existing `docs/plans/` and `docs/superpowers/` directories are internal dev docs. They are excluded from the VitePress site via `srcExclude: ['plans/**', 'superpowers/**']` in `.vitepress/config.ts`, which prevents VitePress from rendering them even if accessed directly.

## Site Structure

### Navigation (sidebar)

```
Getting Started
  Introduction
  Installation & Setup

Guides
  Preparing a Briefing Pack
  Pipeline Status Update
  Matching Candidates to a Role
  Adding a New Candidate
  Logging Activity After a Call

Reference
  Candidates
  Jobs & Pipeline
  Activities & Tasks
  Companies & Data
  Candidate Management
```

### Page Descriptions

**Landing page (`index.md`):**
- VitePress hero layout with tagline ("Give Claude direct access to your Loxo recruitment platform")
- 3-4 feature cards: 27 tools, workflow-first design, intake-aware intelligence, pipeline management
- Quick links: "Get Started" and "Browse Guides"

**Introduction (`getting-started/introduction.md`):**
- What is MCP and what this server does
- What you can ask Claude to do with it
- High-level overview of tool categories

**Installation & Setup (`getting-started/installation.md`):**
- Smithery install (easiest)
- Local install (clone, npm install, build)
- Docker install
- Claude Desktop configuration (local and Docker JSON snippets)
- Environment variables (LOXO_API_KEY, LOXO_AGENCY_SLUG, LOXO_DOMAIN)

### Guide Pages

Each guide follows this structure:
1. **Scenario** — one-sentence description of when you'd use this
2. **What to say to Claude** — the actual prompt, quoted
3. **What happens** — numbered steps showing which tools Claude calls and why
4. **Example output** — what Claude's response looks like
5. **Tips** — variations, things to watch for

**Guides:**

| Page | File | Scenario |
|------|------|----------|
| Preparing a Briefing Pack | `guides/briefing-pack.md` | You need to prepare a client-ready summary of all candidates on a role |
| Pipeline Status Update | `guides/pipeline-status.md` | You want a quick status update on where every candidate stands |
| Matching Candidates to a Role | `guides/candidate-matching.md` | A new role just opened and you want to find existing candidates who fit |
| Adding a New Candidate | `guides/adding-candidate.md` | You've sourced someone new and need to get them into Loxo with full details |
| Logging Activity After a Call | `guides/logging-activity.md` | You just finished a call and need to record what happened |

### Reference Pages

Each reference page follows this structure:
1. **Category intro** — one paragraph on what this group of tools covers
2. **Per-tool sections** — for each tool:
   - Description (what it does, when to use it)
   - Parameters table (name, type, required, description)
   - Example usage (prompt that triggers it, what it returns)
   - Related tools (links to tools commonly used together)

**Reference pages and their tools:**

| Page | File | Tools |
|------|------|-------|
| Candidates | `reference/candidates.md` | `loxo_search_candidates`, `loxo_get_candidate`, `loxo_get_candidate_brief`, `loxo_get_person_emails`, `loxo_get_person_phones`, `loxo_list_person_job_profiles`, `loxo_get_person_job_profile_detail`, `loxo_list_person_education_profiles`, `loxo_get_person_education_profile_detail` |
| Jobs & Pipeline | `reference/jobs-pipeline.md` | `loxo_search_jobs`, `loxo_get_job`, `loxo_get_job_pipeline`, `loxo_add_to_pipeline` |
| Activities & Tasks | `reference/activities-tasks.md` | `loxo_get_candidate_activities`, `loxo_log_activity`, `loxo_schedule_activity`, `loxo_get_todays_tasks`, `loxo_get_activity_types` |
| Companies & Data | `reference/companies-data.md` | `loxo_search_companies`, `loxo_get_company_details`, `loxo_list_users`, `loxo_list_skillsets`, `loxo_list_source_types`, `loxo_list_person_types` |
| Candidate Management | `reference/candidate-management.md` | `loxo_create_candidate`, `loxo_update_candidate`, `loxo_upload_resume` |

## File Layout

```
docs/
  .vitepress/
    config.ts
  index.md
  getting-started/
    introduction.md
    installation.md
  guides/
    briefing-pack.md
    pipeline-status.md
    candidate-matching.md
    adding-candidate.md
    logging-activity.md
  reference/
    candidates.md
    jobs-pipeline.md
    activities-tasks.md
    companies-data.md
    candidate-management.md
```

**Total: 13 markdown files + 1 config file.**

## Package Changes

**New devDependency:**
- `vitepress` (latest)

**New scripts in `package.json`:**
- `docs:dev` — `vitepress dev docs`
- `docs:build` — `vitepress build docs`
- `docs:preview` — `vitepress preview docs`

## GitHub Action

New workflow: `.github/workflows/docs.yml`

- **Trigger:** Push to `main` when VitePress source files change (specific paths to avoid triggering on internal dev docs — see Tech Stack section)
- **Steps:** Checkout → install deps → `npm run docs:build` → deploy to GitHub Pages
- **Note:** Requires GitHub Pages to be configured for the repo (Settings → Pages → Source: GitHub Actions)

## Content Source

Most content can be derived from the existing README.md:
- Installation sections map directly to `installation.md`
- Workflow examples map to the first 3 guides
- Tool descriptions map to reference pages
- 2 new guides (adding candidate, logging activity) need to be written fresh

## Gitignore Additions

Add to `.gitignore`:
- `docs/.vitepress/dist/`
- `docs/.vitepress/cache/`

## Out of Scope

- Custom theme or branding
- Search (VitePress has built-in local search if needed later)
- Versioned docs
- Changelog page
- i18n
- API playground / interactive examples
