# Converting one sub-corporate cardholder to an employee

Written for: whoever runs the conversion by hand, one person at a time.

The short version: **reuse their credential, add a `users` row, re-point their card rows.**

You do **not** create a new `credentials` entry. Creating one would give them a second login and leave their
password behind. The existing credential is kept and its `role` flipped.

For the full procedure — who is eligible, what to do about members holding other services, verification, and
dropping the old column — see
[`docs/corporate-cards-cardholder-rekey-production-runbook.md`](../../../docs/corporate-cards-cardholder-rekey-production-runbook.md)
at the monorepo root.

Two databases are involved, on **separate MySQL servers**:

| Name used below | What it is | Holds |
|---|---|---|
| **Main Peko DB** | the platform's shared database, used by `users`, `others` and every other service | `credentials`, `corporateUsers`, `subCorporateUsers`, `users` |
| **Corporate Card DB** | the corporateCard service's own database (`DATABASE_NAME=corporate-cards`) | `cardIssuances`, `cardRequests`, `cardholderKyc`, `cardTransactions`, `cardReceipts`, `cardAuditLogs` |

There is no join between them. You read the ids out of one and type them into the other, which is why each
step below says which connection it belongs to.

The worked example below uses sub-corporate **57**, credential **1822**, corporate **153**, producing
employee **58**. Substitute your own.

---

## Step 1 — Look them up (Main Peko DB)

```sql
-- Main Peko DB
SELECT s.id AS subCorporateId, s.name, s.email, s.mobileNo, s.role, s.status, s.isDeleted,
       s.credentialId,
       cu.id AS corporateUserId
FROM   subCorporateUsers s
JOIN   corporateUsers cu ON cu.credentialId = s.corporateCredentialID
WHERE  s.id = 57;
```

Gives `credentialId = 1822` and `corporateUserId = 153`.

The join is not optional. `subCorporateUsers` stores **`corporateCredentialID`** — the corporate's *credential*
id — while `users` needs **`corporateUserId`**, the corporate's *row* id. They are different numbers, and
using the wrong one puts the employee under the wrong company.

---

## Step 2 — Create the employee row (Main Peko DB)

Same `credentialId`. That single value is what ties the new employee to the existing login.

```sql
-- Main Peko DB
INSERT INTO users (name, email, mobileNo, corporateUserId, credentialId, employeeId,
                   userAccessService, isActive, isDeleted, createdAt, updatedAt)
VALUES ('Aarav Sharma', 'aarav@peko.in', '9876543210', 153, 1822, NULL,
        '{"permission":[{"label":"Corporate Cards","hasAccess":true,
                         "role":"Employee","status":"ACTIVE","ref":null}]}',
        1, 0, NOW(), NOW());
```

Read the new id back — you need it in step 4:

```sql
-- Main Peko DB
SELECT id FROM users WHERE credentialId = 1822;   -- → 58
```

Three rules for that JSON:

- **`role`** is the literal `'Admin'` or `'Employee'`, matching `subCorporateUsers.role`. Never `null` —
  MySQL's `JSON_UNQUOTE` turns a JSON null into the four-character *string* `"null"`, and the People screen
  displays it verbatim.
- **`status`** copies `subCorporateUsers.status` as-is. Both use `PENDING` / `ACTIVE` / `INACTIVE`.
- **`isDeleted`** copies across too. A removed member stays hidden from the People list but still resolves on
  their old card rows, which is what keeps their history attributed to a name.

### If they already have a `users` row

Someone invited to Payroll/ESS already has one. **Do not insert a second.** Append the card membership to the
row they have, and use that row's id in step 4:

```sql
-- Main Peko DB
UPDATE users
SET    userAccessService = JSON_SET(
           COALESCE(userAccessService, JSON_OBJECT('permission', JSON_ARRAY())),
           '$.permission',
           JSON_ARRAY_APPEND(
               COALESCE(JSON_EXTRACT(userAccessService, '$.permission'), JSON_ARRAY()), '$',
               JSON_OBJECT('label','Corporate Cards','hasAccess',TRUE,
                           'role','Employee','status','ACTIVE','ref',NULL)))
WHERE  credentialId = 1822;
```

One credential must end up with exactly one `users` row:

