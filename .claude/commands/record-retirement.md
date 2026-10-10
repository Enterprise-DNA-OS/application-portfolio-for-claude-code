---
description: record retirement for the application portfolio
---

# record-retirement

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- record-retirement --app=APP-01 --actor="Operator"
```

Confirm an actual decision to retire. This only records retirement: it does not shut down a service, cancel a contract or delete data. Dependent applications and missing evidence block it.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
