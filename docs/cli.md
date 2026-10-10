# Application portfolio command guide

Use Node 20 or later. Run npm run migrate first. Every command accepts --json. Options use --name=value; quote values containing spaces. --json and --dry-run are bare flags. Unknown or duplicate options fail. Required values are checked before any record is committed.

| Command | Options |
|---|---|
| help | None |
| applications | None |
| application | --app |
| review-queue | None |
| renewals-due | None |
| lifecycle-risks | None |
| costs | None |
| duplicates | None |
| owner-workload | None |
| dependency-review | None |
| compliance | None |
| attention | None |
| dependencies | --app |
| impact | --app |
| decisions | --app |
| activity | --app |
| weekly-review | None |
| add-application | --reference, --name, --owner, --capability, --cost, --currency, --actor |
| set-application | --app, --name, --owner, --capability, --cost, --currency, --support-end, --renewal-on, --personal-data, --actor |
| review | --app, --due, --evidence, --actor |
| add-dependency | --consumer, --provider, --kind, --critical, --evidence, --date, --actor |
| remove-dependency | --id, --evidence, --actor |
| verify-dependency | --id, --evidence, --date, --actor |
| attest-control | --app, --kind, --evidence, --due, --actor |
| propose-decision | --app, --action, --rationale, --evidence, --due, --actor |
| approve-decision | --id, --actor |
| record-retirement | --app, --actor |
| log | --app, --note, --actor |
| draft-decision | --app |
| import | --file, --map, --rows, --dry-run, --actor |
| export | --out |

## Read behaviour

applications includes retired records. application returns the record, relationships, decisions, controls and activity. review-queue, renewals-due, lifecycle-risks and costs exclude retired records. compliance includes retired and unclassified records because stored personal information does not disappear when software retires. dependencies includes removed links; impact follows active links through nonretired consumers and terminates on cycles.

Cost totals group by currency and capability, including an unknown-cost group. duplicates groups active and retiring applications by the recorded capability. It is a candidate list, not proof of waste. Review date due means today or earlier; evidence review overdue means before today. Renewals and support dates include overdue rows and the next ninety days. Dependency verification older than ninety days is a local policy exception. Dates use database UTC.

## Changes

All writes require --actor and run in a transaction. A table lock serialises mutators in shared Postgres. Actor names are not authenticated identities. add-application requires reference and name and starts planned. Supply cost with currency, or neither. set-application changes only its listed fields and cannot directly set lifecycle. Personal-data values must be true or false. Dates are strict YYYY-MM-DD, and empty support-end or renewal-on clears that optional date.

review requires app, due and evidence. Owner, capability and personal-data classification must be set before it activates a planned record. attest-control requires app, kind=security|retention, evidence and due. Both use today's review date and reject a past next-review date.

add-dependency requires consumer, provider, kind and evidence. Critical defaults to true. Date defaults to today and cannot be future. Self-links fail. verify-dependency refreshes evidence and date on an active link. remove-dependency requires evidence and marks the link removed while preserving its prior state in activity.

propose-decision requires app, action=retain|invest|migrate|retire, rationale, evidence and due. approve-decision accepts only a current proposed decision. Application and relationship changes invalidate old versions. Retirement decisions also check active consumers and evidence gaps. record-retirement checks these again and requires a current approved retirement decision. It updates only the register. There is no automatic service shutdown.

log records a supplied note. draft-decision writes an internal review file. export writes a consistent snapshot of all six record sets and refuses to overwrite a file. import ardoq requires file and actor, with optional map, rows and dry-run; read replace-ardoq.md.

All read and write examples live in the matching .claude/commands recipe. Replace placeholder dates and evidence with real values.
