---
description: remove dependency for the application portfolio
---

# remove-dependency

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- remove-dependency --id=DEPENDENCY-ID --evidence="archive://migration-completed" --actor="Operator"
```

Confirm actual disconnection evidence. This updates the register only and preserves the relationship history.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
