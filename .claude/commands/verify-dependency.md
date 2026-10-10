---
description: verify dependency for the application portfolio
---

# verify-dependency

Read CLAUDE.md and docs/cli.md. Replace example values with verified operator details.

```bash
npm run portfolio -- verify-dependency --id=DEPENDENCY-ID --evidence="archive://tested-connection" --actor="Operator"
```

Read the dependency and both application records. Refresh the date only from an actual verification event. Removed connections cannot be verified.

Append --json for structured output. Ambiguous references must be resolved before continuing. Never send, stop a service or delete records.
