# Replace the Ardoq application register

## Export the application records

Read [Ardoq's report instructions](https://help.ardoq.com/en/articles/43935-how-to-create-a-report), checked 10 October 2026. Create or open a report filtered to application components. Include stable component IDs, names and the fields you want to retain. Export JSON. Alternatively export Excel and save the application sheet as UTF-8 CSV. The importer does not read XLS or XLSX directly.

Report fields and envelopes vary with your workspace. Inspect the first few records and build an explicit mapping if needed. `fixtures/ardoq-applications.json` is synthetic and uses `_id` and `name` from the [vendor API tutorial](https://help.ardoq.com/en/articles/44146-rest-api-tutorial). It is not evidence that every Ardoq report has this exact layout.

## Prepare an empty destination

Use a separate DATA_DIR for local operation or a dedicated Postgres database. Run `npm run migrate` without `npm run seed`. Never merge the fictional demo into real records. Back up the export and keep it outside Git. Set the business identity in brand.json.

## One-command import

```bash
npm run portfolio -- import ardoq --file=/path/applications.json --actor="Migration operator" --dry-run
npm run portfolio -- import ardoq --file=/path/applications.json --actor="Migration operator"
```

The importer accepts an object array, or an array under `components`, `rows` or `data`. For another envelope use `--rows=export.items`. The following mapping illustrates custom column names and a nested field. Use `--map=/path/columns.json`:

```json
{"source_id":"Component ID","name":"Name","owner":"fields.owner","annual_cost":"Annual Cost","currency":"Currency"}
```

| Destination | Recognised export headings |
|---|---|
| Original ID | `_id`, `ID`, `Id`, `Component ID` |
| Name | `name`, `Name`, `Component Name` |
| Owner | `owner`, `Owner` |
| Capability | `capability`, `Capability` |
| Annual cost | `Annual Cost`, `annual_cost` |
| Currency | `Currency`, `currency` |
| Support end | `Support End`, `support_end` |
| Renewal date | `Renewal Date`, `renewal_on` |
| Personal information | `Personal Data`, `personal_data` |

Dates must be real YYYY-MM-DD dates. Costs are nonnegative decimals with up to two decimal places, without grouping or currency symbols. Supply annual cost and a three-letter uppercase currency together. No cost conversion or annualisation occurs. Personal-information values are true or false. Unknown values remain unknown and require review. Map nested owner objects to a scalar name rather than importing an object as a name.

Original IDs become unique source keys and `ARDOQ-<ID>` references. All original fields are preserved in `source_row.original`; mappings are preserved separately. Repeating identical source data skips the record without overwriting later local edits. A changed export or changed mapping rejects the entire batch for reconciliation. Duplicates, missing IDs, missing names, invalid dates and invalid values also roll back the entire batch. A dry run writes nothing, including activity and import-batch history.

## Reconcile before switching

Compare application count, source IDs, owners and per-currency cost totals against the original export. Inspect unknown costs and classifications. Imported applications are planned, not approved as current. Use `set-application` to classify personal data, assign an owner and capability, then `review` with real evidence and a next-review date.

References between components, surveys, diagrams, scenarios, users, permissions, attachments and decision history do not automatically carry across. Create verified dependencies with `add-dependency`. Map additional histories separately with Enterprise DNA or your coding agent. Evidence references do not copy files. Keep their protected archive and access rules.

Run both registers through a full review cycle. Reconcile dependency counts and trace several known impact paths. Confirm document outputs, backup recovery and team access before deciding to end a subscription. The importer does not cancel Ardoq or stop any business application. A focused application register can be imported in a day; a full architecture migration requires separate scoping.

## Export and recovery

`npm run portfolio -- export` writes all six record sets to a timestamped interchange structure in `exports/`. The output filename is unique and an explicit existing filename is never overwritten. It is a consistent database snapshot and preserves source data, relationships and audit records. There is no automatic restore command: retain tested database backups, migrations and the separate evidence files.