```sql
-- Main Peko DB
SELECT credentialId, COUNT(*) FROM users GROUP BY credentialId HAVING COUNT(*) > 1;
```

Must return nothing.

---

## Step 3 — Flip the login (Main Peko DB)

```sql
-- Main Peko DB
UPDATE credentials SET role = 'USER' WHERE id = 1822;
```

Same username, same password — they simply log in again. A live session is not affected, so they must sign
out and back in to pick it up.

Skip this for a soft-deleted member: they no longer sign in, and their `users` row from step 2 is what their
card rows resolve against regardless of the credential's role.

---

## Step 4 — Move their card data (Corporate Card DB)

`57 → 58`, across all six tables that carry a cardholder:

```sql
-- Corporate Card DB
UPDATE cardIssuances    SET userId = 58 WHERE subCorporateId = 57;   -- their cards
UPDATE cardRequests     SET userId = 58 WHERE subCorporateId = 57;   -- new card / limit / unfreeze / physical
UPDATE cardholderKyc    SET userId = 58 WHERE subCorporateId = 57;   -- KYC
UPDATE cardTransactions SET userId = 58 WHERE subCorporateId = 57;   -- spend history
UPDATE cardReceipts     SET userId = 58 WHERE subCorporateId = 57;   -- receipts
UPDATE cardAuditLogs    SET userId = 58 WHERE subCorporateId = 57;   -- audit trail
```

If their KYC row was created by the vendor's callback it may have no corporate — that callback knows only the
handset:

```sql
-- Corporate Card DB
UPDATE cardholderKyc SET corporateId = 153 WHERE userId = 58 AND corporateId IS NULL;
```

---

## Step 5 — Check that person is done (both)

```sql
-- Corporate Card DB
SELECT 'cardIssuances'    t, COUNT(*) n FROM cardIssuances    WHERE subCorporateId = 57 AND userId IS NULL
UNION ALL SELECT 'cardRequests',     COUNT(*) FROM cardRequests     WHERE subCorporateId = 57 AND userId IS NULL
UNION ALL SELECT 'cardholderKyc',    COUNT(*) FROM cardholderKyc    WHERE subCorporateId = 57 AND userId IS NULL
UNION ALL SELECT 'cardTransactions', COUNT(*) FROM cardTransactions WHERE subCorporateId = 57 AND userId IS NULL
UNION ALL SELECT 'cardReceipts',     COUNT(*) FROM cardReceipts     WHERE subCorporateId = 57 AND userId IS NULL
UNION ALL SELECT 'cardAuditLogs',    COUNT(*) FROM cardAuditLogs    WHERE subCorporateId = 57 AND userId IS NULL;
```

All six must be **0**.

Then confirm 58 really is the same person as 57 — `users.id` and `subCorporateUsers.id` both start at 1 and
overlap completely, so an off-by-one is entirely plausible and no other check catches it:

```sql
-- Main Peko DB
SELECT 'was'    AS src, id, name, mobileNo FROM subCorporateUsers WHERE id = 57
UNION ALL
SELECT 'is now',        id, name, mobileNo FROM users             WHERE id = 58;
```

Name and mobile must match.

---

## What you deliberately leave alone

**Their credential.** Reused, not recreated — that is what preserves the password and the login.

**Every `*CredentialId` column in the Corporate Card DB** — `cardAuditLogs.actorCredentialId`,
`cardRequests.requestedByCredentialId` / `decidedByCredentialId`, `cardIssuances.credentialId` /
`limitUpdatedByCredentialId` / `stateUpdatedByCredentialId`, `cardholderKyc.credentialId`.

Those already hold *this* credential, because the old code stored the member's own credential rather than the
parent corporate's. Since the credential survives the conversion untouched, the audit trail stays continuous
with no rewriting. That is why this procedure is only four statements plus an insert.

**`subCorporateUsers`.** The old row stays. Nothing reads it for cards any more, and leaving it means step 5
can still prove the mapping was right.

---

## Do not drop `subCorporateId` yet

Only after **every** cardholder is converted and checked. Once that column is gone there is nothing left to
say which rows belonged to whom, and the pre-conversion dump is the only way back. That step, and the rebuild
of the generated dedupe columns that go with it, is section 10 of the full runbook.
