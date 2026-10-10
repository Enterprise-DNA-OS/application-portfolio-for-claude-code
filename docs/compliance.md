# Evidence checks and local policies

Sources checked 10 October 2026. The checker identifies missing or overdue evidence reviews. It does not inspect the underlying systems, prove a document is genuine, determine legal applicability or certify compliance.

## NZ-IPP5: storage and security

[Privacy Commissioner, Principle 5](https://www.privacy.org.nz/privacy-principles/5/) describes safeguards for personal information. For an application with personal information, or an unknown classification, the checker asks for a security evidence reference and a current review date. The reference should point to the responsible person's assessment of access, protection and relevant suppliers. The operator chooses the review interval. It is not a statutory ninety-day security rule.

## NZ-IPP9: retention

[Privacy Commissioner, Principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to lawful purposes. The checker asks for a retention assessment and its next review date, including on retired applications. The underlying assessment must address the actual purposes, other retention duties and any legal hold. There is no universal retention period. No command deletes data or lifts a hold.

## AU-APP11: security and disposal review

[OAIC APP 11 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information) covers reasonable security steps and, where applicable, destruction or de-identification when information is no longer needed, subject to exceptions. Confirm whether the business is an APP entity. The same security and retention evidence checks act as review prompts. They do not decide whether disposal is lawful.

## Local policy, not law

- Application reviews are due when their recorded date arrives. Missing owners and dates are exceptions.
- Support and renewal views include overdue records and the next ninety days. These dates come from the operator or import, not inferred contract terms.
- Dependency evidence older than ninety days is flagged. That interval is an internal default that `/customise` can change through a migration.
- Before activating an imported application, assign an owner, capability and personal-information classification.
- A retirement approval requires no active consumers and current security and retention evidence where relevant. The same checks run again when recording retirement.
- Application edits, reviews, control attestations and relationship changes invalidate earlier decision approvals through a version check. A note alone does not.

An actor name is entered by the operator, not authenticated or a legal signature. Database administrators can change history. For shared use, configure authenticated identities, least-privilege database access, evidence storage, backups and restore checks. The private portfolio schema revokes public access and enables row security without public policies. Do not expose an owner connection through a public API.
