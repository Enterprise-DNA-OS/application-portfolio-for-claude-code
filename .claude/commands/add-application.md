---
description: add application for the application portfolio
---

# add-application

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- add-application --reference=APP-NEW --name="New application" --owner="Owner" --capability="Order management" --actor="Operator"
```

Read the relevant application and history before any change. Present actual records, dates and named owners. Do not infer missing facts.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
