---
description: approve decision for the application portfolio
---

# approve-decision

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- approve-decision --id=DECISION-ID --actor="Operator"
```

Read the decision, application and its dependencies first. The actor is operator-supplied. Never approve just because a proposal exists. Stale proposals require a fresh decision.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
