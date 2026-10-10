---
description: add dependency for the application portfolio
---

# add-dependency

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- add-dependency --consumer=APP-02 --provider=APP-01 --kind="order feed" --evidence="archive://integration" --actor="Operator"
```

Consumer depends on provider. Verify the direction and actual evidence. Never infer an integration from similar names.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
