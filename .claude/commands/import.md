---
description: import for the application portfolio
---

# import

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- import ardoq --file=/path/applications.json --actor="Operator" --dry-run
```

Read docs/replace-ardoq.md first. Inspect actual export headings and restrict the export to applications. Start with a dry run, reconcile counts and currency totals, then repeat without --dry-run when asked to import. Never use the demo database for business data.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
