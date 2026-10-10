# Application Portfolio for Claude Code: operating instructions

For the owner or technology lead reviewing software ownership, support, renewals and dependencies. Configure the business identity in brand.json. Harbour data is fictional.

Every answer starts with current CLI data. Read a full application and its dependencies before changing it. Unknown costs and classifications stay unknown. Match records by reference or a unique name or ID prefix; list ambiguous candidates and stop the change.

Never send, cancel a subscription, shut down a service or delete data. Drafts are internal review documents. Retirement changes the register only. Evidence references and operator names are assertions, not verified documents or authenticated signatures. Read docs/compliance.md before explaining any evidence check.

## One route for each job

| Job | Recipe |
|---|---|
| applications | /applications |
| application | /application |
| review queue | /review-queue |
| renewals due | /renewals-due |
| lifecycle risks | /lifecycle-risks |
| costs | /costs |
| duplicates | /duplicates |
| owner workload | /owner-workload |
| dependency review | /dependency-review |
| compliance | /compliance |
| attention | /attention |
| dependencies | /dependencies |
| impact | /impact |
| decisions | /decisions |
| activity | /activity |
| weekly review | /weekly-review |
| add application | /add-application |
| set application | /set-application |
| review | /review |
| add dependency | /add-dependency |
| remove dependency | /remove-dependency |
| verify dependency | /verify-dependency |
| attest control | /attest-control |
| propose decision | /propose-decision |
| approve decision | /approve-decision |
| record retirement | /record-retirement |
| log | /log |
| draft decision | /draft-decision |
| import | /import |
| export | /export |
| customise | /customise |
| new view | /new-view |

Run npm run portfolio -- help for options. Every command accepts --json. Recipes live only in .claude/commands. Use the same database and commands from Claude Code, Codex, OpenCode or Cursor.

Migrations and fictional seeds live in supabase/. scripts/portfolio.mjs is the one CLI. brand.json, views.json and documents.json define read-only review outputs. drafts/, views/, docs-out/, exports/ and imports/ contain private output and stay out of Git. fixtures/ contains synthetic examples only.

Use one process at a time for local PGlite. DATABASE_URL selects Postgres with verified TLS. The portfolio schema is private and has no public row policies. Shared operation needs authenticated users, restricted permissions and tested backups. Do not expose an owner database connection as a public API.

Omni by Enterprise DNA installs and runs your version: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=ardoq&utm_medium=instructions
