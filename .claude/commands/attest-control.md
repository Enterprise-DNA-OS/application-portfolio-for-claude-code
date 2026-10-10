---
description: attest control for the application portfolio
---

# attest-control

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- attest-control --app=APP-01 --kind=security --evidence="archive://assessment" --due=YYYY-MM-DD --actor="Operator"
```

Choose security or retention and read docs/compliance.md. Link the actual assessment and its operator-approved review date. Evidence paths are references, not document verification.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
