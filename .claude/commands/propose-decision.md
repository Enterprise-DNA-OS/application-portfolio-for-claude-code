---
description: propose decision for the application portfolio
---

# propose-decision

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- propose-decision --app=APP-01 --action=retain --rationale="Actual reason" --evidence="archive://assessment" --due=YYYY-MM-DD --actor="Operator"
```

Read the relevant application and history before any change. Present actual records, dates and named owners. Do not infer missing facts.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
