# Application Portfolio for Claude Code

Know which applications to renew, replace or retire before a forgotten dependency stops the business. Your application inventory, ownership, costs and decisions live in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT licensed. Install and test the fictional portfolio. | Your application fields, review rules, Ardoq mappings and business views. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=ardoq&utm_source=github&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=ardoq&utm_source=github&utm_medium=managed) |

For the owner or technology lead who reviews application spend and the people, services and data affected by a change. Works with Claude Code, Codex, OpenCode or Cursor. Ardoq is an enterprise architecture platform with a wider modelling and collaboration scope. This base covers application portfolio operations. See [scope and research](docs/research.md).

## Quick start

Node 20 or later on Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/application-portfolio-for-claude-code.git
cd application-portfolio-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

The demo uses fictional Harbour records and dates relative to the first seed. It includes expired support, a missed renewal, a retired archive with missing privacy evidence, two applications serving the same capability and a three-step dependency chain. Repeated seeds preserve changes.

Local PGlite stores records in `.data/db`. No server is needed. `DATABASE_URL` selects Postgres 15 or later. Local operation permits one process at a time. Use a separate `DATA_DIR`, migrate without seeding, and read the [replacement guide](docs/replace-ardoq.md) before importing business records.

## The five weekly jobs

1. `/review-queue`: assign missing owners and review dates.
2. `/dependency-review`: verify stale connections before planning changes.
3. `/lifecycle-risks`: find unsupported applications and their consumers.
4. `/renewals-due`: decide what to retain before renewal dates arrive.
5. `/weekly-review`: bring decisions, evidence and deadlines into one meeting.

There are 31 CLI commands and 32 slash recipes. Every CLI command supports `--json`. Run `npm run portfolio -- help` for the option list, or read [the command guide](docs/cli.md). Names match without case and IDs accept unique prefixes. Ambiguous matches list candidates and exit 1.

## Ten questions for your application review

Ardoq has configurable reporting, dependency analysis and its own agent connection. These are ten questions this free base answers today, not claims that Ardoq cannot produce the same analysis.

| Question | Command |
|---|---|
| Which applications lack an owner or a current review? | `review-queue` |
| Which support deadlines arrive within ninety days, including missed dates? | `lifecycle-risks` |
| What would be affected indirectly if Harbour orders stopped? | `impact --app=APP-01` |
| Which recorded connections have not been verified for ninety days? | `dependency-review` |
| Which application renewals are due within ninety days or already late? | `renewals-due` |
| Where do two active applications serve the same capability? | `duplicates` |
| What is the recorded annual cost by capability and currency? | `costs` |
| Which application costs are still unknown? | `costs` |
| Which proposed decisions became stale after a record changed? | `decisions` |
| Which retired applications still need a personal-information evidence review? | `compliance` |

Overlap identifies a review candidate, not wasted spend. An unknown cost is not zero. Currencies are never totalled together. Renewal dates do not imply a cancellation notice deadline. Impact follows recorded active dependencies, including noncritical connections, and cannot discover missing connections.

## Your first hour: ten things to ask for

1. Put our name and colours on the review documents.
2. Show missing owners and review dates.
3. Follow every downstream dependency of an application.
4. Separate NZD and AUD costs and keep missing costs visible.
5. Find overlapping applications before our next renewal meeting.
6. Draft a decision brief for the oldest unsupported application.
7. Show the personal-information evidence still needed for retired systems.
8. Test our Ardoq export without saving changes.
9. Add a business-unit field with a migration through `/customise`.
10. Add a read-only view for our monthly architecture meeting through `/new-view`.

## Import Ardoq

```bash
npm run portfolio -- import ardoq --file=applications.json --actor="Migration operator" --dry-run
npm run portfolio -- import ardoq --file=applications.json --actor="Migration operator"
```

The importer accepts application components from Ardoq JSON exports, with explicit mappings for custom export headings, or a CSV saved from its Excel report. Export only application records. The synthetic fixture uses the vendor's documented component IDs and names; it is not a captured customer export. Original fields are preserved. Changed repeats and duplicate IDs are rejected atomically. Imported applications start planned and require ownership, capability and personal-information classification before review activates them.

Relationships, permissions, surveys, attachments and decision history require a separate reconciliation. This is a one-command application-register import, not a complete account migration. [Exact mappings, exclusions and switch checks](docs/replace-ardoq.md).

## Evidence, decisions and paperwork

`npm run docs` creates application decision briefs, evidence reviews and renewal briefs as branded HTML. `npm run view` produces two read-only snapshots for weekly reviews and rationalisation. Change `brand.json` once to set your name, logo and colours. Output is local, ignored by Git, and can be printed to PDF.

An approved retirement decision becomes stale when the application or its connections change. Retirement is blocked while live consumers remain or personal-information evidence reviews are missing or overdue. Recording retirement updates the register only. It never shuts down a service, cancels a contract or deletes data.

[Compliance](docs/compliance.md) documents NZ privacy Principles 5 and 9, AU APP 11 and the local review policies. Evidence references are operator assertions, not inspected documents or certification. Shared deployments require authenticated operators, restricted access and tested backups. See [why there is no front end](docs/why-no-front-end.md).

## Verification

`npm test` uses a temporary database and exercises all commands, repeated seeds and migrations, JSON and CSV import rollback, custom field mappings, unknown values, currency separation, dependency cycles, stale approvals, retirement guards, drafts, full exports and escaped HTML. The same suite can use a fresh disposable Postgres database through `TEST_DATABASE_URL`. GitHub checks are configured for Linux, Windows and Postgres.

The six exported record sets preserve application records, relationships, decisions, controls, activity and import batches. Back up the database and referenced evidence files separately. The export is an interchange snapshot, not an automatic restore command.

MIT licence. Not affiliated with Ardoq or Anthropic. Hosting and agent use have separate costs. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=ardoq&utm_source=github&utm_medium=readme).
